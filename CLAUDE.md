# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm start          # dev server at localhost:3000
npm run build      # production build to build/
npm test           # Jest watch mode (react-scripts/CRA)
npm test -- --watchAll=false src/utils/format.test.js   # run a single test file once
```

This is a Create React App project (`react-scripts`). There are no tests in the repo yet; CRA's test runner picks up `*.test.js` files next to the code.

Requires a `.env` (copy from `.env.example`) with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`. The database schema lives in `supabase/schema.sql` and is applied via the Supabase SQL editor.

## Architecture

Single-page React app backed by **Supabase (Postgres + Auth)**. It is designed for several tills in one shop sharing the same live data. Deployed to Vercel (`vercel.json` rewrites every path to `/` so React Router handles routing client-side).

Layers:

1. **`src/utils/supabaseClient.js`** — the shared Supabase client, built from the `REACT_APP_SUPABASE_*` env vars, with `persistSession` on (a till stays signed in across reloads/shifts).

2. **`src/utils/store.js`** — the single data layer. **Async** functions (they return Promises) wrapping Supabase queries for products, sales, settings, plus client-side `getDashboardStats()`. Every function maps DB **snake_case** columns to the app's **camelCase** shapes (and back), so the rest of the app sees the same field names regardless of the DB. `getSales()` re-assembles the `sales` + `sale_items` join into the nested `{ ...sale, items: [] }` shape. `addSale()` calls the `create_sale` RPC. Also exports the `CATEGORIES` and `PAYMENT_METHODS` constants. **All persistence goes through here.**

3. **`src/context/AppContext.js`** — global state + auth via React Context (`useApp()` hook). Tracks the Supabase auth `session`; **data only loads once a session exists** (RLS returns nothing otherwise). `refresh()` is async and pulls products/sales/settings/stats in parallel; after any mutation, components `await refresh()` to re-sync. Exposes `signIn`/`signOut`, `loading`, and `error`.

4. **`src/App.js`** — the gate: waits for the session check, shows `<Login />` when signed out, a spinner during the first data load, an error screen on connection failure, otherwise the app. `src/pages/*` is one component per route (`Dashboard`, `POS`, `Products`, `SalesHistory`, `Reports`, `Settings`, `Login`). `src/components/UI.js` is a shared inline-styled component kit (`Btn`, `Input`, `Select`, `Modal`, `Card`, `StatCard`, `Badge`, `Alert`, `ConfirmDialog`, `SearchBar`, `Spinner`, …). `Receipt.js` and `Sidebar.js` are the other shared components.

## Database (`supabase/schema.sql`)

- Tables: `products`, `sales`, `sale_items` (header/detail; `sale_id` cascades, `product_id` is `ON DELETE SET NULL`), `settings` (single row pinned to `id = true`), and `users` (structure only, hashed PINs, currently unused by the app).
- **Row Level Security** on every table requires an authenticated session (`for all to authenticated`). No per-action restrictions yet.
- **`create_sale(...)` RPC** is the atomic checkout: in one transaction it takes a receipt number from a sequence, inserts the sale header, and for each line runs a **guarded** `UPDATE … SET stock = stock - qty WHERE id = … AND stock >= qty`. If any line lacks stock it raises and the whole sale rolls back — race-safe across tills, no overselling. Returns the saved sale with nested items.

## Key conventions

- **Styling is entirely inline `style={{}}` objects** keyed off CSS custom properties in `src/index.css` (`var(--teal)`, `var(--navy)`, `var(--radius)`, `var(--font-display)`, etc.). No CSS framework or modules. Reuse the design tokens rather than hardcoding colors/spacing. Hover/focus interactivity is done with inline `onMouseEnter`/`onFocus` handlers; responsive behavior with `<style>` tags containing media queries.

- **Currency is KES** throughout, stored as **whole-number integers** (`89999` = KES 89,999, no decimals) — `integer` columns in Postgres. Always format with `formatKES()` from `src/utils/format.js`; never render raw numbers.

- **Access is a single shared login**, not per-user PINs or roles. One Supabase Auth account (email + password) signs in every till; sign out from the sidebar. (The `users` table exists for a possible future re-introduction of roles, but nothing reads it.)

- **Sales are immutable records.** Checkout goes through `create_sale`, which assigns a sequential `receiptNo` (`OST-0001`) and decrements stock atomically. Line items snapshot `name`/`unit_price` at sale time so historical receipts stay correct even if a product later changes or is deleted.

- **Data layer is async; the rest of the app awaits it.** Pages read through `AppContext` (the single source of truth) and `await` writes (`addProduct`, `deleteSale`, `saveSettings`, `addSale`) followed by `refresh()`. Don't call `store.js` reads directly from components — go through context. `Receipt.js` takes settings from context/props, not a synchronous store read.
