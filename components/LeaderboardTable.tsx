'use client';

import React, { useState } from 'react';

interface Player {
  rank:          number;
  uid:           string;
  displayName:   string;
  email:         string;
  photoURL:      string | null;
  city:          string;
  country:       string;
  totalScore:    number;
  quizzesPlayed: number;
  referralCount: number;
  status:        string;
  createdAt:     string;
}

interface Quiz {
  id:    string;
  title: string;
}

function Avatar({ player, size = 36 }: { player: Player; size?: number }) {
  const [err, setErr] = useState(false);
  if (player.photoURL && !err) {
    return (
      <img
        src={player.photoURL}
        alt={player.displayName}
        onError={() => setErr(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--border2)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--accent-bg)',
      color: 'var(--accent)',
      fontSize: size * 0.3, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid var(--accent)',
    }}>
      {player.displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medals: Record<number, { bg: string; color: string; label: string }> = {
    1: { bg: 'rgba(186,117,23,0.12)', color: '#BA7517', label: '🥇' },
    2: { bg: 'rgba(95,94,90,0.12)',   color: '#5F5E5A', label: '🥈' },
    3: { bg: 'rgba(153,60,29,0.12)',  color: '#993C1D', label: '🥉' },
  };
  const medal = medals[rank];

  if (medal) {
    return (
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: medal.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', flexShrink: 0,
      }}>
        {medal.label}
      </div>
    );
  }

  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      background: 'var(--surface2)',
      border: '0.5px solid var(--border2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 700,
      color: 'var(--text3)', fontFamily: 'var(--font-mono)',
      flexShrink: 0,
    }}>
      {rank}
    </div>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '5px',
        background: 'var(--border)',
        borderRadius: '3px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'var(--accent)',
          borderRadius: '3px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontSize: '12px', fontWeight: 700,
        color: 'var(--text)', fontFamily: 'var(--font-mono)',
        minWidth: '50px', textAlign: 'right',
      }}>
        {score.toLocaleString()}
      </span>
    </div>
  );
}

export default function LeaderboardTable({
  players,
  quizzes,
}: {
  players: Player[];
  quizzes: Quiz[];
}) {
  const [period, setPeriod]   = useState<'all' | 'weekly' | 'monthly'>('all');
  const [search, setSearch]   = useState('');
  const [exporting, setExporting] = useState(false);

  const maxScore = players[0]?.totalScore || 1;

  // filter by search
  const filtered = players.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  // top 3 for podium
  const top3 = players.slice(0, 3);

  // stats
  const totalScore  = players.reduce((s, p) => s + p.totalScore, 0);
  const avgScore    = players.length > 0
    ? Math.round(totalScore / players.length) : 0;
  const topCity     = (() => {
    const counts: Record<string, number> = {};
    players.forEach(p => { if (p.city) counts[p.city] = (counts[p.city] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  })();

  function exportCSV() {
    setExporting(true);
    const rows = [
      ['Rank', 'Name', 'Email', 'City', 'Country', 'Score', 'Quizzes Played'],
      ...filtered.map(p => [
        p.rank, p.displayName, p.email,
        p.city, p.country, p.totalScore, p.quizzesPlayed,
      ]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px', fontSize: '13px',
    fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Stats row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
        gap: '12px',
      }}>
        {[
          { label: 'Total players', value: players.length,           color: 'var(--accent)'  },
          { label: 'Top score',     value: players[0]?.totalScore.toLocaleString() || '—', color: 'var(--warning)' },
          { label: 'Avg score',     value: avgScore.toLocaleString(), color: 'var(--success)' },
          { label: 'Top city',      value: topCity,                  color: 'var(--purple)'  },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
              letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
              marginBottom: '6px',
            }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: 700,
              color: s.color, lineHeight: 1,
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Podium (top 3) ── */}
      {top3.length >= 3 && (
        <div className="card" style={{ padding: '28px 24px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text3)',
            letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
            marginBottom: '24px', textAlign: 'center',
          }}>
            TOP 3 PLAYERS
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr',
            gap: '12px', alignItems: 'flex-end',
          }}>
            {/* 2nd place */}
            <div style={{ textAlign: 'center', paddingBottom: '0' }}>
              <Avatar player={top3[1]} size={52} />
              <div style={{
                marginTop: '10px', fontSize: '13px', fontWeight: 600,
                color: 'var(--text)',
              }}>
                {top3[1].displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>
                {top3[1].city || top3[1].email}
              </div>
              <div style={{
                fontSize: '18px', fontWeight: 700, color: '#5F5E5A',
                fontFamily: 'var(--font-mono)',
              }}>
                {top3[1].totalScore.toLocaleString()}
              </div>
              <div style={{
                marginTop: '12px', height: '60px',
                background: 'var(--surface2)',
                border: '0.5px solid var(--border)',
                borderRadius: '8px 8px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
              }}>🥈</div>
            </div>

            {/* 1st place */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#BA7517', margin: '0 auto 8px',
                boxShadow: '0 0 12px rgba(186,117,23,0.5)',
              }} />
              <Avatar player={top3[0]} size={64} />
              <div style={{
                marginTop: '10px', fontSize: '14px', fontWeight: 700,
                color: 'var(--text)',
              }}>
                {top3[0].displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>
                {top3[0].city || top3[0].email}
              </div>
              <div style={{
                fontSize: '22px', fontWeight: 700, color: '#BA7517',
                fontFamily: 'var(--font-mono)',
              }}>
                {top3[0].totalScore.toLocaleString()}
              </div>
              <div style={{
                marginTop: '12px', height: '84px',
                background: 'rgba(186,117,23,0.08)',
                border: '0.5px solid rgba(186,117,23,0.3)',
                borderRadius: '8px 8px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px',
              }}>🥇</div>
            </div>

            {/* 3rd place */}
            <div style={{ textAlign: 'center' }}>
              <Avatar player={top3[2]} size={52} />
              <div style={{
                marginTop: '10px', fontSize: '13px', fontWeight: 600,
                color: 'var(--text)',
              }}>
                {top3[2].displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>
                {top3[2].city || top3[2].email}
              </div>
              <div style={{
                fontSize: '18px', fontWeight: 700, color: '#993C1D',
                fontFamily: 'var(--font-mono)',
              }}>
                {top3[2].totalScore.toLocaleString()}
              </div>
              <div style={{
                marginTop: '12px', height: '44px',
                background: 'var(--surface2)',
                border: '0.5px solid var(--border)',
                borderRadius: '8px 8px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px',
              }}>🥉</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'weekly', 'monthly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '7px 14px', borderRadius: '8px',
              fontSize: '12px', fontFamily: 'var(--font)', cursor: 'pointer',
              fontWeight: period === p ? 600 : 400,
              background: period === p ? 'var(--accent)' : 'var(--surface)',
              color:      period === p ? 'white' : 'var(--text2)',
              border:     period === p
                ? '0.5px solid var(--accent)'
                : '0.5px solid var(--border2)',
              transition: 'all 0.15s',
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="btn"
          style={{ whiteSpace: 'nowrap' }}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* ── Full table ── */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
            No players found.
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface2)',
                borderBottom: '0.5px solid var(--border)',
              }}>
                {['Rank', 'Player', 'Location', 'Score', 'Quizzes', 'Referrals'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: '10px', fontWeight: 600,
                    color: 'var(--text3)', letterSpacing: '0.7px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((player, i) => (
                <tr
                  key={player.uid}
                  style={{
                    borderBottom: i < filtered.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                    background: player.rank <= 3
                      ? player.rank === 1 ? 'rgba(186,117,23,0.04)'
                      : player.rank === 2 ? 'rgba(95,94,90,0.03)'
                      : 'rgba(153,60,29,0.03)'
                      : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Rank */}
                  <td style={{ padding: '12px 16px', width: '64px' }}>
                    <RankBadge rank={player.rank} />
                  </td>

                  {/* Player */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar player={player} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: 600, color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {player.displayName}
                        </div>
                        <div style={{
                          fontSize: '11px', color: 'var(--text3)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {player.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                      {player.city || '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      {player.country}
                    </div>
                  </td>

                  {/* Score with bar */}
                  <td style={{ padding: '12px 16px', minWidth: '140px' }}>
                    <ScoreBar score={player.totalScore} max={maxScore} />
                  </td>

                  {/* Quizzes */}
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '13px', fontFamily: 'var(--font-mono)',
                    fontWeight: 600, color: 'var(--text)',
                  }}>
                    {player.quizzesPlayed}
                  </td>

                  {/* Referrals */}
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '13px', fontFamily: 'var(--font-mono)',
                    color: player.referralCount > 0 ? 'var(--success)' : 'var(--text3)',
                    fontWeight: player.referralCount > 0 ? 600 : 400,
                  }}>
                    {player.referralCount > 0 ? `+${player.referralCount}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        fontSize: '12px', color: 'var(--text3)', textAlign: 'right',
      }}>
        Showing {filtered.length} of {players.length} players · Sorted by total score
      </div>
    </div>
  );
}