import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import { Spinner } from './components/UI';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Full-screen states so no page ever renders against undefined data.
function FullScreen({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
      {children}
    </div>
  );
}

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isPOS = location.pathname === '/pos';
  const { authReady, session, loading, error } = useApp();

  // 1. Wait for the persisted session check before deciding anything.
  if (!authReady) {
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    );
  }

  // 2. No session -> the login screen. Data does not load until signed in
  //    (RLS returns nothing without an authenticated session).
  if (!session) {
    return <Login />;
  }

  // 3. Signed in: block on the first data load until it's in hand.
  if (loading) {
    return (
      <FullScreen>
        <div style={{ textAlign: 'center' }}>
          <Spinner />
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Loading your shop…</p>
        </div>
      </FullScreen>
    );
  }

  // If the first load failed outright, show a recoverable error instead of an empty app.
  if (error) {
    return (
      <FullScreen>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Can't reach the server</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
          }}>Retry</button>
        </div>
      </FullScreen>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{
        flex: 1,
        marginLeft: 0,
        minWidth: 0,
        transition: 'margin-left 0.2s ease',
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<SalesHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <style>{`
        @media (min-width: 769px) {
          main {
            margin-left: ${collapsed ? '60px' : '240px'} !important;
          }
        }
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding-top: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  );
}
