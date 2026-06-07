-- ============================================================================
-- Optimus Sphere POS — Supabase schema (Layer 1)
-- ----------------------------------------------------------------------------
-- Mirrors the data shapes the localStorage `store.js` currently uses, plus the
-- two pieces that must move into the DB to be safe across multiple tills:
--   * stock decrement  -> atomic, race-free guarded UPDATE inside create_sale()
--   * receipt numbers   -> a Postgres sequence (no more array.length + 1)
--
-- Run this in the Supabase SQL editor on a fresh project. It is idempotent
-- enough to re-run (IF NOT EXISTS / ON CONFLICT / seed guards), but it is
-- intended as the initial setup migration.
--
-- Scope note: RLS requires an authenticated session (shared shop login wired
-- in a later layer). No per-action restrictions yet. Realtime, users-auth, and
-- the JS data layer are later layers — NOT in this file.
-- ============================================================================

-- gen_random_uuid() is built into Postgres 15 (Supabase). pgcrypto is enabled
-- now so PIN hashing (crypt()/gen_salt()) is ready when auth is wired later.
create extension if not exists pgcrypto with schema extensions;

-- ─── Receipt number sequence ────────────────────────────────────────────────
-- Monotonic and concurrency-safe. Sequences are non-transactional, so a rolled
-- back sale may leave a gap in receipt numbers — expected and fine for receipts.
create sequence if not exists public.receipt_seq as bigint start with 1 increment by 1;

-- ─── products ───────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text    not null,
  category        text    not null,
  price           integer not null check (price >= 0),          -- whole KES
  stock           integer not null default 0 check (stock >= 0),-- hard backstop vs overselling
  sku             text    unique,                                -- nullable; multiple NULLs allowed
  low_stock_alert integer not null default 5 check (low_stock_alert >= 0),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists products_active_idx   on public.products (active);
create index if not exists products_category_idx on public.products (category);

-- ─── sales (header) ─────────────────────────────────────────────────────────
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  receipt_no      text    not null unique,
  subtotal        integer not null,
  discount_type   text    check (discount_type in ('flat','percent')),  -- nullable
  discount_value  integer,                                               -- as entered (KES or %)
  discount_amount integer not null default 0,                            -- computed amount
  total           integer not null,
  payment_method  text    not null check (payment_method in ('Cash','M-Pesa','Card')),
  amount_paid     integer,
  change          integer not null default 0,
  customer_name   text,                                                  -- flattens the customer object
  customer_phone  text,
  till_id         text,                                                  -- which till rang it (for reports)
  created_at      timestamptz not null default now()
);

create index if not exists sales_created_at_idx on public.sales (created_at desc);

-- ─── sale_items (detail) ────────────────────────────────────────────────────
-- name + unit_price are SNAPSHOTTED at sale time so historical receipts stay
-- correct even after a product's price changes or it is deleted.
create table if not exists public.sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales(id)    on delete cascade,     -- delete sale -> delete its lines
  product_id  uuid          references public.products(id) on delete set null,    -- keep history if product removed
  name        text    not null,
  unit_price  integer not null check (unit_price >= 0),
  qty         integer not null check (qty > 0),
  subtotal    integer not null check (subtotal >= 0)
);

create index if not exists sale_items_sale_id_idx    on public.sale_items (sale_id);
create index if not exists sale_items_product_id_idx on public.sale_items (product_id);

-- ─── settings (single row) ──────────────────────────────────────────────────
-- The boolean PK pinned to TRUE enforces exactly one row.
create table if not exists public.settings (
  id                  boolean primary key default true check (id = true),
  shop_name           text    not null default 'Optimus Sphere Tech',
  address             text,
  phone               text,
  currency            text    not null default 'KES',
  tax_rate            integer not null default 0,
  receipt_footer      text,
  low_stock_threshold integer not null default 5,
  updated_at          timestamptz not null default now()
);

-- ─── users (structure only) ─────────────────────────────────────────────────
-- Roles/PINs were removed from the app; this table is here for the future
-- re-introduction. pin_hash holds a crypt() hash (never plaintext) — auth is
-- wired in a later layer, so it is nullable for now.
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null default 'cashier' check (role in ('manager','cashier')),
  pin_hash   text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── updated_at trigger for settings ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- create_sale(): the atomic checkout. Replaces addSale + decrementStock.
-- ----------------------------------------------------------------------------
-- The whole sale runs in ONE transaction (a plpgsql function is atomic):
--   1. take a receipt number from the sequence
--   2. insert the sales header
--   3. for each line: guarded stock decrement, then insert the sale_item
--   4. if ANY line lacks stock, raise -> the entire sale rolls back (no
--      partial sales, no overselling, even with several tills checking out
--      the same product at the same instant)
--
-- p_items is a JSON array of:
--   { "product_id": uuid, "name": text, "unit_price": int, "qty": int, "subtotal": int }
--
-- Returns the saved sale as JSON with a nested `items` array, matching the
-- shape the app already expects from a sale object.
-- ============================================================================
create or replace function public.create_sale(
  p_items          jsonb,
  p_payment_method text,
  p_subtotal       integer,
  p_total          integer,
  p_discount_type  text    default null,
  p_discount_value integer default null,
  p_discount_amount integer default 0,
  p_amount_paid    integer default null,
  p_change         integer default 0,
  p_customer_name  text    default null,
  p_customer_phone text    default null,
  p_till_id        text    default null
)
returns jsonb
language plpgsql
as $$
declare
  v_sale_id uuid;
  v_receipt text;
  v_item    jsonb;
  v_updated integer;
  v_result  jsonb;
begin
  -- 1. Unique, monotonic receipt number.
  v_receipt := 'OST-' || lpad(nextval('public.receipt_seq')::text, 4, '0');

  -- 2. Header.
  insert into public.sales (
    receipt_no, subtotal, discount_type, discount_value, discount_amount,
    total, payment_method, amount_paid, change, customer_name, customer_phone, till_id
  ) values (
    v_receipt, p_subtotal, p_discount_type, p_discount_value, p_discount_amount,
    p_total, p_payment_method, p_amount_paid, p_change, p_customer_name, p_customer_phone, p_till_id
  )
  returning id into v_sale_id;

  -- 3. Lines: guarded decrement + insert, all inside this transaction.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    -- Atomic & race-free: only decrements if enough stock remains right now.
    update public.products
       set stock = stock - (v_item->>'qty')::integer
     where id = (v_item->>'product_id')::uuid
       and stock >= (v_item->>'qty')::integer;

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      -- Insufficient stock (or product missing) -> abort everything.
      raise exception 'INSUFFICIENT_STOCK: % (requested %)',
        coalesce(v_item->>'name', v_item->>'product_id'),
        (v_item->>'qty')::integer
        using errcode = 'check_violation';
    end if;

    insert into public.sale_items (sale_id, product_id, name, unit_price, qty, subtotal)
    values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      v_item->>'name',
      (v_item->>'unit_price')::integer,
      (v_item->>'qty')::integer,
      (v_item->>'subtotal')::integer
    );
  end loop;

  -- 4. Return the saved sale with its nested items.
  select to_jsonb(s) || jsonb_build_object(
           'items',
           coalesce(jsonb_agg(to_jsonb(si)) filter (where si.id is not null), '[]'::jsonb)
         )
    into v_result
    from public.sales s
    left join public.sale_items si on si.sale_id = s.id
   where s.id = v_sale_id
   group by s.id;

  return v_result;
end;
$$;

-- Anon must not run checkout; only an authenticated session may.
revoke all on function public.create_sale(jsonb, text, integer, integer, text, integer, integer, integer, integer, text, text, text) from public, anon;
grant execute on function public.create_sale(jsonb, text, integer, integer, text, integer, integer, integer, integer, text, text, text) to authenticated;

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Every table requires an authenticated session. No per-action rules yet:
-- any signed-in till may read/write everything (single trusted shop).
-- ============================================================================
alter table public.products   enable row level security;
alter table public.sales      enable row level security;
alter table public.sale_items enable row level security;
alter table public.settings   enable row level security;
alter table public.users      enable row level security;

drop policy if exists authenticated_all on public.products;
create policy authenticated_all on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all on public.sales;
create policy authenticated_all on public.sales
  for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all on public.sale_items;
create policy authenticated_all on public.sale_items
  for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all on public.settings;
create policy authenticated_all on public.settings
  for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all on public.users;
create policy authenticated_all on public.users
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- Seed data (ports SEED_PRODUCTS + SEED_SETTINGS from store.js)
-- ============================================================================

-- Single settings row (no-op if it already exists).
insert into public.settings (id, shop_name, address, phone, currency, tax_rate, receipt_footer, low_stock_threshold)
values (true, 'Optimus Sphere Tech', 'Nairobi, Kenya', '+254 700 000 000', 'KES', 0,
        'Thank you for shopping at Optimus Sphere Tech!', 5)
on conflict (id) do nothing;

-- Initial catalog — inserted only when the table is empty, so re-running is safe.
insert into public.products (name, category, price, stock, sku, low_stock_alert)
select v.name, v.category, v.price, v.stock, v.sku, v.low_stock_alert
from (values
  ('PlayStation 5 Console',          'Gaming',      89999,  5, 'GAM-001',  2),
  ('Xbox Series X',                  'Gaming',      82999,  3, 'GAM-002',  2),
  ('Nintendo Switch OLED',           'Gaming',      54999,  8, 'GAM-003',  3),
  ('DualSense Wireless Controller',  'Gaming',       9499, 15, 'GAM-004',  5),
  ('Samsung Galaxy S24 Ultra',       'Phones',     159999,  6, 'PHN-001',  2),
  ('iPhone 15 Pro Max 256GB',        'Phones',     189999,  4, 'PHN-002',  2),
  ('Tecno Camon 30 Pro',             'Phones',      42999, 12, 'PHN-003',  4),
  ('MacBook Pro M3 14"',             'Laptops',    249999,  3, 'LAP-001',  1),
  ('HP Pavilion 15 i5',              'Laptops',     79999,  7, 'LAP-002',  2),
  ('Lenovo IdeaPad Slim 5',          'Laptops',     64999,  9, 'LAP-003',  3),
  ('Sony WH-1000XM5 Headphones',     'Audio',       39999, 10, 'AUD-001',  3),
  ('JBL Flip 6 Speaker',             'Audio',       14999, 14, 'AUD-002',  5),
  ('Samsung 55" 4K QLED TV',         'TV',         124999,  4, 'TV-001',   1),
  ('LG 43" Smart TV',                'TV',          59999,  6, 'TV-002',   2),
  ('HDMI Cable 2m',                  'Accessories',   999, 50, 'ACC-001', 10),
  ('USB-C Charging Cable 1m',        'Accessories',   799, 60, 'ACC-002', 15),
  ('Phone Screen Protector',         'Accessories',   499, 80, 'ACC-003', 20),
  ('Laptop Bag 15.6"',               'Accessories',  3999, 20, 'ACC-004',  5)
) as v(name, category, price, stock, sku, low_stock_alert)
where not exists (select 1 from public.products);
