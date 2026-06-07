import React, { useState } from 'react';
import { Eye, Trash2, Download, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { deleteSale } from '../utils/store';
import { Badge, Card, Modal, Btn, SearchBar, ConfirmDialog, Empty } from '../components/UI';
import Receipt from '../components/Receipt';
import { formatKES, formatDateTime, exportToCSV } from '../utils/format';

export default function SalesHistory() {
  const { sales: allSales, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [viewSale, setViewSale] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Newest-first, derived from the single source of truth in context.
  const sales = [...allSales].reverse();

  const filtered = sales.filter(s => {
    const matchSearch = s.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.phone?.includes(search);
    const matchMethod = filterMethod === 'All' || s.paymentMethod === filterMethod;
    const saleDate = new Date(s.createdAt);
    const matchFrom = !dateFrom || saleDate >= new Date(dateFrom);
    const matchTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchMethod && matchFrom && matchTo;
  });

  const total = filtered.reduce((sum, s) => sum + s.total, 0);

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async (id) => {
    await deleteSale(id);
    await refresh(); // context reload drops the row from the derived list
  };

  const handleExport = () => {
    const data = filtered.map(s => ({
      receipt_no: s.receiptNo,
      date: formatDateTime(s.createdAt),
      customer_name: s.customer?.name || '',
      customer_phone: s.customer?.phone || '',
      items: s.items.map(i => `${i.name} x${i.qty}`).join('; '),
      subtotal: s.subtotal,
      discount: s.discountAmount || 0,
      total: s.total,
      payment_method: s.paymentMethod,
    }));
    exportToCSV(data, 'optimus-sales-' + new Date().toISOString().slice(0, 10));
  };

  const payBadge = (method) => {
    if (method === 'M-Pesa') return <Badge variant="success">M-Pesa</Badge>;
    if (method === 'Card') return <Badge variant="info">Card</Badge>;
    return <Badge variant="gray">Cash</Badge>;
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Sales History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} transactions · {formatKES(total)}</p>
        </div>
        <Btn variant="secondary" onClick={handleExport}><Download size={16} />Export CSV</Btn>
      </div>

      {/* Filters */}
      <Card style={{ padding: '16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Receipt #, customer name/phone…" style={{ flex: 1, minWidth: 200 }} />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--white)', color: 'var(--text-primary)', cursor: 'pointer' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--white)', color: 'var(--text-primary)', cursor: 'pointer' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Method</label>
            <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--white)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {['All', 'Cash', 'M-Pesa', 'Card'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {(search || dateFrom || dateTo || filterMethod !== 'All') && (
            <Btn variant="ghost" size="sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setFilterMethod('All'); }}>Clear filters</Btn>
          )}
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <Empty icon={<Search size={40} />} title="No sales found" description="Try adjusting your filters" />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  {['Receipt #', 'Date & Time', 'Customer', 'Items', 'Payment', 'Total', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale, i) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--surface)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--teal-dark)' }}>{sale.receiptNo}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateTime(sale.createdAt)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {sale.customer?.name ? <div>
                        <p style={{ fontWeight: 500 }}>{sale.customer.name}</p>
                        {sale.customer.phone && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sale.customer.phone}</p>}
                      </div> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{sale.items.length} item{sale.items.length > 1 ? 's' : ''}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{payBadge(sale.paymentMethod)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{formatKES(sale.total)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setViewSale(sale)} style={{ padding: '5px', background: 'var(--teal-muted)', border: 'none', borderRadius: 5, cursor: 'pointer', color: 'var(--teal-dark)' }}><Eye size={14} /></button>
                        <button onClick={() => handleDelete(sale.id)} style={{ padding: '5px', background: 'var(--danger-bg)', border: 'none', borderRadius: 5, cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--teal-muted)' }}>
                  <td colSpan={5} style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--teal-dark)' }}>Total ({filtered.length} sales)</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--navy)' }}>{formatKES(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* View Receipt Modal */}
      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title="Receipt Details" maxWidth={380}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => window.print()}>Print</Btn>
            <Btn size="sm" onClick={() => setViewSale(null)}>Close</Btn>
          </div>
        }>
        {viewSale && <div id="print-area"><Receipt sale={viewSale} /></div>}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => confirmDelete(deleteId)}
        title="Delete Sale Record" message="This will permanently delete this sale record. Stock will NOT be restored automatically." />
    </div>
  );
}
