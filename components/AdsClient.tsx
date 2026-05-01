'use client';

import React, { useState } from 'react';

interface AdMobConfig {
  enabled:             boolean;
  appIdAndroid:        string;
  appIdIos:            string;
  bannerAndroid:       string;
  bannerIos:           string;
  interstitialAndroid: string;
  interstitialIos:     string;
  rewardedAndroid:     string;
  rewardedIos:         string;
}

interface FacebookConfig {
  enabled:             boolean;
  appId:               string;
  clientToken:         string;
  bannerAndroid:       string;
  bannerIos:           string;
  interstitialAndroid: string;
  interstitialIos:     string;
  rewardedAndroid:     string;
  rewardedIos:         string;
}

interface AdsConfig {
  admob:    AdMobConfig;
  facebook: FacebookConfig;
}

function CopyIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 11H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function CheckIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        background: value ? 'var(--success)' : 'var(--border2)',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '3px', left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
        background: 'var(--surface)', border: '0.5px solid var(--border2)',
        borderRadius: '5px', padding: '3px 6px',
        cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text3)',
        display: 'flex', alignItems: 'center', gap: '3px',
        fontSize: '10px', fontFamily: 'var(--font-mono)',
        transition: 'color 0.15s',
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Field({
  label, value, onChange, placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: 600,
        color: 'var(--text2)', marginBottom: '5px',
        letterSpacing: '0.4px', fontFamily: 'var(--font-mono)',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '8px 72px 8px 11px',
            background: 'var(--surface2)',
            border: `0.5px solid ${value ? 'var(--border2)' : 'var(--border)'}`,
            borderRadius: '7px', fontSize: '12px',
            fontFamily: 'var(--font-mono)', color: 'var(--text)', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <CopyButton text={value} />
      </div>
      {hint && (
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function PlatformSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      border: '0.5px solid var(--border)',
      borderRadius: '10px', overflow: 'hidden',
      marginBottom: '12px',
    }}>
      <div style={{
        padding: '9px 14px',
        background: 'var(--surface2)',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '7px',
        fontSize: '11px', fontWeight: 600, color: 'var(--text2)',
        fontFamily: 'var(--font-mono)', letterSpacing: '0.4px',
      }}>
        {icon}
        {title}
      </div>
      <div style={{ padding: '14px' }}>
        {children}
      </div>
    </div>
  );
}

function AndroidIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 18V10a6 6 0 0 1 12 0v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 22v-2M16 22v-2M2 13h1M21 13h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function AppleIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5c1-2 3-2.5 4-2.5-.1 1.5-1 3-2 3.5C13 6.5 12 5 12 5ZM7 8.5C8.5 7 10 7 12 7s3.5 1 5 1.5c1 3 .5 7-1 9.5-.7 1.2-1.6 2-2.5 2s-1.5-.5-2.5-.5-1.5.5-2.5.5-1.8-.8-2.5-2C4.5 15.5 4 11.5 7 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> }

export default function AdsClient({ initialAds }: { initialAds: AdsConfig }) {
  const [admob,    setAdmob]    = useState<AdMobConfig>(initialAds.admob);
  const [facebook, setFacebook] = useState<FacebookConfig>(initialAds.facebook);
  const [activeTab, setActiveTab] = useState<'admob' | 'facebook'>('admob');

  const [savingAdmob,    setSavingAdmob]    = useState(false);
  const [savingFacebook, setSavingFacebook] = useState(false);
  const [admobResult,    setAdmobResult]    = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [fbResult,       setFbResult]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function patchAdmob(patch: Partial<AdMobConfig>) {
    setAdmob(prev => ({ ...prev, ...patch }));
  }

  function patchFacebook(patch: Partial<FacebookConfig>) {
    setFacebook(prev => ({ ...prev, ...patch }));
  }

  async function saveAdmob() {
    setSavingAdmob(true);
    setAdmobResult(null);
    try {
      const res = await fetch('/api/ads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ admob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setAdmobResult({ type: 'success', msg: 'AdMob credentials saved successfully.' });
    } catch (e: any) {
      setAdmobResult({ type: 'error', msg: e.message });
    } finally {
      setSavingAdmob(false);
    }
  }

  async function saveFacebook() {
    setSavingFacebook(true);
    setFbResult(null);
    try {
      const res = await fetch('/api/ads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ facebook }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setFbResult({ type: 'success', msg: 'Facebook Ads credentials saved successfully.' });
    } catch (e: any) {
      setFbResult({ type: 'error', msg: e.message });
    } finally {
      setSavingFacebook(false);
    }
  }

  const admobFilled = [
    admob.appIdAndroid, admob.appIdIos,
    admob.bannerAndroid, admob.bannerIos,
  ].filter(Boolean).length;

  const fbFilled = [
    facebook.appId, facebook.clientToken,
    facebook.bannerAndroid, facebook.bannerIos,
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '12px' }}>
        {[
          {
            name:    'AdMob',
            enabled: admob.enabled,
            filled:  admobFilled,
            total:   4,
            color:   '#4285f4',
            bg:      'rgba(66,133,244,0.1)',
            logo: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#4285f4" opacity="0.15"/>
                <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4285f4">Ad</text>
              </svg>
            ),
          },
          {
            name:    'Facebook Ads',
            enabled: facebook.enabled,
            filled:  fbFilled,
            total:   4,
            color:   '#1877f2',
            bg:      'rgba(24,119,242,0.1)',
            logo: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#1877f2" opacity="0.15"/>
                <text x="12" y="16" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1877f2">f</text>
              </svg>
            ),
          },
        ].map(card => (
          <div key={card.name} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {card.logo}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{card.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {card.filled}/{card.total} key fields configured
                  </div>
                </div>
              </div>
              <div style={{
                padding: '4px 12px', borderRadius: '20px',
                background: card.enabled ? 'var(--success-bg)' : 'var(--surface2)',
                color:      card.enabled ? 'var(--success)' : 'var(--text3)',
                fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                border: `0.5px solid ${card.enabled ? 'var(--success)' : 'var(--border2)'}`,
              }}>
                {card.enabled ? 'Active' : 'Disabled'}
              </div>
            </div>
            {card.filled > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{
                  height: '4px', background: 'var(--surface2)',
                  borderRadius: '2px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    background: card.color,
                    width: `${(card.filled / card.total) * 100}%`,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['admob', 'facebook'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '9px', fontSize: '13px',
              fontFamily: 'var(--font)', cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? 'var(--accent)' : 'var(--surface2)',
              color:      activeTab === tab ? 'white' : 'var(--text2)',
              border:     activeTab === tab ? '0.5px solid var(--accent)' : '0.5px solid var(--border2)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'admob' ? 'AdMob' : 'Facebook Ads'}
          </button>
        ))}
      </div>

      {/* ── AdMob panel ── */}
      {activeTab === 'admob' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* Left: App IDs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Header card */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>AdMob</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Google AdMob · Mobile ads SDK</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    {admob.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle value={admob.enabled} onChange={v => patchAdmob({ enabled: v })} />
                </div>
              </div>
              <div style={{
                padding: '10px 12px', borderRadius: '8px',
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                fontSize: '11px', color: 'var(--text3)', lineHeight: 1.6,
              }}>
                App IDs are required in your <code style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>AndroidManifest.xml</code> and <code style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>Info.plist</code>.
                Format: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</code>
              </div>
            </div>

            {/* App IDs */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
                App IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="APP ID"
                  value={admob.appIdAndroid}
                  onChange={v => patchAdmob({ appIdAndroid: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="APP ID"
                  value={admob.appIdIos}
                  onChange={v => patchAdmob({ appIdIos: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                />
              </PlatformSection>
            </div>
          </div>

          {/* Right: Ad Unit IDs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Banner */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4285f4', display: 'inline-block' }} />
                Banner Ad Unit IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="BANNER UNIT ID"
                  value={admob.bannerAndroid}
                  onChange={v => patchAdmob({ bannerAndroid: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="BANNER UNIT ID"
                  value={admob.bannerIos}
                  onChange={v => patchAdmob({ bannerIos: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                />
              </PlatformSection>
            </div>

            {/* Interstitial */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34a853', display: 'inline-block' }} />
                Interstitial Ad Unit IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="INTERSTITIAL UNIT ID"
                  value={admob.interstitialAndroid}
                  onChange={v => patchAdmob({ interstitialAndroid: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="INTERSTITIAL UNIT ID"
                  value={admob.interstitialIos}
                  onChange={v => patchAdmob({ interstitialIos: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                />
              </PlatformSection>
            </div>

            {/* Rewarded */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbc04', display: 'inline-block' }} />
                Rewarded Ad Unit IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="REWARDED UNIT ID"
                  value={admob.rewardedAndroid}
                  onChange={v => patchAdmob({ rewardedAndroid: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="REWARDED UNIT ID"
                  value={admob.rewardedIos}
                  onChange={v => patchAdmob({ rewardedIos: v })}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                />
              </PlatformSection>
            </div>

            {/* Save */}
            {admobResult && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: admobResult.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `0.5px solid ${admobResult.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                color:  admobResult.type === 'success' ? 'var(--success)' : 'var(--danger)',
                fontSize: '13px', fontWeight: 500,
              }}>
                {admobResult.msg}
              </div>
            )}
            <button
              onClick={saveAdmob}
              disabled={savingAdmob}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {savingAdmob ? 'Saving…' : 'Save AdMob credentials'}
            </button>
          </div>
        </div>
      )}

      {/* ── Facebook Ads panel ── */}
      {activeTab === 'facebook' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* Left: App credentials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Header card */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Facebook Audience Network</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Meta · Audience Network SDK</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    {facebook.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle value={facebook.enabled} onChange={v => patchFacebook({ enabled: v })} />
                </div>
              </div>
              <div style={{
                padding: '10px 12px', borderRadius: '8px',
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                fontSize: '11px', color: 'var(--text3)', lineHeight: 1.6,
              }}>
                Find your App ID and Client Token in the <strong>Meta for Developers</strong> dashboard under Settings → Basic.
              </div>
            </div>

            {/* App credentials */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
                App Credentials
              </div>
              <Field
                label="APP ID"
                value={facebook.appId}
                onChange={v => patchFacebook({ appId: v })}
                placeholder="123456789012345"
                hint="Your numeric Facebook App ID"
              />
              <Field
                label="CLIENT TOKEN"
                value={facebook.clientToken}
                onChange={v => patchFacebook({ clientToken: v })}
                placeholder="abcdef1234567890abcdef1234567890"
                hint="Found in Settings → Advanced → Client Token"
              />
            </div>

            {/* Banner placements */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1877f2', display: 'inline-block' }} />
                Banner Placement IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="PLACEMENT ID"
                  value={facebook.bannerAndroid}
                  onChange={v => patchFacebook({ bannerAndroid: v })}
                  placeholder="123456789012345_123456789012345"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="PLACEMENT ID"
                  value={facebook.bannerIos}
                  onChange={v => patchFacebook({ bannerIos: v })}
                  placeholder="123456789012345_123456789012345"
                />
              </PlatformSection>
            </div>
          </div>

          {/* Right: Interstitial + Rewarded */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Interstitial */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#42a5f5', display: 'inline-block' }} />
                Interstitial Placement IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="PLACEMENT ID"
                  value={facebook.interstitialAndroid}
                  onChange={v => patchFacebook({ interstitialAndroid: v })}
                  placeholder="123456789012345_123456789012345"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="PLACEMENT ID"
                  value={facebook.interstitialIos}
                  onChange={v => patchFacebook({ interstitialIos: v })}
                  placeholder="123456789012345_123456789012345"
                />
              </PlatformSection>
            </div>

            {/* Rewarded */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#66bb6a', display: 'inline-block' }} />
                Rewarded Placement IDs
              </div>
              <PlatformSection title="ANDROID" icon={<AndroidIcon />}>
                <Field
                  label="PLACEMENT ID"
                  value={facebook.rewardedAndroid}
                  onChange={v => patchFacebook({ rewardedAndroid: v })}
                  placeholder="123456789012345_123456789012345"
                />
              </PlatformSection>
              <PlatformSection title="IOS" icon={<AppleIcon />}>
                <Field
                  label="PLACEMENT ID"
                  value={facebook.rewardedIos}
                  onChange={v => patchFacebook({ rewardedIos: v })}
                  placeholder="123456789012345_123456789012345"
                />
              </PlatformSection>
            </div>

            {/* Save */}
            {fbResult && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: fbResult.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `0.5px solid ${fbResult.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                color:  fbResult.type === 'success' ? 'var(--success)' : 'var(--danger)',
                fontSize: '13px', fontWeight: 500,
              }}>
                {fbResult.msg}
              </div>
            )}
            <button
              onClick={saveFacebook}
              disabled={savingFacebook}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {savingFacebook ? 'Saving…' : 'Save Facebook Ads credentials'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
