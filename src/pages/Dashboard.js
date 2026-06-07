import React, { useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle,
  CreditCard, Smartphone, Banknote, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatCard, Card, Badge } from '../components/UI';
import { formatKES, formatTime } from '../utils/format';

export default function Dashboard() {
  const { products, stats, sales, refresh } = useApp();
  const navigate = useNavigate();

  // Pull fresh data when landing on the dashboard; stats come from context.
  useEffect(() => { refresh(); }, [refresh]);

  const recentSales = [...sales].reverse().slice(0, 8);

  const payMethodIcon = (m) => {
    if (m === 'M-Pesa') return <Smartphone size={14} />;
    if (m === 'Card') return <CreditCard size={14} />;
    return <Banknote size={14} />;
  };

  const lowStock = products.filter(p => p.active && p.stock <= p.lowStockAlert);
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{today}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Today's Revenue"
          value={formatKES(stats.todayRevenue || 0)}
          icon={<TrendingUp size={20} />}
          sub={`${stats.todayTransactions || 0} transactions`}
          color="var(--teal)"
        />
        <StatCard
          label="All-time Revenue"
          value={formatKES(stats.allRevenue || 0)}
          icon={<ShoppingBag size={20} />}
          sub="Total sales"
          color="var(--navy)"
        />
        <StatCard
          label="Products"
          value={stats.totalProducts || 0}
          icon={<Package size={20} />}
          sub={`${lowStock.length} low stock`}
          color={lowStock.length > 0 ? 'var(--warning)' : 'var(--success)'}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStock.length}
          icon={<AlertTriangle size={20} />}
          sub="Need restocking"
          color={lowStock.length > 0 ? 'var(--danger)' : 'var(--success)'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Recent Sales */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Recent Sales</h3>
            <button onClick={() => navigate('/sales')} style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
              color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer'
            }}>View all <ArrowRight size={14} /></button>
          </div>
          {recentSales.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No sales yet today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentSales.map(sale => (
                <div key={sale.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)'
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{sale.receiptNo}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {payMethodIcon(sale.paymentMethod)} {sale.paymentMethod} · {formatTime(sale.createdAt)}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal-dark)' }}>{formatKES(sale.total)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Top Products</h3>
            <Badge variant="gray">All time</Badge>
          </div>
          {!stats.topProducts?.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No sales data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, background: i === 0 ? 'var(--teal)' : 'var(--surface-2)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: i === 0 ? '#fff' : 'var(--text-muted)', flexShrink: 0
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.qty} sold</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatKES(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Payment Breakdown */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Today's Payment Methods</h3>
          {!Object.keys(stats.paymentBreakdown || {}).length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No payments today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(stats.paymentBreakdown || {}).map(([method, amount]) => {
                const total = stats.todayRevenue || 1;
                const pct = Math.round((amount / total) * 100);
                return (
                  <div key={method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {payMethodIcon(method)} {method}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{formatKES(amount)} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: pct + '%', background: method === 'M-Pesa' ? '#16a34a' : method === 'Card' ? 'var(--teal)' : 'var(--navy)', borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Low Stock */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Low Stock Alerts</h3>
            {lowStock.length > 0 && <Badge variant="warning"><AlertTriangle size={12} /> {lowStock.length}</Badge>}
          </div>
          {lowStock.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>✓ All items well-stocked</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowStock.slice(0, 6).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: p.stock === 0 ? 'var(--danger-bg)' : 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category}</p>
                  </div>
                  <Badge variant={p.stock === 0 ? 'danger' : 'warning'}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</Badge>
                </div>
              ))}
              {lowStock.length > 6 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>+{lowStock.length - 6} more</p>}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/pos')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>
          <ShoppingBag size={18} /> New Sale
        </button>
        <button onClick={() => navigate('/products')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: 'var(--white)', color: 'var(--text-primary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)'
        }}>
          <Package size={18} /> Manage Products
        </button>
        <button onClick={() => navigate('/reports')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: 'var(--white)', color: 'var(--text-primary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)'
        }}>
          <TrendingUp size={18} /> View Reports
        </button>
      </div>
    </div>
  );
}
