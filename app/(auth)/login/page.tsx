'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type View = 'login' | 'forgot' | 'forgot-sent';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView]         = useState<View>('login');

  // login state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // forgot password state
  const [resetEmail, setResetEmail]     = useState('');
  const [resetError, setResetError]     = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // ── Login ─────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res  = await fetch('/api/auth/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        // show the exact error from server (access denied etc.)
        setError(data.error || 'Login failed.');
        // sign out from Firebase client since session was rejected
        await auth.signOut();
        return;
      }

      router.push('/');
    } catch (err: any) {
      const code = err.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password — checks super_admin role first ───────────────

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setResetError('');

    try {
      // check role via API before sending reset email
      const checkRes = await fetch('/api/auth/check-role', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: resetEmail.trim() }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.isSuperAdmin) {
        setResetError(
          'Password reset is only available for super admins. Contact your super admin to reset your password.'
        );
        return;
      }

      // send reset email
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setView('forgot-sent');

    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        setResetError('No admin account found with this email.');
      } else if (code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setResetError('Too many requests. Please try again later.');
      } else {
        setResetError('Failed to send reset email. Try again.');
      }
    } finally {
      setResetLoading(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px', fontSize: '13px',
    fontFamily: 'var(--font)', color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--text2)', marginBottom: '6px',
    letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'var(--font)',
      position: 'relative',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{
        width: '100%', maxWidth: '380px',
        padding: '0 20px',
        position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(79,110,247,0.4)',
          }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 12H2L8 2Z" fill="white"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '22px', fontWeight: '700',
            color: 'var(--text)', letterSpacing: '-0.5px',
          }}>
            QuizAdmin
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>
            {view === 'login'
              ? 'Sign in to your admin account'
              : view === 'forgot'
              ? 'Reset your password'
              : 'Check your email'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
        }}>

          {/* ════ LOGIN VIEW ════ */}
          {view === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '6px',
  }}>
    <label style={{ ...labelStyle, marginBottom: 0 }}>
      PASSWORD
    </label>
    <button
      type="button"
      onClick={() => {
        setView('forgot');
        setResetEmail(email);
        setResetError('');
      }}
      style={{
        background: 'none', border: 'none',
        cursor: 'pointer', fontSize: '11px',
        color: 'var(--accent)', fontFamily: 'var(--font)',
        fontWeight: 500, padding: 0,
      }}
    >
      Forgot password?
    </button>
  </div>

  {/* Password input with eye toggle */}
  <div style={{ position: 'relative' }}>
    <input
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={e => setPassword(e.target.value)}
      required
      placeholder="••••••••"
      style={{ ...inputStyle, paddingRight: '40px' }}
      autoComplete="current-password"
    />
    <button
      type="button"
      onClick={() => setShowPassword(s => !s)}
      tabIndex={-1}
      style={{
        position: 'absolute', right: '10px',
        top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        cursor: 'pointer', padding: '4px',
        color: 'var(--text3)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        borderRadius: '4px', transition: 'color 0.15s',
      }}
      onMouseEnter={e =>
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
      }
      onMouseLeave={e =>
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'
      }
    >
      {showPassword ? (
        // Eye-off icon (hide)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 1l22 22"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ) : (
        // Eye icon (show)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3"
            stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      )}
    </button>
  </div>
</div>

              {error && (
                <div style={{
                  padding: '10px 14px', marginTop: '10px',
                  background: 'var(--danger-bg)',
                  border: '0.5px solid var(--danger)',
                  borderRadius: '8px',
                  fontSize: '12px', color: 'var(--danger)',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%', justifyContent: 'center',
                  padding: '11px', marginTop: '16px',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          )}

          {/* ════ FORGOT PASSWORD VIEW ════ */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div style={{
                padding: '12px 14px', borderRadius: '8px',
                background: 'var(--warning-bg)',
                border: '0.5px solid var(--warning)',
                fontSize: '12px', color: 'var(--warning)',
                marginBottom: '18px', lineHeight: 1.6,
              }}>
                ⚠ Password reset via email is only available for
                <strong> super admins</strong>. If you are an admin or
                editor, ask your super admin to reset your password
                from the Settings page.
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>SUPER ADMIN EMAIL</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  placeholder="superadmin@example.com"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {resetError && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--danger-bg)',
                  border: '0.5px solid var(--danger)',
                  borderRadius: '8px',
                  fontSize: '12px', color: 'var(--danger)',
                  marginBottom: '12px', lineHeight: 1.5,
                }}>
                  {resetError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setView('login'); setResetError(''); }}
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', opacity: resetLoading ? 0.7 : 1 }}
                >
                  {resetLoading ? 'Checking...' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}

          {/* ════ EMAIL SENT VIEW ════ */}
          {view === 'forgot-sent' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'var(--success-bg)',
                border: '2px solid var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"
                    stroke="var(--success)" strokeWidth="1.5"/>
                  <path d="M2 6l10 7 10-7"
                    stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{
                fontSize: '14px', fontWeight: 700,
                color: 'var(--text)', marginBottom: '8px',
              }}>
                Reset link sent!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '6px' }}>
                We sent a password reset link to
              </div>
              <div style={{
                fontSize: '13px', fontWeight: 600,
                color: 'var(--accent)', marginBottom: '20px',
                fontFamily: 'var(--font-mono)',
              }}>
                {resetEmail}
              </div>
              <div style={{
                fontSize: '12px', color: 'var(--text3)',
                marginBottom: '20px', lineHeight: 1.5,
              }}>
                Check your inbox and click the link to reset your password. The link expires in 1 hour.
              </div>
              <button
                onClick={() => {
                  setView('login');
                  setResetEmail('');
                  setResetError('');
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Back to sign in →
              </button>
            </div>
          )}
        </div>

        <p style={{
          textAlign: 'center', fontSize: '11px',
          color: 'var(--text3)', marginTop: '20px',
        }}>
          QuizAdmin · Secure admin access only
        </p>
      </div>
    </div>
  );
}