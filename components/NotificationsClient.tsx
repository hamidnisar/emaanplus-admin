'use client';

import React, { useState } from 'react';

interface Notification {
  id:         string;
  title:      string;
  body:       string;
  targetType: string;
  targetUid:  string | null;
  targetCity: string | null;
  status:     string;
  sentCount:  number;
  failCount:  number;
  scheduleAt: string | null;
  createdAt:  string;
}

const TEMPLATES = [
  {
    label:  'New quiz available',
    title:  'New Quiz Available!',
    body:   'A new quiz has just been published. Test your knowledge now!',
  },
  {
    label:  'Weekly challenge',
    title:  'Weekly Challenge is Live!',
    body:   'This week\'s challenge is ready. Compete for the top spot on the leaderboard!',
  },
  {
    label:  'Leaderboard update',
    title:  'Leaderboard Updated',
    body:   'The leaderboard has been updated. Check your ranking now!',
  },
  {
    label:  'Welcome back',
    title:  'We Miss You!',
    body:   'It\'s been a while. Come back and play a quiz today!',
  },
  {
    label:  'Reward earned',
    title:  'You Earned a Reward!',
    body:   'Congratulations! Check your profile to see your new reward.',
  },
];

export default function NotificationsClient({
  initialNotifications,
  cities,
  playerCount,
}: {
  initialNotifications: Notification[];
  cities:               string[];
  playerCount:          number;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // form state
  const [title, setTitle]           = useState('');
  const [body, setBody]             = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific' | 'city'>('all');
  const [targetUid, setTargetUid]   = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const titleLen = title.length;
  const bodyLen  = body.length;

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setTitle(tpl.title);
    setBody(tpl.body);
  }

  function reset() {
    setTitle('');
    setBody('');
    setTargetType('all');
    setTargetUid('');
    setTargetCity('');
    setScheduleAt('');
    setResult(null);
  }

  async function handleSend() {
    if (!title.trim()) { setResult({ type: 'error', message: 'Title is required.' }); return; }
    if (!body.trim())  { setResult({ type: 'error', message: 'Message body is required.' }); return; }
    if (targetType === 'specific' && !targetUid.trim()) {
      setResult({ type: 'error', message: 'Please enter a user UID.' }); return;
    }
    if (targetType === 'city' && !targetCity) {
      setResult({ type: 'error', message: 'Please select a city.' }); return;
    }

    setSending(true);
    setResult(null);

    try {
      const res  = await fetch('/api/notifications/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title, body, targetType,
          targetUid:  targetType === 'specific' ? targetUid : null,
          targetCity: targetType === 'city'     ? targetCity : null,
          scheduleAt: scheduleAt || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send');

      const newNotif: Notification = {
        id:         data.id,
        title,
        body,
        targetType,
        targetUid:  targetType === 'specific' ? targetUid : null,
        targetCity: targetType === 'city'     ? targetCity : null,
        status:     scheduleAt ? 'scheduled' : 'sent',
        sentCount:  data.sentCount  || 0,
        failCount:  data.failCount  || 0,
        scheduleAt: scheduleAt || null,
        createdAt:  new Date().toISOString(),
      };

      setNotifications(ns => [newNotif, ...ns]);

      setResult({
        type: 'success',
        message: scheduleAt
          ? 'Notification scheduled successfully!'
          : `Sent to ${data.sentCount || 0} player${data.sentCount !== 1 ? 's' : ''}!`,
      });

      reset();
    } catch (e: any) {
      setResult({ type: 'error', message: e.message });
    } finally {
      setSending(false);
    }
  }

  async function deleteNotif(id: string) {
    if (!confirm('Delete this notification record?')) return;
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(ns => ns.filter(n => n.id !== id));
  }

  // stats
  const totalSent      = notifications.filter(n => n.status === 'sent').length;
  const totalScheduled = notifications.filter(n => n.status === 'scheduled').length;
  const totalReached   = notifications.reduce((s, n) => s + n.sentCount, 0);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px', fontSize: '13px',
    fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--text2)', marginBottom: '6px',
    letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
  };

  const statusStyle: Record<string, React.CSSProperties> = {
    sent:      { background: 'var(--success-bg)', color: 'var(--success)' },
    scheduled: { background: 'var(--warning-bg)', color: 'var(--warning)' },
    failed:    { background: 'var(--danger-bg)',  color: 'var(--danger)'  },
  };

  const targetLabel: Record<string, string> = {
    all:      `All players (${playerCount})`,
    specific: 'Specific user',
    city:     'By city',
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
          { label: 'Total players',  value: playerCount,    color: 'var(--accent)'  },
          { label: 'Sent total',     value: totalSent,      color: 'var(--success)' },
          { label: 'Scheduled',      value: totalScheduled, color: 'var(--warning)' },
          { label: 'Players reached',value: totalReached,   color: 'var(--purple)'  },
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
              fontSize: '26px', fontWeight: 700,
              color: s.color, lineHeight: 1,
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '16px',
        alignItems: 'start',
      }}>

        {/* ── Left: history ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            Notification history
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)',
              color: 'var(--text3)',
            }}>
              Last 50
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
              <div style={{
                fontSize: '14px', fontWeight: 600,
                color: 'var(--text)', marginBottom: '6px',
              }}>
                No notifications sent yet
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                Use the form to send your first notification
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(n => (
                <div key={n.id} className="card" style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: '12px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Title + status */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '8px', marginBottom: '4px',
                      }}>
                        <span style={{
                          fontSize: '13px', fontWeight: 600,
                          color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {n.title}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '10px',
                          fontFamily: 'var(--font-mono)', flexShrink: 0,
                          ...(statusStyle[n.status] || statusStyle.sent),
                        }}>
                          {n.status}
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{
                        fontSize: '12px', color: 'var(--text2)',
                        marginBottom: '10px', lineHeight: 1.5,
                      }}>
                        {n.body}
                      </div>

                      {/* Meta row */}
                      <div style={{
                        display: 'flex', gap: '16px',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontSize: '11px', color: 'var(--text3)',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString('en-GB', {
                                day: 'numeric', month: 'short',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </span>
                        <span style={{
                          fontSize: '11px', color: 'var(--text3)',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          {targetLabel[n.targetType] || n.targetType}
                        </span>
                        {n.status === 'sent' && (
                          <>
                            <span style={{
                              fontSize: '11px', color: 'var(--success)',
                              fontFamily: 'var(--font-mono)',
                            }}>
                              ✓ {n.sentCount} sent
                            </span>
                            {n.failCount > 0 && (
                              <span style={{
                                fontSize: '11px', color: 'var(--danger)',
                                fontFamily: 'var(--font-mono)',
                              }}>
                                ✗ {n.failCount} failed
                              </span>
                            )}
                          </>
                        )}
                        {n.scheduleAt && (
                          <span style={{
                            fontSize: '11px', color: 'var(--warning)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            Scheduled: {new Date(n.scheduleAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteNotif(n.id)}
                      title="Delete record"
                      style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--text3)',
                        padding: '4px', borderRadius: '6px',
                        display: 'flex', flexShrink: 0,
                        transition: 'color 0.15s',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 5h10M6 5V3h4v2M6 8v5M10 8v5M4 5l1 9h6l1-9"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
                          strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: compose form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Templates */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: 'var(--text)',
              marginBottom: '10px',
            }}>
              Quick templates
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  style={{
                    padding: '8px 12px', borderRadius: '8px',
                    border: '0.5px solid var(--border2)',
                    background: 'var(--surface2)',
                    color: 'var(--text2)', fontSize: '12px',
                    fontFamily: 'var(--font)', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
                  }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text)', marginBottom: '16px',
            }}>
              Compose notification
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '6px',
              }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>TITLE *</label>
                <span style={{
                  fontSize: '10px', color: titleLen > 60 ? 'var(--danger)' : 'var(--text3)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {titleLen}/65
                </span>
              </div>
              <input
                style={inputStyle}
                value={title}
                maxLength={65}
                onChange={e => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '6px',
              }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>MESSAGE *</label>
                <span style={{
                  fontSize: '10px', color: bodyLen > 180 ? 'var(--danger)' : 'var(--text3)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {bodyLen}/200
                </span>
              </div>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                value={body}
                maxLength={200}
                onChange={e => setBody(e.target.value)}
                placeholder="Notification message..."
              />
            </div>

            {/* Target */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>SEND TO</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {(['all', 'specific', 'city'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTargetType(t)}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: '7px',
                      fontSize: '11px', fontFamily: 'var(--font)',
                      cursor: 'pointer', fontWeight: targetType === t ? 600 : 400,
                      background: targetType === t ? 'var(--accent)' : 'var(--surface2)',
                      color:      targetType === t ? 'white' : 'var(--text2)',
                      border:     targetType === t
                        ? '0.5px solid var(--accent)'
                        : '0.5px solid var(--border2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'all' ? `All (${playerCount})` : t === 'specific' ? 'User' : 'City'}
                  </button>
                ))}
              </div>

              {targetType === 'specific' && (
                <input
                  style={inputStyle}
                  value={targetUid}
                  onChange={e => setTargetUid(e.target.value)}
                  placeholder="Paste user UID here"
                />
              )}

              {targetType === 'city' && (
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={targetCity}
                  onChange={e => setTargetCity(e.target.value)}
                >
                  <option value="">Select city...</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>SCHEDULE (OPTIONAL)</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={scheduleAt}
                onChange={e => setScheduleAt(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Leave empty to send immediately
              </div>
            </div>

            {/* Result */}
            {result && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
                fontSize: '13px',
                background: result.type === 'success'
                  ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `0.5px solid ${result.type === 'success'
                  ? 'var(--success)' : 'var(--danger)'}`,
                color: result.type === 'success'
                  ? 'var(--success)' : 'var(--danger)',
                fontWeight: 500,
              }}>
                {result.message}
              </div>
            )}

            {/* Preview */}
            {(title || body) && (
              <div style={{
                padding: '12px 14px', borderRadius: '10px', marginBottom: '12px',
                background: 'var(--surface2)',
                border: '0.5px solid var(--border2)',
              }}>
                <div style={{
                  fontSize: '10px', fontWeight: 600,
                  color: 'var(--text3)', letterSpacing: '0.7px',
                  fontFamily: 'var(--font-mono)', marginBottom: '8px',
                }}>
                  PREVIEW
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2L14 12H2L8 2Z" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '13px', fontWeight: 700, color: 'var(--text)',
                    }}>
                      {title || 'Title...'}
                    </div>
                    <div style={{
                      fontSize: '12px', color: 'var(--text2)', lineHeight: 1.4,
                    }}>
                      {body || 'Message...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={reset}
                className="btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Clear
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {sending ? 'Sending...'
                  : scheduleAt ? 'Schedule'
                  : `Send to ${
                      targetType === 'all'      ? `all ${playerCount}`
                    : targetType === 'city'     ? targetCity || 'city'
                    : 'user'
                  }`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}