import React, { useState } from 'react';
import { Zap, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Btn, Input, Alert, Card } from '../components/UI';

// Single shared shop login. All tills sign in with the same Supabase Auth
// account; the session persists across reloads (see supabaseClient).
export default function Login() {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter the shop email and password.'); return; }
    setBusy(true);
    setError('');
    const err = await signIn(email.trim(), password);
    // On success the auth listener swaps this screen for the app; nothing else
    // to do here. On failure, show why and let them retry.
    if (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 380, padding: '28px 26px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: 'var(--teal)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Zap size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Optimus Sphere POS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to this till</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Shop email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="shop@example.com"
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <Alert type="danger">{error}</Alert>}

          <Btn type="submit" size="lg" fullWidth disabled={busy}>
            <LogIn size={16} />{busy ? 'Signing in…' : 'Sign In'}
          </Btn>
        </form>

        <p style={{ marginTop: 18, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          All tills share one shop account. You'll stay signed in across shifts.
        </p>
      </Card>
    </div>
  );
}
