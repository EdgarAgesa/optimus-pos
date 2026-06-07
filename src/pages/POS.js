import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, User, Percent, Printer, MessageSquare, X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addSale, CATEGORIES, PAYMENT_METHODS } from '../utils/store';
import { Btn, Input, Modal, Badge, SearchBar, Alert } from '../components/UI';
import { formatKES, formatDateTime, shareWhatsApp } from '../utils/format';
import Receipt from '../components/Receipt';

export default function POS() {
  const { products, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState({ type: 'flat', value: '' });
  const [payMethod, setPayMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  const activeProducts = products.filter(p => p.active !== false && p.stock > 0);
  const filtered = activeProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price } : i);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1, subtotal: product.price, maxStock: product.stock }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = Math.min(Math.max(1, i.qty + delta), i.maxStock);
      return { ...i, qty: newQty, subtotal: newQty * i.price };
    }));
  };

  const setQtyDirect = (productId, qty) => {
    const num = parseInt(qty);
    if (isNaN(num) || num < 1) return;
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = Math.min(num, i.maxStock);
      return { ...i, qty: newQty, subtotal: newQty * i.price };
    }));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = discount.value
    ? discount.type === 'percent'
      ? Math.round(subtotal * (Number(discount.value) / 100))
      : Number(discount.value)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const change = payMethod === 'Cash' ? Math.max(0, Number(amountPaid) - total) : 0;

  const handleCheckout = async () => {
    setError('');
    if (cart.length === 0) { setError('Add items to cart first'); return; }
    if (payMethod === 'Cash' && amountPaid && Number(amountPaid) < total) {
      setError('Amount paid is less than total'); return;
    }
    const sale = {
      items: cart,
      subtotal, discountAmount, total,
      paymentMethod: payMethod,
      amountPaid: payMethod === 'Cash' ? Number(amountPaid) || total : total,
      change,
      customer: customer.name || customer.phone ? customer : null,
      discount: discount.value ? discount : null,
    };
    setProcessing(true);
    try {
      const saved = await addSale(sale);
      setCompletedSale(saved);
      setCart([]);
      setCustomer({ name: '', phone: '' });
      setDiscount({ type: 'flat', value: '' });
      setAmountPaid('');
      setShowCheckout(false);
      setShowReceipt(true);
      await refresh();
    } catch (e) {
      // The create_sale RPC rolls the whole sale back if any line lacks stock
      // (e.g. another till just sold it). Surface that to the cashier.
      const raw = e?.message || '';
      setError(/INSUFFICIENT_STOCK/i.test(raw)
        ? 'Not enough stock for one or more items — they may have just sold on another till. Close, refresh, and try again.'
        : (raw || 'Could not complete the sale. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleNewSale = () => {
    setCompletedSale(null);
    setShowReceipt(false);
  };

  const receiptText = completedSale ? `*Optimus Sphere Tech*\nReceipt: ${completedSale.receiptNo}\nDate: ${formatDateTime(completedSale.createdAt)}\n\n${completedSale.items.map(i => `${i.name} x${i.qty} = ${formatKES(i.subtotal)}`).join('\n')}\n\nTotal: ${formatKES(completedSale.total)}\nPayment: ${completedSale.paymentMethod}\n\nThank you!` : '';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      {/* Product Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', borderRight: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Point of Sale</h2>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, whiteSpace: 'nowrap',
                border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: filterCat === cat ? 'var(--teal)' : 'var(--white)',
                color: filterCat === cat ? '#fff' : 'var(--text-secondary)',
                borderColor: filterCat === cat ? 'var(--teal)' : 'var(--border)',
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No products found</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {filtered.map(p => {
              const inCart = cart.find(i => i.productId === p.id);
              return (
                <button key={p.id} onClick={() => addToCart(p)} style={{
                  background: inCart ? 'var(--teal-muted)' : 'var(--white)', border: `2px solid ${inCart ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: '13px', cursor: 'pointer',
                  textAlign: 'left', position: 'relative', boxShadow: 'var(--shadow-sm)',
                  transition: 'transform var(--transition), box-shadow var(--transition), border-color var(--transition)'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; if (!inCart) e.currentTarget.style.borderColor = 'var(--teal-subtle)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; if (!inCart) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  {inCart && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6, background: 'var(--teal)',
                      color: '#fff', borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700
                    }}>{inCart.qty}</span>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{p.category}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{p.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-dark)', fontFamily: 'var(--font-display)' }}>{formatKES(p.price)}</p>
                  <p style={{ fontSize: 11, color: p.stock <= p.lowStockAlert ? 'var(--warning)' : 'var(--text-muted)', marginTop: 4 }}>{p.stock} left</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: 'var(--white)', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} color="var(--teal)" />
          <h3 style={{ fontSize: 16 }}>Cart</h3>
          {cart.length > 0 && <Badge variant="info">{cart.length}</Badge>}
          {cart.length > 0 && (
            <button onClick={() => setCart([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <ShoppingCart size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Click a product to add to cart</p>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} style={{ padding: '10px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 500, flex: 1, paddingRight: 8 }}>{item.name}</p>
                <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 2 }}><Trash2 size={14} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateQty(item.productId, -1)} style={{ width: 24, height: 24, background: 'var(--border)', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                  <input type="number" value={item.qty} onChange={e => setQtyDirect(item.productId, e.target.value)} min={1} max={item.maxStock}
                    style={{ width: 40, textAlign: 'center', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 0' }} />
                  <button onClick={() => updateQty(item.productId, 1)} style={{ width: 24, height: 24, background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-dark)', fontFamily: 'var(--font-display)' }}>{formatKES(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & Checkout */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
          {/* Customer (optional) */}
          <details style={{ marginBottom: 12 }}>
            <summary style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Customer info (optional)
            </summary>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input placeholder="Customer name" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
              <Input placeholder="Phone number" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
            </div>
          </details>

          {/* Discount */}
          <details style={{ marginBottom: 12 }}>
            <summary style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Percent size={14} /> Apply discount
            </summary>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <select value={discount.type} onChange={e => setDiscount(d => ({ ...d, type: e.target.value }))}
                style={{ width: 100, padding: '8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--white)', cursor: 'pointer' }}>
                <option value="flat">KES</option>
                <option value="percent">%</option>
              </select>
              <Input placeholder="0" value={discount.value} onChange={e => setDiscount(d => ({ ...d, value: e.target.value }))} type="number" min={0} style={{ flex: 1 }} />
            </div>
          </details>

          {/* Summary */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>{formatKES(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--success)' }}>
                <span>Discount</span>
                <span>- {formatKES(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: 'var(--teal-dark)' }}>{formatKES(total)}</span>
            </div>
          </div>

          {error && <Alert type="danger" style={{ marginBottom: 8 }}>{error}</Alert>}

          <Btn fullWidth size="lg" onClick={() => { setError(''); setShowCheckout(true); }} disabled={cart.length === 0}>
            <ShoppingCart size={18} /> Charge {formatKES(total)}
          </Btn>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title="Complete Sale" maxWidth={400}
        footer={<><Btn variant="ghost" onClick={() => setShowCheckout(false)} disabled={processing}>Cancel</Btn><Btn onClick={handleCheckout} disabled={processing}><CheckCircle size={16} />{processing ? 'Processing…' : 'Complete Sale'}</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--teal-muted)', padding: '12px 16px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--teal-dark)' }}>Total Amount</p>
            <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>{formatKES(total)}</p>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>Payment Method</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 'var(--radius)',
                  border: `2px solid ${payMethod === m ? 'var(--teal)' : 'var(--border)'}`,
                  background: payMethod === m ? 'var(--teal-muted)' : 'var(--white)',
                  color: payMethod === m ? 'var(--teal-dark)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 13, fontWeight: payMethod === m ? 600 : 400,
                  fontFamily: 'var(--font-body)'
                }}>{m}</button>
              ))}
            </div>
          </div>
          {payMethod === 'Cash' && (
            <div>
              <Input label="Amount Received (KES)" type="number" value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)} placeholder={total} min={0} prefix="KES" />
              {amountPaid && Number(amountPaid) >= total && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--success)' }}>Change</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>{formatKES(change)}</span>
                </div>
              )}
            </div>
          )}
          {payMethod === 'M-Pesa' && (
            <Alert type="info">Confirm M-Pesa payment of {formatKES(total)} before completing.</Alert>
          )}
          {error && <Alert type="danger">{error}</Alert>}
        </div>
      </Modal>

      {/* Receipt Modal */}
      {completedSale && (
        <Modal open={showReceipt} onClose={handleNewSale} title="Sale Complete!" maxWidth={420}
          footer={
            <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
              <Btn variant="ghost" size="sm" onClick={() => window.print()}><Printer size={15} />Print</Btn>
              <Btn variant="success" size="sm" onClick={() => shareWhatsApp(receiptText)}><MessageSquare size={15} />WhatsApp</Btn>
              <Btn style={{ marginLeft: 'auto' }} onClick={handleNewSale}>New Sale</Btn>
            </div>
          }>
          <div id="print-area">
            <Receipt sale={completedSale} />
          </div>
        </Modal>
      )}
    </div>
  );
}
