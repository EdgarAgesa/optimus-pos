import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
export const Btn = ({ children, variant = 'primary', size = 'md', fullWidth, onClick, disabled, type = 'button', style, className }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)',
    fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1, transition: 'transform var(--transition), box-shadow var(--transition), filter var(--transition)',
    border: 'none', outline: 'none', width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap', userSelect: 'none',
  };
  const sizes = {
    sm: { padding: '7px 13px', fontSize: 13 },
    md: { padding: '10px 18px', fontSize: 14 },
    lg: { padding: '13px 24px', fontSize: 15 },
  };
  // Each variant carries its resting shadow plus the shadow to use on hover.
  const variants = {
    primary: { background: 'var(--teal)', color: '#fff', boxShadow: '0 1px 2px rgba(0,105,120,0.25)', _hoverShadow: '0 4px 14px rgba(0,151,167,0.32)' },
    navy: { background: 'var(--navy)', color: '#fff', boxShadow: '0 1px 2px rgba(13,43,51,0.25)', _hoverShadow: '0 4px 14px rgba(13,43,51,0.28)' },
    secondary: { background: 'var(--white)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', _hoverShadow: 'var(--shadow)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', boxShadow: 'none', _hoverShadow: 'var(--shadow-sm)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #fca5a5', boxShadow: 'none', _hoverShadow: '0 3px 10px rgba(220,38,38,0.18)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #86efac', boxShadow: 'none', _hoverShadow: '0 3px 10px rgba(22,163,74,0.16)' },
  };
  const v = variants[variant];
  const { _hoverShadow, ...restingStyle } = v;
  const restShadow = restingStyle.boxShadow;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}
      style={{ ...base, ...sizes[size], ...restingStyle, ...style }}
      onMouseEnter={e => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.filter = 'brightness(0.96)';
        e.currentTarget.style.boxShadow = _hoverShadow;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.filter = '';
        e.currentTarget.style.boxShadow = restShadow;
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}>
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, value, onChange, type = 'text', placeholder, required, min, max, step, error, hint, prefix, suffix, style, autoFocus }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}</label>}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--text-muted)', pointerEvents: 'none' }}>{prefix}</span>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={required} min={min} max={max} step={step} autoFocus={autoFocus}
        style={{
          width: '100%', padding: '10px 12px', fontSize: 14,
          paddingLeft: prefix ? 34 : 12, paddingRight: suffix ? 36 : 12,
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', background: 'var(--white)',
          color: 'var(--text-primary)', transition: 'border-color var(--transition), box-shadow var(--transition)',
          ...style
        }}
        onFocus={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--teal)'; e.target.style.boxShadow = error ? '0 0 0 3px rgba(220,38,38,0.14)' : 'var(--ring)'; }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
      {suffix && <span style={{ position: 'absolute', right: 12, fontSize: 13, color: 'var(--text-muted)', pointerEvents: 'none' }}>{suffix}</span>}
    </div>
    {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    {hint && !error && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = ({ label, value, onChange, options, required, error, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}</label>}
    <select value={value} onChange={onChange} required={required}
      style={{
        width: '100%', padding: '10px 12px', fontSize: 14,
        border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', background: 'var(--white)',
        color: 'var(--text-primary)', cursor: 'pointer',
        transition: 'border-color var(--transition), box-shadow var(--transition)', ...style
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = 'var(--ring)'; }}
      onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}>
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
      ))}
    </select>
    {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 520, footer }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(13,43,51,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease'
    }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth, maxHeight: '90vh', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        animation: 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>{title}</h3>
          {onClose && (
            <button onClick={onClose} aria-label="Close"
              style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, transition: 'background var(--transition), color var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <X size={18} />
            </button>
          )}
        </div>
        <div style={{ padding: '22px' }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'info' }) => {
  const styles = {
    info: { background: 'var(--info-bg)', color: 'var(--teal-dark)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)' },
    gray: { background: 'var(--surface-2)', color: 'var(--text-secondary)' },
    navy: { background: 'var(--navy)', color: '#fff' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      letterSpacing: '-0.01em', lineHeight: 1.4, whiteSpace: 'nowrap',
      ...styles[variant]
    }}>{children}</span>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onClick }) => {
  const clickable = !!onClick;
  return (
    <div onClick={onClick} style={{
      background: 'var(--white)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      cursor: clickable ? 'pointer' : 'default',
      transition: 'transform var(--transition), box-shadow var(--transition), border-color var(--transition)',
      ...style
    }}
      onMouseEnter={clickable ? (e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }) : undefined}
      onMouseLeave={clickable ? (e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; }) : undefined}>
      {children}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, sub, color = 'var(--teal)', trend }) => (
  <Card style={{ padding: '18px 20px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
      </div>
      {icon && <div style={{ width: 44, height: 44, background: color + '18', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>}
    </div>
  </Card>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const Empty = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
    {icon && <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: 'var(--text-muted)' }}>{icon}</div>}
    <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</p>
    {description && <p style={{ fontSize: 14, marginBottom: 18, maxWidth: 360, margin: '0 auto 18px' }}>{description}</p>}
    {action}
  </div>
);

// ─── Alert ────────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children, onClose }) => {
  const map = {
    info: { icon: <Info size={16} />, bg: 'var(--info-bg)', color: 'var(--teal-dark)', border: 'var(--teal-subtle)' },
    success: { icon: <CheckCircle size={16} />, bg: 'var(--success-bg)', color: 'var(--success)', border: '#86efac' },
    warning: { icon: <AlertTriangle size={16} />, bg: 'var(--warning-bg)', color: 'var(--warning)', border: '#fcd34d' },
    danger: { icon: <XCircle size={16} />, bg: 'var(--danger-bg)', color: 'var(--danger)', border: '#fca5a5' },
  };
  const s = map[type];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 'var(--radius)', color: s.color, fontSize: 14, lineHeight: 1.5 }}>
      <span style={{ flexShrink: 0, marginTop: 1, display: 'flex' }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss" style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: s.color, padding: 0, opacity: 0.7 }}><X size={14} /></button>}
    </div>
  );
};

// ─── Loading ──────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <div style={{
      width: 32, height: 32, border: '3px solid var(--border)',
      borderTopColor: 'var(--teal)', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(14px) scale(0.98);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}`}</style>
  </div>
);

// ─── Search Bar ───────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...', style }) => (
  <div style={{ position: 'relative', ...style }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input type="text" value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px 10px 36px', fontSize: 14,
        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--white)', color: 'var(--text-primary)',
        transition: 'border-color var(--transition), box-shadow var(--transition)',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = 'var(--ring)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', confirmVariant = 'danger' }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth={420}
    footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn></>}>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
  </Modal>
);
