import { supabase } from './supabaseClient';

// ─── Data layer ──────────────────────────────────────────────────────────────
// Backed by Supabase (Layer 2). Every exported function keeps the name and
// signature it had under localStorage, but now returns a Promise. DB columns
// are snake_case; everything below maps them to/from the app's camelCase so the
// rest of the app sees identical field names to before. Seeding lives in the
// DB now (supabase/schema.sql), not here.

// Throw on Supabase errors so callers can catch them (Layer 3 wires that up).
const unwrap = ({ data, error }) => { if (error) throw error; return data; };

// Kept only for API compatibility; the DB generates ids (uuid) now.
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ─── Field mappers: DB row (snake_case) ⇄ app shape (camelCase) ───────────────
const productFromRow = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  price: r.price,
  stock: r.stock,
  sku: r.sku,
  lowStockAlert: r.low_stock_alert,
  active: r.active,
  createdAt: r.created_at,
});

// Translates only the camelCase keys that are present, so partial updates work.
const productToColumns = (p) => {
  const out = {};
  if (p.id !== undefined) out.id = p.id;
  if (p.name !== undefined) out.name = p.name;
  if (p.category !== undefined) out.category = p.category;
  if (p.price !== undefined) out.price = p.price;
  if (p.stock !== undefined) out.stock = p.stock;
  if (p.sku !== undefined) out.sku = p.sku;
  if (p.lowStockAlert !== undefined) out.low_stock_alert = p.lowStockAlert;
  if (p.active !== undefined) out.active = p.active;
  return out;
};

const saleItemFromRow = (r) => ({
  productId: r.product_id,
  name: r.name,
  price: r.unit_price,
  qty: r.qty,
  subtotal: r.subtotal,
});

// Re-assembles a sales header + its sale_items rows into the nested
// { ...sale, items: [] } shape callers already expect. Works for both the
// nested select (row.sale_items) and the create_sale RPC result (data.items).
const saleFromRow = (r, items = []) => ({
  id: r.id,
  receiptNo: r.receipt_no,
  createdAt: r.created_at,
  subtotal: r.subtotal,
  discountAmount: r.discount_amount,
  total: r.total,
  paymentMethod: r.payment_method,
  amountPaid: r.amount_paid,
  change: r.change,
  customer: (r.customer_name || r.customer_phone)
    ? { name: r.customer_name || '', phone: r.customer_phone || '' }
    : null,
  discount: r.discount_type
    ? { type: r.discount_type, value: r.discount_value }
    : null,
  items: (items || []).map(saleItemFromRow),
});

const DEFAULT_SETTINGS = {
  shopName: 'Optimus Sphere Tech',
  address: 'Nairobi, Kenya',
  phone: '+254 700 000 000',
  currency: 'KES',
  taxRate: 0,
  receiptFooter: 'Thank you for shopping at Optimus Sphere Tech!',
  lowStockThreshold: 5,
};

const settingsFromRow = (r) => ({
  shopName: r.shop_name,
  address: r.address,
  phone: r.phone,
  currency: r.currency,
  taxRate: r.tax_rate,
  receiptFooter: r.receipt_footer,
  lowStockThreshold: r.low_stock_threshold,
});

const settingsToRow = (s) => ({
  id: true, // single-row table pinned to TRUE
  shop_name: s.shopName,
  address: s.address,
  phone: s.phone,
  currency: s.currency,
  tax_rate: s.taxRate,
  receipt_footer: s.receiptFooter,
  low_stock_threshold: s.lowStockThreshold,
});

// ─── Init ─────────────────────────────────────────────────────────────────────
// Seeding now lives in the DB. This is a lightweight connectivity check that
// never throws, so a misconfigured/offline till still renders instead of
// white-screening. Returns true when Supabase is reachable.
export const initStore = async () => {
  try {
    const { error } = await supabase.from('settings').select('id', { head: true });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[store] Supabase connectivity check failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[store] Supabase unreachable:', e?.message);
    return false;
  }
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts = async () => {
  const data = unwrap(await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true })
    .order('name', { ascending: true }));
  return data.map(productFromRow);
};

// Bulk upsert (kept for API compatibility; not currently called by the app).
export const saveProducts = async (products) => {
  const data = unwrap(await supabase
    .from('products')
    .upsert(products.map(productToColumns))
    .select());
  return data.map(productFromRow);
};

export const addProduct = async (product) => {
  const data = unwrap(await supabase
    .from('products')
    .insert(productToColumns(product))
    .select()
    .single());
  return productFromRow(data);
};

export const updateProduct = async (id, updates) => {
  const data = unwrap(await supabase
    .from('products')
    .update(productToColumns(updates))
    .eq('id', id)
    .select()
    .single());
  return productFromRow(data);
};

export const deleteProduct = async (id) => {
  unwrap(await supabase.from('products').delete().eq('id', id));
};

// ─── Sales ────────────────────────────────────────────────────────────────────
// Single query pulls each header with its nested sale_items, then re-assembles
// the original nested sale shape. Chronological order (newest-first reversal
// still happens in SalesHistory, exactly as before).
export const getSales = async () => {
  const data = unwrap(await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .order('created_at', { ascending: true })
    .order('receipt_no', { ascending: true }));
  return data.map((row) => saleFromRow(row, row.sale_items));
};

// Atomic checkout via the create_sale RPC. Absorbs the old decrementStock:
// stock is decremented inside the same transaction, and the whole sale rolls
// back if any line lacks stock (prevents overselling across tills).
export const addSale = async (sale) => {
  const payload = {
    p_items: (sale.items || []).map((i) => ({
      product_id: i.productId,
      name: i.name,
      unit_price: i.price,
      qty: i.qty,
      subtotal: i.subtotal,
    })),
    p_payment_method: sale.paymentMethod,
    p_subtotal: sale.subtotal,
    p_total: sale.total,
    p_discount_type: sale.discount?.type ?? null,
    p_discount_value: sale.discount ? Number(sale.discount.value) : null,
    p_discount_amount: sale.discountAmount ?? 0,
    p_amount_paid: sale.amountPaid ?? null,
    p_change: sale.change ?? 0,
    p_customer_name: sale.customer?.name ?? null,
    p_customer_phone: sale.customer?.phone ?? null,
    p_till_id: null, // till identity comes in a later layer
  };
  const data = unwrap(await supabase.rpc('create_sale', payload));
  return saleFromRow(data, data.items);
};

export const deleteSale = async (id) => {
  // Cascade removes sale_items. Stock is NOT restored (matches prior behavior).
  unwrap(await supabase.from('sales').delete().eq('id', id));
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = async () => {
  const data = unwrap(await supabase
    .from('settings')
    .select('*')
    .eq('id', true)
    .maybeSingle());
  return data ? settingsFromRow(data) : { ...DEFAULT_SETTINGS };
};

export const saveSettings = async (settings) => {
  const data = unwrap(await supabase
    .from('settings')
    .upsert(settingsToRow(settings))
    .select()
    .single());
  return settingsFromRow(data);
};

// ─── Analytics ────────────────────────────────────────────────────────────────
// Kept client-side for now: fetch sales + products, reduce in JS (identical
// logic to the localStorage version). Can move to SQL views later if slow.
export const getDashboardStats = async () => {
  const [sales, products] = await Promise.all([getSales(), getProducts()]);
  const today = new Date().toDateString();

  const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayTransactions = todaySales.length;

  const allRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  // Top products
  const productSales = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.productId]) productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      productSales[item.productId].qty += item.qty;
      productSales[item.productId].revenue += item.subtotal;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Low stock
  const lowStock = products.filter((p) => p.active && p.stock <= p.lowStockAlert);

  // Payment breakdown today
  const paymentBreakdown = todaySales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
    return acc;
  }, {});

  return {
    todayRevenue,
    todayTransactions,
    allRevenue,
    topProducts,
    lowStock,
    paymentBreakdown,
    totalProducts: products.filter((p) => p.active).length,
  };
};

export const CATEGORIES = ['Gaming', 'Phones', 'Laptops', 'Audio', 'TV', 'Accessories'];
export const PAYMENT_METHODS = ['Cash', 'M-Pesa', 'Card'];

export { uid };
