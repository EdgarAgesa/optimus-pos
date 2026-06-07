import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { saveSettings } from '../utils/store';
import { Btn, Input, Card, Alert } from '../components/UI';

export default function Settings() {
  const { settings: ctxSettings, refresh } = useApp();
  // Local editable copy, seeded from context and re-synced whenever it changes.
  const [settings, setSettings] = useState(ctxSettings || {});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSettings(ctxSettings || {});
  }, [ctxSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveSettings(settings);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e?.message || 'Could not save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Configure your POS system</p>
      </div>

      {saved && <Alert type="success" style={{ marginBottom: 16 }}>Settings saved successfully!</Alert>}
      {error && <Alert type="danger" style={{ marginBottom: 16 }}>{error}</Alert>}

      {/* Shop Info */}
      <Card style={{ padding: '20px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Shop Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Shop Name" value={settings.shopName || ''} onChange={e => setSettings(s => ({ ...s, shopName: e.target.value }))} />
          <Input label="Address" value={settings.address || ''} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} />
          <Input label="Phone" value={settings.phone || ''} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} />
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Receipt Footer Message</label>
            <textarea value={settings.receiptFooter || ''} onChange={e => setSettings(s => ({ ...s, receiptFooter: e.target.value }))}
              rows={2} style={{
                width: '100%', padding: '9px 12px', fontSize: 14,
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--white)', color: 'var(--text-primary)', resize: 'vertical',
                fontFamily: 'var(--font-body)'
              }} />
          </div>
        </div>
      </Card>

      {/* POS Config */}
      <Card style={{ padding: '20px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>POS Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Currency</label>
            <select value={settings.currency || 'KES'} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <option value="KES">KES (Kenyan Shilling)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
          <Input label="Tax Rate (%)" type="number" value={settings.taxRate ?? 0} onChange={e => setSettings(s => ({ ...s, taxRate: Number(e.target.value) }))} min={0} max={100} hint="Set to 0 for no tax" />
          <Input label="Low Stock Alert Threshold" type="number" value={settings.lowStockThreshold || 5} onChange={e => setSettings(s => ({ ...s, lowStockThreshold: Number(e.target.value) }))} min={0} hint="Default for new products" />
        </div>
      </Card>

      <Btn size="lg" onClick={handleSave} disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save Settings'}</Btn>
    </div>
  );
}
