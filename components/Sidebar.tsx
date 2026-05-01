'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

const sections = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/',          label: 'Dashboard',     icon: Grid },
      { href: '/quizzes',   label: 'Quizzes',       icon: List },
    ],
  },
  {
    label: 'PLAYERS',
    items: [
      { href: '/users',         label: 'Users',         icon: Users },
      { href: '/leaderboard',   label: 'Leaderboard',   icon: Trophy },
      { href: '/referrals',     label: 'Referrals',     icon: Share },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { href: '/blog', label: 'Blog', icon: Blog },
    ],
  },
  {
    label: 'MONETIZATION',
    items: [
      { href: '/ads', label: 'Ads', icon: Ads },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
    ],
  },
];

function Grid()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg> }
function List()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h9M2 12h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Help()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5.5C7 5.5 6 6.1 6 7.1c0 .7.5 1.1 1 1.4L8 9M8 11.5v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Users()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 7c1.4.3 2.5 1.5 2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.4"/></svg> }
function Trophy()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 2h6v5a3 3 0 0 1-6 0V2Z" stroke="currentColor" strokeWidth="1.4"/><path d="M2 3h3M11 3h3M8 10v3M5.5 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Share()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="12.5" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.4"/><circle cx="12.5" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.4"/><circle cx="3.5" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4"/><path d="M5.2 7.1l5.6-3.2M5.2 8.9l5.6 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Bell()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 0 1 4 4v2.5l1.5 2.5h-11L4 8.5V6a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4"/></svg> }
function Settings() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.2 3.2l1 1M11.8 11.8l1 1M3.2 12.8l1-1M11.8 4.2l1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Blog()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8.5 6h4M8.5 8.5h4M3 11h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function Ads()      { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 10V6.5l2.5 3.5 2.5-3.5V10M11 10V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function Sun()      { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.2 3.2l1 1M11.8 11.8l1 1M3.2 12.8l1-1M11.8 4.2l1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function Moon()     { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> }
function Logout()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  }

  const initials = user?.displayName
    ?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  const roleColor: Record<string, string> = {
    super_admin: 'var(--accent)',
    admin:       'var(--success)',
    editor:      'var(--warning)',
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--surface)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 40,
    }}>

      {/* Logo */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79,110,247,0.35)',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 12H2L8 2Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.3px' }}>QuizAdmin</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>v1.0 · panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section.label} style={{ marginBottom: '6px' }}>
            <div style={{
              fontSize: '10px', color: 'var(--text3)',
              padding: '8px 8px 5px',
              letterSpacing: '0.8px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '500',
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              if ((item as any).adminOnly && user?.role === 'editor') return null;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  fontWeight: active ? '600' : '400',
                  fontSize: '13px',
                  textDecoration: 'none',
                  border: active ? '0.5px solid rgba(79,110,247,0.2)' : '0.5px solid transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}>
                  <span style={{
                    color: active ? 'var(--accent)' : 'var(--text3)',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}>
                    <item.icon />
                  </span>
                  {item.label}
                  {active && (
                    <span style={{
                      position: 'absolute', right: '10px',
                      width: '5px', height: '5px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px',
        borderTop: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>

        {/* Theme toggle */}
        <button onClick={toggle} style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px', borderRadius: '8px',
          border: '0.5px solid var(--border)',
          background: 'var(--surface2)',
          color: 'var(--text2)',
          cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font)',
          width: '100%',
          transition: 'all 0.15s',
        }}>
          {theme === 'light' ? <Sun /> : <Moon />}
          {theme === 'light' ? 'Light mode' : 'Dark mode'}
          <span style={{
            marginLeft: 'auto',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
          }}>
            {theme}
          </span>
        </button>

        {/* User row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px',
          borderRadius: '8px',
          border: '0.5px solid var(--border)',
          background: 'var(--surface2)',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'var(--accent)',
            color: 'white',
            fontSize: '11px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 6px rgba(79,110,247,0.3)',
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px', fontWeight: '600', color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.displayName || user?.email?.split('@')[0]}
            </div>
            <div style={{
              fontSize: '10px',
              color: roleColor[user?.role || 'admin'] || 'var(--text3)',
              fontFamily: 'var(--font-mono)', fontWeight: '500',
            }}>
              {user?.role?.replace('_', ' ') || 'admin'}
            </div>
          </div>
          <button onClick={handleLogout} title="Sign out" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', padding: '4px', borderRadius: '6px',
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}>
            <Logout />
          </button>
        </div>
      </div>
    </aside>
  );
}