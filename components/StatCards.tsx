'use client';

import Link from 'next/link';

interface StatCard {
  label: string;
  value: string | number;
  change: string;
  href: string;
  color: string;
  bg: string;
  icon: string;
}

export default function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
      gap: '14px',
      marginBottom: '28px',
    }}>
      {cards.map((card, i) => (
        <Link
          key={card.label}
          href={card.href}
          className="animate-in stat-card"
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            textDecoration: 'none',
            display: 'block',
            animationDelay: `${i * 0.05}s`,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '14px',
          }}>
            <span style={{
              fontSize: '10px', fontWeight: '600',
              color: 'var(--text3)', letterSpacing: '0.8px',
              fontFamily: 'var(--font-mono)',
            }}>
              {card.label.toUpperCase()}
            </span>
            <span style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: card.bg, color: card.color,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '16px',
            }}>
              {card.icon}
            </span>
          </div>
          <div style={{
            fontSize: '32px', fontWeight: '700',
            color: 'var(--text)', lineHeight: 1,
            letterSpacing: '-1px', marginBottom: '8px',
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: '12px', color: card.color, fontWeight: '500' }}>
            {card.change} →
          </div>
        </Link>
      ))}
    </div>
  );
}