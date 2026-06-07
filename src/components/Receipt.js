import React from 'react';
import { formatKES, formatDateTime } from '../utils/format';
import { useApp } from '../context/AppContext';

export default function Receipt({ sale, settings: settingsProp }) {
  // Settings come from context (or an explicit prop) — no sync store read in
  // render. Fall back to an empty object so a missing field never crashes.
  const { settings: ctxSettings } = useApp();
  const settings = settingsProp || ctxSettings || {};

  return (
    <div style={{
      fontFamily: "'Courier New', monospace", fontSize: 13,
      maxWidth: 320, margin: '0 auto', padding: '16px', color: '#111'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>{(settings.shopName || 'Optimus Sphere Tech').toUpperCase()}</p>
        {settings.address && <p style={{ fontSize: 12, color: '#555' }}>{settings.address}</p>}
        {settings.phone && <p style={{ fontSize: 12, color: '#555' }}>{settings.phone}</p>}
        <p style={{ margin: '8px 0', borderTop: '1px dashed #999', paddingTop: 8 }}>SALES RECEIPT</p>
      </div>

      {/* Meta */}
      <div style={{ marginBottom: 10, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Receipt#</span><span>{sale.receiptNo}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date</span><span>{formatDateTime(sale.createdAt)}</span>
        </div>
        {sale.customer?.name && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer</span><span>{sale.customer.name}</span>
          </div>
        )}
        {sale.customer?.phone && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Phone</span><span>{sale.customer.phone}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px dashed #999', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#777', marginBottom: 4 }}>
          <span>ITEM</span><span>QTY × PRICE = TOTAL</span>
        </div>
        {sale.items.map((item, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#555' }}>{item.qty} × {formatKES(item.price)}</span>
              <span>{formatKES(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #999', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
          <span>Subtotal</span><span>{formatKES(sale.subtotal)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
            <span>Discount</span><span>- {formatKES(sale.discountAmount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
          <span>TOTAL</span><span>{formatKES(sale.total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div style={{ borderTop: '1px dashed #999', paddingTop: 8, marginBottom: 8, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Payment Method</span><span>{sale.paymentMethod}</span>
        </div>
        {sale.paymentMethod === 'Cash' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Received</span><span>{formatKES(sale.amountPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Change</span><span>{formatKES(sale.change || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px dashed #999', paddingTop: 8, fontSize: 11, color: '#777' }}>
        <p>{settings.receiptFooter}</p>
        <p style={{ marginTop: 4 }}>Powered by Optimus Sphere POS</p>
      </div>
    </div>
  );
}
