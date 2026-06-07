import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  History, Settings, ChevronLeft, Menu, X, Zap,
  AlertTriangle, LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/sales', label: 'Sales History', icon: History },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { products, currentUser, signOut } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const lowStockCount = products.filter(p => p.active && p.stock <= p.lowStockAlert).length;

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
    return (
      <button onClick={() => { navigate(item.path); setMobileOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%',
          padding: collapsed ? '11px' : '11px 14px', borderRadius: 'var(--radius)',
          background: active ? 'rgba(0,151,167,0.14)' : 'transparent',
          color: active ? 'var(--teal-light)' : 'rgba(255,255,255,0.65)',
          border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500,
          letterSpacing: '-0.01em', boxShadow: active ? 'inset 3px 0 0 var(--teal-light)' : 'none',
          transition: 'background var(--transition), color var(--transition)',
          justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}>
        <Icon size={18} style={{ flexShrink: 0 }} />
        {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
        {item.path === '/products' && lowStockCount > 0 && !collapsed && (
          <span style={{
            marginLeft: 'auto', background: 'var(--warning)', color: '#fff',
            fontSize: 11, padding: '1px 6px', borderRadius: 99, fontWeight: 700
          }}>{lowStockCount}</span>
        )}
      </button>
    );
  };

  const SidebarContent = ({ mobile }) => (
    <nav style={{
      width: mobile ? 240 : (collapsed ? 60 : 240),
      height: '100vh', background: 'var(--navy)',
      display: 'flex', flexDirection: 'column',
      padding: '0', transition: 'width 0.2s ease',
      position: mobile ? 'relative' : 'fixed', zIndex: mobile ? 'auto' : 100,
      top: 0, left: 0, overflowX: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 64
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--teal)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Zap size={16} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Optimus Sphere</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>POS System</p>
            </div>
          )}
        </div>
        {!mobile && !collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            <ChevronLeft size={16} />
          </button>
        )}
        {!mobile && collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, position: 'absolute', right: 4, top: 20 }}>
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {lowStockCount > 0 && !collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            background: 'rgba(217,119,6,0.15)', borderRadius: 'var(--radius)',
            marginBottom: 8, color: '#fcd34d', fontSize: 12
          }}>
            <AlertTriangle size={14} />
            <span>{lowStockCount} low stock item{lowStockCount > 1 ? 's' : ''}</span>
          </div>
        )}
        {NAV.map(item => <NavItem key={item.path} item={item} />)}
      </div>

      {/* User + sign out */}
      {currentUser && (
        <div style={{
          padding: collapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: 30, height: 30, background: 'var(--teal)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {currentUser.name[0].toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 13, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</p>
              </div>
              <button onClick={signOut} title="Sign out" aria-label="Sign out"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', padding: 6, borderRadius: 8,
                  transition: 'background var(--transition), color var(--transition)', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <div className="desktop-nav" style={{ display: 'none' }}>
        <SidebarContent />
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="mobile-nav-toggle"
        style={{
          display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 200,
          background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
          padding: '8px', cursor: 'pointer'
        }}>
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
            <SidebarContent mobile />
            <button onClick={() => setMobileOpen(false)} style={{
              position: 'absolute', top: 14, right: -40, background: 'none', border: 'none',
              color: '#fff', cursor: 'pointer'
            }}><X size={24} /></button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) { .desktop-nav { display: block !important; } }
        @media (max-width: 768px) { .mobile-nav-toggle { display: flex !important; } }
      `}</style>
    </>
  );
}
