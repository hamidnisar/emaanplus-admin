import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import StatCards from '@/components/StatCards';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const getStats = unstable_cache(
  async () => {
    try {
      const [quizzesSnap, usersSnap] = await Promise.all([
        adminDb.collection('quizzes').get(),
        adminDb.collection('players').get(),
      ]);
      const totalScore = usersSnap.docs.reduce(
        (s, d) => s + (d.data().totalScore || 0), 0
      );
      return {
        totalQuizzes: quizzesSnap.size,
        totalPlayers: usersSnap.size,
        avgScore: usersSnap.size > 0
          ? Math.round(totalScore / usersSnap.size)
          : 0,
      };
    } catch {
      return { totalQuizzes: 0, totalPlayers: 0, avgScore: 0 };
    }
  },
  ['dashboard-stats'],
  { revalidate: 30 },
);

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: 'Total quizzes', value: stats.totalQuizzes, change: 'Manage content',    href: '/quizzes',      color: 'var(--accent)',  bg: 'var(--accent-bg)',  icon: '◈' },
    { label: 'Total players', value: stats.totalPlayers, change: 'View all users',    href: '/users',        color: 'var(--success)', bg: 'var(--success-bg)', icon: '◉' },
    { label: 'Avg score',     value: `${stats.avgScore}`,change: 'See leaderboard',   href: '/leaderboard',  color: 'var(--purple)',  bg: 'var(--purple-bg)',  icon: '◎' },
    { label: 'Referrals',     value: '—',                change: 'Manage referrals',  href: '/referrals',    color: 'var(--warning)', bg: 'var(--warning-bg)', icon: '◐' },
  ];

  const quickActions = [
    { label: 'Create new quiz',    href: '/quizzes/new',   color: 'var(--accent)',  desc: 'Add a new quiz with questions' },
    { label: 'Add questions',      href: '/questions',     color: 'var(--success)', desc: 'Build your question bank' },
    { label: 'View leaderboard',   href: '/leaderboard',   color: 'var(--purple)',  desc: 'See top performing players' },
    { label: 'Manage users',       href: '/users',         color: 'var(--warning)', desc: 'View, ban or reward users' },
    { label: 'Referral codes',     href: '/referrals',     color: 'var(--danger)',  desc: 'Track and manage referrals' },
    { label: 'Send notification',  href: '/notifications', color: 'var(--info)',    desc: 'Push message to all users' },
  ];

  const checklist = [
    { label: 'Admin panel created',   done: true },
    { label: 'Firebase connected',    done: true },
    { label: 'Admin login working',   done: true },
    { label: 'Create your first quiz',done: stats.totalQuizzes > 0 },
    { label: 'Add questions to quiz', done: false },
    { label: 'Invite first player',   done: stats.totalPlayers > 0 },
    { label: 'Set up referral codes', done: false },
  ];

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Welcome back — here's what's happening today"
      />
      <div style={{ padding: '28px', flex: 1 }}>

        <StatCards cards={statCards} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

          {/* Quick actions */}
          <div className="card animate-in" style={{ animationDelay: '0.25s', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                Quick actions
              </span>
            </div>
            {quickActions.map((action, i) => (
              <Link key={action.href} href={action.href}
                className="quick-action-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 20px',
                  borderBottom: i < quickActions.length - 1
                    ? '0.5px solid var(--border)' : 'none',
                  textDecoration: 'none',
                }}>
                <div style={{
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  background: action.color, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {action.desc}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                  style={{ color: 'var(--text3)', flexShrink: 0 }}>
                  <path d="M6 12l4-4-4-4" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>

          {/* Setup checklist */}
          <div className="card animate-in" style={{ animationDelay: '0.3s', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                Setup checklist
              </span>
              <span style={{
                marginLeft: '8px', fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                background: 'var(--accent-bg)',
                padding: '1px 7px', borderRadius: '10px',
              }}>
                {checklist.filter(c => c.done).length}/{checklist.length}
              </span>
            </div>
            {checklist.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 20px',
                borderBottom: i < checklist.length - 1
                  ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: '18px', height: '18px',
                  borderRadius: '50%', flexShrink: 0,
                  background: item.done ? 'var(--success-bg)' : 'var(--surface2)',
                  border: `1.5px solid ${item.done ? 'var(--success)' : 'var(--border2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {item.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="var(--success)"
                        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: '13px',
                  color: item.done ? 'var(--text3)' : 'var(--text)',
                  textDecoration: item.done ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text3)',
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}