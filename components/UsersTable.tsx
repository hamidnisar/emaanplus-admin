'use client';

import React,  { useState } from 'react';
import Image from 'next/image';

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  country: string;
  totalScore: number;
  quizzesPlayed: number;
  referralCode: string | null;
  referralCount: number;
  status: string;
  createdAt: string;
}

function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const isBanned = user.status === 'banned';

  if (user.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${isBanned ? 'var(--danger)' : 'var(--accent)'}`,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%', flexShrink: 0,
      background: isBanned ? 'var(--danger-bg)' : 'var(--accent-bg)',
      border: `2px solid ${isBanned ? 'var(--danger)' : 'var(--accent)'}`,
      color: isBanned ? 'var(--danger)' : 'var(--accent)',
      fontSize: size * 0.3,
      fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {user.displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers]       = useState<User[]>(initialUsers);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'active' | 'banned'>('all');
  const [loading, setLoading]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────

  function filtered() {
    return users.filter(u => {
      const matchSearch =
        u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.city.toLowerCase().includes(search.toLowerCase()) ||
        u.country.toLowerCase().includes(search.toLowerCase()) ||
        (u.referralCode || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || u.status === filter;
      return matchSearch && matchFilter;
    });
  }

  async function toggleBan(uid: string, current: string) {
    const newStatus = current === 'banned' ? 'active' : 'banned';
    setLoading(uid);
    try {
      await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers(us => us.map(u =>
        u.uid === uid ? { ...u, status: newStatus } : u
      ));
    } finally {
      setLoading(null);
    }
  }

  async function generateReferral(uid: string) {
    setLoading(uid);
    try {
      const res  = await fetch(`/api/users/${uid}/referral`, { method: 'POST' });
      const data = await res.json();
      if (data.code) {
        setUsers(us => us.map(u =>
          u.uid === uid ? { ...u, referralCode: data.code } : u
        ));
      }
    } finally {
      setLoading(null);
    }
  }

  async function deleteUser(uid: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setLoading(uid);
    try {
      await fetch(`/api/users/${uid}`, { method: 'DELETE' });
      setUsers(us => us.filter(u => u.uid !== uid));
      if (expanded === uid) setExpanded(null);
    } finally {
      setLoading(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatLocation(user: User) {
    return [user.city, user.country].filter(Boolean).join(', ') || '—';
  }

  // ── Render ────────────────────────────────────────────────────────

  const list  = filtered();
  const stats = {
    total:   users.length,
    active:  users.filter(u => u.status === 'active').length,
    banned:  users.filter(u => u.status === 'banned').length,
    withRef: users.filter(u => u.referralCode).length,
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'var(--font)',
    color: 'var(--text)',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
        gap: '12px',
      }}>
        {[
          { label: 'Total players', value: stats.total,   color: 'var(--accent)'  },
          { label: 'Active',        value: stats.active,  color: 'var(--success)' },
          { label: 'Banned',        value: stats.banned,  color: 'var(--danger)'  },
          { label: 'With referral', value: stats.withRef, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
              letterSpacing: '0.7px', fontFamily: 'var(--font-mono)', marginBottom: '6px',
            }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Search by name, email, city, country or referral code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'active', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', borderRadius: '8px',
              fontSize: '12px', fontFamily: 'var(--font)', cursor: 'pointer',
              fontWeight: filter === f ? 600 : 400,
              background: filter === f ? 'var(--accent)' : 'var(--surface)',
              color:      filter === f ? 'white' : 'var(--text2)',
              border:     filter === f
                ? '0.5px solid var(--accent)'
                : '0.5px solid var(--border2)',
              transition: 'all 0.15s',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {list.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
            {search ? 'No users match your search.' : 'No users yet.'}
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
                {['Player', 'Location', 'Score', 'Referral code', 'Status', 'Actions'].map(h => (
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
              {list.map((user, i) => {
  const isBanned   = user.status === 'banned';
  const isExpanded = expanded === user.uid;
  const isLoading  = loading === user.uid;

  return (
    <React.Fragment key={user.uid}>
      <tr
        onClick={() => setExpanded(isExpanded ? null : user.uid)}
        style={{
          borderBottom: '0.5px solid var(--border)',
          background: isBanned
            ? 'rgba(240,68,56,0.03)'
            : isExpanded ? 'var(--surface2)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {/* Player */}
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar user={user} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.displayName}
              </div>
              <div style={{
                fontSize: '11px', color: 'var(--text3)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.email}
              </div>
            </div>
          </div>
        </td>

        {/* Location */}
        <td style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
            {user.city || '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
            {user.country || ''}
          </div>
        </td>

        {/* Score */}
        <td style={{
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px', fontWeight: 600, color: 'var(--text)',
        }}>
          {user.totalScore.toLocaleString()}
          <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 400 }}>
            {user.quizzesPlayed} quizzes
          </div>
        </td>

        {/* Referral */}
        <td style={{ padding: '12px 16px' }}>
          {user.referralCode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                fontWeight: 600, color: 'var(--accent)',
                background: 'var(--accent-bg)',
                padding: '3px 8px', borderRadius: '6px',
                letterSpacing: '0.5px',
              }}>
                {user.referralCode}
              </span>
              <button
                onClick={e => { e.stopPropagation(); copyCode(user.referralCode!); }}
                title="Copy code"
                style={{
                  background: copied === user.referralCode ? 'var(--success-bg)' : 'none',
                  border: 'none', cursor: 'pointer',
                  color: copied === user.referralCode ? 'var(--success)' : 'var(--text3)',
                  padding: '3px', borderRadius: '4px',
                  display: 'flex', transition: 'all 0.2s',
                }}
              >
                {copied === user.referralCode ? (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M3 11V3a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <span style={{
                fontSize: '10px', color: 'var(--text3)',
                fontFamily: 'var(--font-mono)',
              }}>
                ×{user.referralCount}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>No code</span>
          )}
        </td>

        {/* Status */}
        <td style={{ padding: '12px 16px' }}>
          <span className={`pill ${isBanned ? 'pill-red' : 'pill-green'}`}>
            {user.status}
          </span>
        </td>

        {/* Actions */}
        <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => generateReferral(user.uid)}
              disabled={isLoading}
              style={{
                padding: '5px 10px', borderRadius: '7px',
                fontSize: '11px', fontFamily: 'var(--font)', cursor: 'pointer',
                background: 'var(--accent-bg)',
                border: '0.5px solid var(--accent)',
                color: 'var(--accent)',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {user.referralCode ? 'Regen' : '+ Code'}
            </button>
            <button
              onClick={() => toggleBan(user.uid, user.status)}
              disabled={isLoading}
              style={{
                padding: '5px 10px', borderRadius: '7px',
                fontSize: '11px', fontFamily: 'var(--font)', cursor: 'pointer',
                background: isBanned ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `0.5px solid ${isBanned ? 'var(--success)' : 'var(--danger)'}`,
                color: isBanned ? 'var(--success)' : 'var(--danger)',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isBanned ? 'Unban' : 'Ban'}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail panel */}
      {isExpanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div style={{
              padding: '20px 20px 20px 72px',
              background: 'var(--surface2)',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                marginBottom: '16px',
              }}>

                {/* Profile */}
                <div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
                    letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
                    marginBottom: '10px',
                  }}>PROFILE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <Avatar user={user} size={52} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        {user.displayName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{user.email}</div>
                      {user.phone && (
                        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{user.phone}</div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px', color: 'var(--text3)',
                    fontFamily: 'var(--font-mono)', wordBreak: 'break-all',
                  }}>
                    UID: {user.uid}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
                    letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
                    marginBottom: '10px',
                  }}>LOCATION</div>
                  {[
                    { label: 'Address',     value: user.address    },
                    { label: 'City',        value: user.city       },
                    { label: 'Postal code', value: user.postalCode },
                    { label: 'Country',     value: user.country    },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', minWidth: '80px' }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
                        {item.value || '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
                    letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
                    marginBottom: '10px',
                  }}>STATS</div>
                  {[
                    { label: 'Total score',    value: `${user.totalScore.toLocaleString()} pts` },
                    { label: 'Quizzes played', value: String(user.quizzesPlayed) },
                    { label: 'Referral uses',  value: String(user.referralCount) },
                    { label: 'Joined',         value: user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'
                    },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', minWidth: '110px' }}>
                        {item.label}
                      </span>
                      <span style={{
                        fontSize: '12px', color: 'var(--text)',
                        fontWeight: 500, fontFamily: 'var(--font-mono)',
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => deleteUser(user.uid, user.displayName)}
                  disabled={isLoading}
                  style={{
                    padding: '7px 16px', borderRadius: '8px',
                    fontSize: '12px', fontFamily: 'var(--font)', cursor: 'pointer',
                    background: 'var(--danger-bg)',
                    border: '0.5px solid var(--danger)',
                    color: 'var(--danger)',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  Delete user permanently
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
})}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'right' }}>
        Showing {list.length} of {users.length} users · Click a row to expand
      </div>
    </div>
  );
}