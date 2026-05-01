import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import AdsClient from '@/components/AdsClient';

export const dynamic = 'force-dynamic';

const DEFAULT_ADS = {
  admob: {
    enabled:             false,
    appIdAndroid:        '',
    appIdIos:            '',
    bannerAndroid:       '',
    bannerIos:           '',
    interstitialAndroid: '',
    interstitialIos:     '',
    rewardedAndroid:     '',
    rewardedIos:         '',
  },
  facebook: {
    enabled:             false,
    appId:               '',
    clientToken:         '',
    bannerAndroid:       '',
    bannerIos:           '',
    interstitialAndroid: '',
    interstitialIos:     '',
    rewardedAndroid:     '',
    rewardedIos:         '',
  },
};

async function getAdsConfig() {
  try {
    const doc = await adminDb.collection('settings').doc('ads').get();
    if (!doc.exists) {
      console.log('[AdsPage] settings/ads doc NOT found in Firestore');
      return DEFAULT_ADS;
    }
    const data = doc.data()!;
    console.log('[AdsPage] loaded OK — admob.enabled:', data.admob?.enabled, '| fb.enabled:', data.facebook?.enabled);
    return {
      admob:    { ...DEFAULT_ADS.admob,    ...(data.admob    || {}) },
      facebook: { ...DEFAULT_ADS.facebook, ...(data.facebook || {}) },
    };
  } catch (e: any) {
    console.error('[AdsPage] Firestore read failed:', e.message);
    return DEFAULT_ADS;
  }
}

export default async function AdsPage() {
  const ads = await getAdsConfig();
  return (
    <>
      <Topbar
        title="Ads Management"
        subtitle="Configure AdMob and Facebook Audience Network credentials"
      />
      <div style={{ padding: '28px' }}>
        <AdsClient initialAds={ads} />
      </div>
    </>
  );
}
