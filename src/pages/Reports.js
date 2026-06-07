import React, { useState } from 'react';
import { TrendingUp, Download, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatCard, Badge, Btn } from '../components/UI';
import { formatKES, formatDate, exportToCSV } from '../utils/format';

const PERIODS = ['Today', 'This Week', 'This Month', 'This Year', 'All Time'];

function inRange(sale, period) {
  const d = new Date(sale.createdAt);
  const now = new Date();
  if (period === 'Today') return d.toDateString() === now.toDateString();
  if (period === 'This Week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    start.setHours(0,0,0,0);
    return d >= start;
  }
  if (period === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === 'This Year') return d.getFullYear() === now.getFullYear();
  return true;
}

export default function Reports() {
  const { sales, products } = useApp();
  const [period, setPeriod] = useState('Today');

  const filtered = sales.filter(s => inRange(s, period));

  const revenue = filtered.reduce((s, sale) => s + sale.total, 0);
  const discounts = filtered.reduce((s, sale) => s + (sale.discountAmount || 0), 0);
  const itemsSold = filtered.reduce((s, sale) => s + sale.items.reduce((a, i) => a + i.qty, 0), 0);
  const avgSale = filtered.length ? revenue / filtered.length : 0;

  // Payment breakdown
  const payBreakdown = filtered.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
    return acc;
  }, {});

  // Top products
  const productMap = {};
  filtered.forEach(sale => {
    sale.items.forEach(item => {
      if (!productMap[item.productId]) productMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      productMap[item.productId].qty += item.qty;
      productMap[item.productId].revenue += item.subtotal;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Daily breakdown (for chart-like table)
  const dailyMap = {};
  filtered.forEach(sale => {
    const day = new Date(sale.createdAt).toDateString();
    if (!dailyMap[day]) dailyMap[day] = { date: sale.createdAt, count: 0, revenue: 0 };
    dailyMap[day].count++;
    dailyMap[day].revenue += sale.total;
  });
  const dailyBreakdown = Object.values(dailyMap).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Category breakdown
  const catMap = {};
  filtered.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { revenue: 0, qty: 0 };
      catMap[cat].revenue += item.subtotal;
      catMap[cat].qty += item.qty;
    });
  });
  const catBreakdown = Object.entries(catMap).sort((a, b) => b[1].revenue - a[1].revenue);

  const handleExport = () => {
    const data = filtered.map(s => ({
      receipt_no: s.receiptNo,
      date: formatDate(s.createdAt),
      customer: s.customer?.name || '',
      items: s.items.length,
      subtotal: s.subtotal,
      discount: s.discountAmount || 0,
      total: s.total,
      payment: s.paymentMethod,
    }));
    exportToCSV(data, `report-${period.toLowerCase().replace(' ', '-')}-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sales analytics and performance</p>
        </div>
        <Btn variant="secondary" onClick={handleExport}><Download size={16} />Export CSV</Btn>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '8px 16px', borderRadius: 99, fontSize: 13, border: '1px solid',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            background: period === p ? 'var(--navy)' : 'var(--white)',
            color: period === p ? '#fff' : 'var(--text-secondary)',
            borderColor: period === p ? 'var(--navy)' : 'var(--border)',
            fontWeight: period === p ? 600 : 400,
          }}>{p}</button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Revenue" value={formatKES(revenue)} icon={<TrendingUp size={20} />} sub={`${filtered.length} transactions`} color="var(--teal)" />
        <StatCard label="Items Sold" value={itemsSold} icon={<BarChart3 size={20} />} sub="Units across all products" color="var(--navy)" />
        <StatCard label="Average Sale" value={formatKES(Math.round(avgSale))} icon={<TrendingUp size={20} />} sub="Per transaction" color="var(--teal-dark)" />
        <StatCard label="Total Discounts" value={formatKES(discounts)} icon={<BarChart3 size={20} />} sub="Discounts given" color="var(--warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Payment breakdown */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Payment Methods</h3>
          {!Object.keys(payBreakdown).length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data</p>
          ) : Object.entries(payBreakdown).map(([method, amount]) => {
            const pct = revenue ? Math.round((amount / revenue) * 100) : 0;
            return (
              <div key={method} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{method}</span>
                  <span>{formatKES(amount)} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: pct + '%', background: method === 'M-Pesa' ? 'var(--success)' : method === 'Card' ? 'var(--teal)' : 'var(--navy)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Category breakdown */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Revenue by Category</h3>
          {!catBreakdown.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data</p>
          ) : catBreakdown.map(([cat, data]) => {
            const pct = revenue ? Math.round((data.revenue / revenue) * 100) : 0;
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight: 500 }}>{formatKES(data.revenue)}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: pct + '%', background: 'var(--teal)', borderRadius: 99 }} />
                  </div>
                </div>
                <Badge variant="gray">{data.qty} sold</Badge>
              </div>
            );
          })}
        </Card>

        {/* Top products */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Top Products</h3>
          {!topProducts.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data</p>
          ) : topProducts.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 20, height: 20, background: i < 3 ? 'var(--teal)' : 'var(--surface-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i < 3 ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.qty} units</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{formatKES(p.revenue)}</span>
            </div>
          ))}
        </Card>

        {/* Daily breakdown */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Daily Breakdown</h3>
          {!dailyBreakdown.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data for this period</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Sales</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBreakdown.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{formatDate(d.date)}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{d.count}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{formatKES(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
