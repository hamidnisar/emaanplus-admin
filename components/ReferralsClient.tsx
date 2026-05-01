'use client';

import React, { useState } from 'react';

interface Referral {
  uid:            string;
  displayName:    string;
  email:          string;
  photoURL:       string | null;
  city:           string;
  country:        string;
  referralCode:   string;
  referralCount:  number;
  referralReward: number;
  totalScore:     number;
  status:         string;
  createdAt:      string;
}

interface Settings {
  rewardPoints: number;
  maxPerUser:   number;
  enabled:      boolean;
  welcomeBonus: number;
}

function Avatar({ item }: { item: Referral }) {
  const [err, setErr] = useState(false);
  if (item.photoURL && !err) {
    return (
      <img
        src={item.photoURL}
        alt={item.displayName}
        onError={() => setErr(true)}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--accent)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'var(--accent-bg)', color: 'var(--accent)',
      fontSize: 11, fontWeight: 700, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid var(--accent)',
    }}>
      {item.displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ReferralsClient({
  initialReferrals,
  initialSettings,
}: {
  initialReferrals: Referral[];
  initialSettings:  Settings;
}) {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [settings, setSettings]   = useState<Settings>(initialSettings);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved]   = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────

  const totalUses    = referrals.reduce((s, r) => s + r.referralCount, 0);
  const totalRewards = referrals.reduce((s, r) => s + r.referralReward, 0);
  const topReferrer  = referrals[0];

  // ── Helpers ───────────────────────────────────────────────────────

  const filtered = referrals.filter(r =>
    r.displayName.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.referralCode.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase())
  );

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  async function resetCode(uid: string) {
    if (!confirm('Reset this referral code? The old code will stop working.')) return;
    setLoading(uid);
    try {
      const res  = await fetch(`/api/referrals/${uid}/reset`, { method: 'POST' });
      const data = await res.json();
      if (data.code) {
        setReferrals(rs => rs.map(r =>
          r.uid === uid
            ? { ...r, referralCode: data.code, referralCount: 0, referralReward: 0 }
            : r
        ));
      }
    } finally {
      setLoading(null);
    }
  }

  async function disableCode(uid: string) {
    if (!confirm('Disable this referral code? The user will lose their code.')) return;
    setLoading(uid);
    try {
      await fetch(`/api/referrals/${uid}/disable`, { method: 'POST' });
      setReferrals(rs => rs.filter(r => r.uid !== uid));
    } finally {
      setLoading(null);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px', fontSize: '13px',
    fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--text2)', marginBottom: '6px',
    letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
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
          { label: 'Active codes',  value: referrals.length,           color: 'var(--accent)'  },
          { label: 'Total uses',    value: totalUses,                  color: 'var(--success)' },
          { label: 'Points given',  value: totalRewards.toLocaleString(), color: 'var(--warning)' },
          { label: 'Top referrer',  value: topReferrer?.displayName.split(' ')[0] || '—', color: 'var(--purple)' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

        {/* ── Left: referral codes table ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Search */}
          <input
            style={{ ...inputStyle }}
            placeholder="Search by name, email, code or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>◐</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                No referral codes yet
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                Generate codes from the Users page
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
                    {['Player', 'Code', 'Uses', 'Rewards', 'Actions'].map(h => (
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
                  {filtered.map((r, i) => {
                    const isLoading = loading === r.uid;
                    return (
                      <tr
                        key={r.uid}
                        style={{
                          borderBottom: i < filtered.length - 1
                            ? '0.5px solid var(--border)' : 'none',
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Player */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Avatar item={r} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '13px', fontWeight: 600, color: 'var(--text)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {r.displayName}
                              </div>
                              <div style={{
                                fontSize: '11px', color: 'var(--text3)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {r.city ? `${r.city}, ${r.country}` : r.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: '13px',
                              fontWeight: 700, color: 'var(--accent)',
                              background: 'var(--accent-bg)',
                              padding: '4px 10px', borderRadius: '6px',
                              letterSpacing: '1px',
                            }}>
                              {r.referralCode}
                            </span>
                            <button
                              onClick={() => copyCode(r.referralCode)}
                              title="Copy code"
                              style={{
                                background: copied === r.referralCode
                                  ? 'var(--success-bg)' : 'none',
                                border: 'none', cursor: 'pointer',
                                color: copied === r.referralCode
                                  ? 'var(--success)' : 'var(--text3)',
                                padding: '4px', borderRadius: '5px',
                                display: 'flex', transition: 'all 0.2s',
                              }}
                            >
                              {copied === r.referralCode ? (
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                  <path d="M3 8l3 3 7-7" stroke="currentColor"
                                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                  <rect x="5" y="5" width="9" height="9" rx="2"
                                    stroke="currentColor" strokeWidth="1.3"/>
                                  <path d="M3 11V3a2 2 0 0 1 2-2h8"
                                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Uses */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{
                            fontSize: '18px', fontWeight: 700,
                            color: r.referralCount > 0 ? 'var(--success)' : 'var(--text3)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {r.referralCount}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>
                            of {settings.maxPerUser} max
                          </div>
                          {/* mini progress bar */}
                          <div style={{
                            marginTop: '4px', height: '3px',
                            background: 'var(--border)',
                            borderRadius: '2px', overflow: 'hidden',
                            width: '80px',
                          }}>
                            <div style={{
                              width: `${Math.min((r.referralCount / settings.maxPerUser) * 100, 100)}%`,
                              height: '100%',
                              background: r.referralCount >= settings.maxPerUser
                                ? 'var(--danger)' : 'var(--success)',
                              borderRadius: '2px',
                            }} />
                          </div>
                        </td>

                        {/* Rewards */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: 600,
                            color: 'var(--warning)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            +{r.referralReward} pts
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => resetCode(r.uid)}
                              disabled={isLoading}
                              style={{
                                padding: '5px 10px', borderRadius: '7px',
                                fontSize: '11px', fontFamily: 'var(--font)',
                                cursor: 'pointer',
                                background: 'var(--accent-bg)',
                                border: '0.5px solid var(--accent)',
                                color: 'var(--accent)',
                                opacity: isLoading ? 0.5 : 1,
                              }}
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => disableCode(r.uid)}
                              disabled={isLoading}
                              style={{
                                padding: '5px 10px', borderRadius: '7px',
                                fontSize: '11px', fontFamily: 'var(--font)',
                                cursor: 'pointer',
                                background: 'var(--danger-bg)',
                                border: '0.5px solid var(--danger)',
                                color: 'var(--danger)',
                                opacity: isLoading ? 0.5 : 1,
                              }}
                            >
                              Disable
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'right' }}>
            {filtered.length} of {referrals.length} codes shown
          </div>
        </div>

        {/* ── Right: settings panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Global toggle */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '4px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Referral system
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                style={{
                  width: '44px', height: '24px',
                  borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: settings.enabled ? 'var(--success)' : 'var(--border2)',
                  position: 'relative', transition: 'background 0.2s',
                  padding: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: settings.enabled ? '23px' : '3px',
                  width: '18px', height: '18px',
                  borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
              {settings.enabled
                ? 'Referral codes are active'
                : 'All referral codes are paused'}
            </div>
          </div>

          {/* Settings form */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text)', marginBottom: '16px',
            }}>
              Reward settings
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>POINTS PER REFERRAL</label>
              <input
                type="number" min={0} max={1000}
                style={inputStyle}
                value={settings.rewardPoints}
                onChange={e => setSettings(s => ({
                  ...s, rewardPoints: Number(e.target.value),
                }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Points awarded to referrer per successful signup
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>WELCOME BONUS (NEW USER)</label>
              <input
                type="number" min={0} max={1000}
                style={inputStyle}
                value={settings.welcomeBonus}
                onChange={e => setSettings(s => ({
                  ...s, welcomeBonus: Number(e.target.value),
                }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Bonus points for the new user who used a referral code
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>MAX REFERRALS PER USER</label>
              <input
                type="number" min={1} max={1000}
                style={inputStyle}
                value={settings.maxPerUser}
                onChange={e => setSettings(s => ({
                  ...s, maxPerUser: Number(e.target.value),
                }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Maximum number of times one code can be used
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {savingSettings ? 'Saving...'
                : settingsSaved ? 'Saved ✓'
                : 'Save settings'}
            </button>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text)', marginBottom: '12px',
            }}>
              How referrals work
            </div>
            {[
              { step: '1', text: 'Admin generates a referral code for a player' },
              { step: '2', text: 'Player shares their code with friends' },
              { step: '3', text: 'New user enters code on signup in the mobile app' },
              { step: '4', text: `Both get bonus points — ${settings.rewardPoints} for referrer, ${settings.welcomeBonus} for new user` },
            ].map(item => (
              <div key={item.step} style={{
                display: 'flex', gap: '10px',
                marginBottom: '10px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '1px',
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}