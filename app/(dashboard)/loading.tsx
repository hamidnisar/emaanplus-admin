export default function DashboardLoading() {
  const bar = (w: string, h = '14px') => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: '6px' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Topbar skeleton */}
      <div style={{
        height: '60px',
        borderBottom: '0.5px solid var(--border)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {bar('140px', '16px')}
          {bar('220px', '11px')}
        </div>
        {bar('100px', '34px')}
      </div>

      {/* Content skeleton */}
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        {/* Stat cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bar('60%', '11px')}
              {bar('40%', '28px')}
              {bar('50%', '11px')}
            </div>
          ))}
        </div>

        {/* Main content block */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '0.5px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex', gap: '16px',
          }}>
            {['30%', '15%', '12%', '12%', '12%', '14%'].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: w, height: '11px', borderRadius: '4px' }} />
            ))}
          </div>
          {/* Table rows */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              padding: '16px',
              borderBottom: i < 5 ? '0.5px solid var(--border)' : 'none',
              display: 'flex', gap: '16px', alignItems: 'center',
            }}>
              {['30%', '15%', '12%', '12%', '12%', '14%'].map((w, j) => (
                <div key={j} className="skeleton" style={{ width: w, height: j === 0 ? '14px' : '11px', borderRadius: '4px' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
