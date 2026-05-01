'use client';

import React, { useState } from 'react';

interface Admin {
  uid:         string;
  displayName: string;
  email:       string;
  role:        string;
  createdAt:   string;
}

interface AppSettings {
  appName:           string;
  appDescription:    string;
  maxPlayersPerQuiz: number;
  defaultTimeLimit:  number;
  passingScore:      number;
  maintenanceMode:   boolean;
  allowRegistration: boolean;
}

const ROLES = [
  {
    value:       'super_admin',
    label:       'Super Admin',
    description: 'Full access — manage admins, all settings, all content',
    color:       'var(--accent)',
    bg:          'var(--accent-bg)',
  },
  {
    value:       'admin',
    label:       'Admin',
    description: 'Manage quizzes, questions, users and leaderboard',
    color:       'var(--success)',
    bg:          'var(--success-bg)',
  },
  {
    value:       'editor',
    label:       'Editor',
    description: 'Create and edit quizzes and questions only',
    color:       'var(--warning)',
    bg:          'var(--warning-bg)',
  },
];

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find(r => r.value === role) || ROLES[2];
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600,
      padding: '3px 10px', borderRadius: '20px',
      fontFamily: 'var(--font-mono)',
      background: r.bg, color: r.color,
    }}>
      {r.label}
    </span>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        border: 'none', cursor: 'pointer',
        background: value ? 'var(--success)' : 'var(--border2)',
        position: 'relative', transition: 'background 0.2s',
        padding: 0, flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '23px' : '3px',
        width: '18px', height: '18px',
        borderRadius: '50%', background: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export default function SettingsClient({
  initialAdmins,
  initialSettings,
  currentRole,
}: {
  initialAdmins:    Admin[];
  initialSettings:  AppSettings;
  currentRole:      string;
}) {
  const isSuperAdmin = currentRole === 'super_admin';

  // admins state
  const [admins, setAdmins]   = useState<Admin[]>(initialAdmins);
  const [loading, setLoading] = useState<string | null>(null);

  // new admin form
  const [showForm, setShowForm]         = useState(false);
  const [newEmail, setNewEmail]         = useState('');
  const [newName, setNewName]           = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [newRole, setNewRole]           = useState('editor');
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // app settings state
  const [settings, setSettings]           = useState<AppSettings>(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved]   = useState(false);

  // active tab
  const [tab, setTab] = useState<'admins' | 'app' | 'roles'>('admins');


  // password change state
const [passwordUid, setPasswordUid]     = useState<string | null>(null);
const [newPass, setNewPass]             = useState('');
const [changingPass, setChangingPass]   = useState(false);
const [passError, setPassError]         = useState('');
const [passSuccess, setPassSuccess]     = useState('');

  // ── Admin actions ─────────────────────────────────────────────────

  async function createAdmin() {
    if (!newEmail || !newPassword) {
      setCreateError('Email and password are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res  = await fetch('/api/admins', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:       newEmail,
          displayName: newName,
          password:    newPassword,
          role:        newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newAdmin: Admin = {
        uid:         data.uid,
        displayName: newName || newEmail.split('@')[0],
        email:       newEmail,
        role:        newRole,
        createdAt:   new Date().toISOString(),
      };
      setAdmins(a => [...a, newAdmin]);
      setCreateSuccess(`${newAdmin.displayName} added successfully!`);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('editor');
      setTimeout(() => {
        setCreateSuccess('');
        setShowForm(false);
      }, 2000);
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create admin.');
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(uid: string, role: string) {
    setLoading(uid);
    try {
      await fetch(`/api/admins/${uid}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role }),
      });
      setAdmins(as => as.map(a => a.uid === uid ? { ...a, role } : a));
    } finally {
      setLoading(null);
    }
  }

  async function deleteAdmin(uid: string, name: string) {
    if (!confirm(`Remove ${name} from admins? They will lose access immediately.`)) return;
    setLoading(uid);
    try {
      await fetch(`/api/admins/${uid}`, { method: 'DELETE' });
      setAdmins(as => as.filter(a => a.uid !== uid));
    } finally {
      setLoading(null);
    }
  }

  async function changePassword(uid: string) {
  if (!newPass || newPass.length < 6) {
    setPassError('Password must be at least 6 characters.');
    return;
  }
  setChangingPass(true);
  setPassError('');
  setPassSuccess('');
  try {
    const res = await fetch(`/api/admins/${uid}/password`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: newPass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPassSuccess('Password updated successfully!');
    setNewPass('');
    setTimeout(() => {
      setPassSuccess('');
      setPasswordUid(null);
    }, 2000);
  } catch (e: any) {
    setPassError(e.message || 'Failed to update password.');
  } finally {
    setChangingPass(false);
  }
}

  // ── App settings ─────────────────────────────────────────────────

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch('/api/settings/app', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
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

  const tabs = [
    { key: 'admins', label: 'Admin accounts' },
    { key: 'app',    label: 'App settings'   },
    { key: 'roles',  label: 'Role permissions'},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: '10px',
        padding: '4px',
        width: 'fit-content',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: '7px 16px', borderRadius: '7px',
              fontSize: '13px', fontFamily: 'var(--font)',
              cursor: 'pointer', fontWeight: tab === t.key ? 600 : 400,
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color:      tab === t.key ? 'white' : 'var(--text2)',
              border:     'none', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          TAB 1 — Admin accounts
      ════════════════════════════════════════ */}
      {tab === 'admins' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', alignItems: 'start' }}>

          {/* Admin list */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Admin accounts
                <span style={{
                  marginLeft: '8px', fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)', background: 'var(--accent-bg)',
                  padding: '1px 7px', borderRadius: '10px',
                }}>
                  {admins.length}
                </span>
              </span>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowForm(f => !f)}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  {showForm ? 'Cancel' : '+ Add admin'}
                </button>
              )}
            </div>

            {/* Create form */}
            {showForm && isSuperAdmin && (
              <div style={{
                padding: '20px',
                borderBottom: '0.5px solid var(--border)',
                background: 'var(--surface2)',
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: 600,
                  color: 'var(--text)', marginBottom: '14px',
                }}>
                  New admin account
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '12px', marginBottom: '12px',
                }}>
                  <div>
                    <label style={labelStyle}>FULL NAME</label>
                    <input
                      style={inputStyle} value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL *</label>
                    <input
                      type="email" style={inputStyle}
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>PASSWORD *</label>
                    <input
                      type="password" style={inputStyle}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>ROLE *</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                {createError && (
                  <div style={{
                    padding: '9px 14px', borderRadius: '7px',
                    background: 'var(--danger-bg)',
                    border: '0.5px solid var(--danger)',
                    color: 'var(--danger)', fontSize: '12px',
                    marginBottom: '12px',
                  }}>
                    {createError}
                  </div>
                )}
                {createSuccess && (
                  <div style={{
                    padding: '9px 14px', borderRadius: '7px',
                    background: 'var(--success-bg)',
                    border: '0.5px solid var(--success)',
                    color: 'var(--success)', fontSize: '12px',
                    fontWeight: 600, marginBottom: '12px',
                  }}>
                    {createSuccess}
                  </div>
                )}

                <button
                  onClick={createAdmin}
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {creating ? 'Creating...' : 'Create admin account'}
                </button>
              </div>
            )}

            {/* Admin rows */}
          {admins.length === 0 ? (
  <div style={{
    padding: '40px', textAlign: 'center',
    color: 'var(--text3)', fontSize: '13px',
  }}>
    No admins found
  </div>
) : (
  admins.map((admin, i) => {
    const isLoading     = loading === admin.uid;
    const showPassForm  = passwordUid === admin.uid;

    return (
      <React.Fragment key={admin.uid}>
        {/* ── Main admin row ── */}
        <div style={{
          padding: '14px 20px',
          borderBottom: showPassForm
            ? 'none'
            : i < admins.length - 1
            ? '0.5px solid var(--border)'
            : 'none',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'var(--accent-bg)', color: 'var(--accent)',
            fontSize: '13px', fontWeight: 700, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--accent)',
          }}>
            {(admin.displayName || admin.email).slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {admin.displayName || 'No name'}
            </div>
            <div style={{
              fontSize: '11px', color: 'var(--text3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {admin.email}
            </div>
          </div>

          {/* Role badge */}
          <RoleBadge role={admin.role} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>

            
         {/* Change password — super admin only */}
{isSuperAdmin && (
  <button
    onClick={() => {
      setPasswordUid(showPassForm ? null : admin.uid);
      setNewPass('');
      setPassError('');
      setPassSuccess('');
    }}
    title="Change password"
    style={{
      width: '30px', height: '30px', borderRadius: '7px',
      background: showPassForm ? 'var(--accent-bg)' : 'var(--surface2)',
      border: `0.5px solid ${showPassForm ? 'var(--accent)' : 'var(--border2)'}`,
      color: showPassForm ? 'var(--accent)' : 'var(--text3)',
      cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, transition: 'all 0.15s',
    }}
  >
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="8" rx="2"
        stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 7V5a3 3 0 0 1 6 0v2"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="1.2" fill="currentColor"/>
    </svg>
  </button>
)}

            {/* Role dropdown — super admin only */}
            {isSuperAdmin && (
              <select
                value={admin.role}
                disabled={isLoading}
                onChange={e => changeRole(admin.uid, e.target.value)}
                style={{
                  padding: '5px 8px', borderRadius: '7px',
                  border: '0.5px solid var(--border2)',
                  background: 'var(--surface2)',
                  color: 'var(--text)', fontSize: '12px',
                  fontFamily: 'var(--font)', cursor: 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            )}

            {/* Delete — super admin only */}
            {isSuperAdmin && (
              <button
                onClick={() => deleteAdmin(
                  admin.uid,
                  admin.displayName || admin.email
                )}
                disabled={isLoading}
                title="Remove admin"
                style={{
                  width: '30px', height: '30px', borderRadius: '7px',
                  background: 'var(--danger-bg)',
                  border: '0.5px solid var(--danger)',
                  color: 'var(--danger)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isLoading ? 0.5 : 1, flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M6 5V3h4v2M6 8v5M10 8v5M4 5l1 9h6l1-9"
                    stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Password change inline form ── */}
        {showPassForm && (
          <div style={{
            padding: '14px 20px 16px 72px',
            borderBottom: i < admins.length - 1
              ? '0.5px solid var(--border)' : 'none',
            background: 'var(--surface2)',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: 600,
              color: 'var(--text3)', letterSpacing: '0.5px',
              fontFamily: 'var(--font-mono)', marginBottom: '10px',
            }}>
              CHANGE PASSWORD — {admin.displayName || admin.email}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPass}
                  onChange={e => {
                    setNewPass(e.target.value);
                    setPassError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') changePassword(admin.uid);
                  }}
                  style={{
                    width: '100%', padding: '8px 12px',
                    background: 'var(--surface)',
                    border: `0.5px solid ${passError ? 'var(--danger)' : 'var(--border2)'}`,
                    borderRadius: '8px', fontSize: '13px',
                    fontFamily: 'var(--font)', color: 'var(--text)',
                    outline: 'none',
                  }}
                />
                {passError && (
                  <div style={{
                    fontSize: '11px', color: 'var(--danger)',
                    marginTop: '4px',
                  }}>
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div style={{
                    fontSize: '11px', color: 'var(--success)',
                    fontWeight: 600, marginTop: '4px',
                  }}>
                    {passSuccess}
                  </div>
                )}
              </div>

              <button
                onClick={() => changePassword(admin.uid)}
                disabled={changingPass}
                className="btn btn-primary"
                style={{
                  padding: '8px 16px', fontSize: '12px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {changingPass ? 'Updating...' : 'Update password'}
              </button>

              <button
                onClick={() => {
                  setPasswordUid(null);
                  setNewPass('');
                  setPassError('');
                  setPassSuccess('');
                }}
                className="btn"
                style={{
                  padding: '8px 12px', fontSize: '12px', flexShrink: 0,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  })
)}
          </div>

          {/* Right info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Role summary cards */}
            {ROLES.map(role => (
              <div key={role.value} style={{
                padding: '14px 16px',
                background: 'var(--surface)',
                border: `0.5px solid ${role.color}30`,
                borderRadius: '10px',
                borderLeft: `3px solid ${role.color}`,
              }}>
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  color: role.color, marginBottom: '4px',
                }}>
                  {role.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                  {role.description}
                </div>
                <div style={{
                  marginTop: '6px', fontSize: '11px',
                  color: 'var(--text3)', fontFamily: 'var(--font-mono)',
                }}>
                  {admins.filter(a => a.role === role.value).length} account
                  {admins.filter(a => a.role === role.value).length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}

            {!isSuperAdmin && (
              <div style={{
                padding: '14px 16px',
                background: 'var(--warning-bg)',
                border: '0.5px solid var(--warning)',
                borderRadius: '10px', fontSize: '12px',
                color: 'var(--warning)', lineHeight: 1.5,
              }}>
                Only super admins can create or modify admin accounts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 2 — App settings
      ════════════════════════════════════════ */}
      {tab === 'app' && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '16px', alignItems: 'start',
        }}>

          {/* General */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text)', marginBottom: '18px',
            }}>
              General
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>APP NAME</label>
              <input
                style={inputStyle} value={settings.appName}
                onChange={e => setSettings(s => ({ ...s, appName: e.target.value }))}
                placeholder="QuizApp"
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>APP DESCRIPTION</label>
              <textarea
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                value={settings.appDescription}
                onChange={e => setSettings(s => ({ ...s, appDescription: e.target.value }))}
                placeholder="Shown to players on the welcome screen"
              />
            </div>

            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: '0.5px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                  Maintenance mode
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  Block all players from accessing the app
                </div>
              </div>
              <Toggle
                value={settings.maintenanceMode}
                onChange={v => setSettings(s => ({ ...s, maintenanceMode: v }))}
              />
            </div>

            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: '0.5px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                  Allow registration
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  Let new players sign up in the mobile app
                </div>
              </div>
              <Toggle
                value={settings.allowRegistration}
                onChange={v => setSettings(s => ({ ...s, allowRegistration: v }))}
              />
            </div>
          </div>

          {/* Quiz defaults */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text)', marginBottom: '18px',
            }}>
              Quiz defaults
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>MAX PLAYERS PER QUIZ</label>
              <input
                type="number" min={1} max={10000}
                style={inputStyle} value={settings.maxPlayersPerQuiz}
                onChange={e => setSettings(s => ({
                  ...s, maxPlayersPerQuiz: Number(e.target.value),
                }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Maximum concurrent players per quiz session
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>DEFAULT TIME LIMIT (MINUTES)</label>
              <input
                type="number" min={1} max={120}
                style={inputStyle} value={settings.defaultTimeLimit}
                onChange={e => setSettings(s => ({
                  ...s, defaultTimeLimit: Number(e.target.value),
                }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Applied to new quizzes unless overridden
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>DEFAULT PASSING SCORE (%)</label>
              <input
                type="number" min={1} max={100}
                style={inputStyle} value={settings.passingScore}
                onChange={e => setSettings(s => ({
                  ...s, passingScore: Number(e.target.value),
                }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Minimum score % to mark a quiz as passed
              </div>
            </div>

            {/* Preview card */}
            <div style={{
              padding: '14px',
              background: 'var(--surface2)',
              border: '0.5px solid var(--border)',
              borderRadius: '9px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
                letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
                marginBottom: '10px',
              }}>
                MOBILE APP PREVIEW
              </div>
              <div style={{
                fontSize: '16px', fontWeight: 700, color: 'var(--text)',
                marginBottom: '3px',
              }}>
                {settings.appName || 'QuizApp'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                {settings.appDescription || 'No description'}
              </div>
              <div style={{
                marginTop: '10px', display: 'flex', gap: '12px',
              }}>
                {[
                  { label: 'Max players', value: settings.maxPlayersPerQuiz },
                  { label: 'Default time', value: `${settings.defaultTimeLimit}m` },
                  { label: 'Pass score',  value: `${settings.passingScore}%` },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{
                      fontSize: '10px', color: 'var(--text3)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '13px', fontWeight: 700,
                      color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                    }}>
                      {item.value}
                    </div>
                  </div>
                ))}
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
                : 'Save all settings'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3 — Role permissions matrix
      ════════════════════════════════════════ */}
      {tab === 'roles' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '0.5px solid var(--border)',
            fontSize: '13px', fontWeight: 600, color: 'var(--text)',
          }}>
            Role permissions matrix
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: 'var(--surface2)',
                borderBottom: '0.5px solid var(--border)',
              }}>
                <th style={{
                  padding: '11px 20px', textAlign: 'left',
                  fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
                  letterSpacing: '0.7px', fontFamily: 'var(--font-mono)',
                }}>
                  PERMISSION
                </th>
                {ROLES.map(r => (
                  <th key={r.value} style={{
                    padding: '11px 20px', textAlign: 'center',
                    fontSize: '10px', fontWeight: 600,
                    color: r.color, letterSpacing: '0.7px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {r.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { permission: 'View dashboard',          super_admin: true,  admin: true,  editor: true  },
                { permission: 'Create & edit quizzes',   super_admin: true,  admin: true,  editor: true  },
                { permission: 'Delete quizzes',          super_admin: true,  admin: true,  editor: false },
                { permission: 'Manage questions',        super_admin: true,  admin: true,  editor: true  },
                { permission: 'View users',              super_admin: true,  admin: true,  editor: false },
                { permission: 'Ban / unban users',       super_admin: true,  admin: true,  editor: false },
                { permission: 'Delete users',            super_admin: true,  admin: false, editor: false },
                { permission: 'View leaderboard',        super_admin: true,  admin: true,  editor: true  },
                { permission: 'Manage referrals',        super_admin: true,  admin: true,  editor: false },
                { permission: 'Send notifications',      super_admin: true,  admin: true,  editor: false },
                { permission: 'View settings',           super_admin: true,  admin: true,  editor: false },
                { permission: 'Edit app settings',       super_admin: true,  admin: false, editor: false },
                { permission: 'Create admin accounts',   super_admin: true,  admin: false, editor: false },
                { permission: 'Delete admin accounts',   super_admin: true,  admin: false, editor: false },
                { permission: 'Change admin roles',      super_admin: true,  admin: false, editor: false },
              ].map((row, i) => (
                <tr
                  key={row.permission}
                  style={{
                    borderBottom: '0.5px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--surface2)',
                  }}
                >
                  <td style={{
                    padding: '12px 20px', fontSize: '13px',
                    color: 'var(--text)', fontWeight: 500,
                  }}>
                    {row.permission}
                  </td>
                  {(['super_admin', 'admin', 'editor'] as const).map(role => (
                    <td key={role} style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {row[role] ? (
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: 'var(--success-bg)',
                          border: '1.5px solid var(--success)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', margin: '0 auto',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-6" stroke="var(--success)"
                              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: 'var(--danger-bg)',
                          border: '1.5px solid var(--danger)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', margin: '0 auto',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M3 3l6 6M9 3l-6 6" stroke="var(--danger)"
                              strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}