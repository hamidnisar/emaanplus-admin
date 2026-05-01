'use client';

interface TopbarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--surface)',
      borderBottom: '0.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backdropFilter: 'blur(12px)',
    }}>
      <div>
        <h1 style={{
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--text)',
          letterSpacing: '-0.2px',
          lineHeight: 1,
        }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{subtitle}</p>
        )}
      </div>
      {action && <div style={{ display: 'flex', gap: '8px' }}>{action}</div>}
    </header>
  );
}