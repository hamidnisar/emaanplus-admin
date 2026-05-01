import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import ReferralsClient from '@/components/ReferralsClient';

async function getReferrals() {
  try {
    const snap = await adminDb
      .collection('players')
      .where('referralCode', '!=', null)
      .orderBy('referralCode')
      .orderBy('referralCount', 'desc')
      .get();

    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid:            d.id,
        displayName:    data.displayName    || 'Unknown',
        email:          data.email          || '',
        photoURL:       data.photoURL       || null,
        city:           data.city           || '',
        country:        data.country        || '',
        referralCode:   data.referralCode   || '',
        referralCount:  data.referralCount  || 0,
        referralReward: data.referralReward || 0,
        totalScore:     data.totalScore     || 0,
        status:         data.status         || 'active',
        createdAt:      data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });
  } catch {
    return [];
  }
}

async function getReferralSettings() {
  try {
    const doc = await adminDb.collection('settings').doc('referral').get();
    if (!doc.exists) {
      return { rewardPoints: 50, maxPerUser: 10, enabled: true, welcomeBonus: 20 };
    }
    const data = doc.data()!;
    return {
      rewardPoints: data.rewardPoints || 50,
      maxPerUser:   data.maxPerUser   || 10,
      enabled:      data.enabled      ?? true,
      welcomeBonus: data.welcomeBonus || 20,
    };
  } catch {
    return { rewardPoints: 50, maxPerUser: 10, enabled: true, welcomeBonus: 20 };
  }
}

export default async function ReferralsPage() {
  const [referrals, settings] = await Promise.all([
    getReferrals(),
    getReferralSettings(),
  ]);

  return (
    <>
      <Topbar
        title="Referrals"
        subtitle={`${referrals.length} players with active referral codes`}
      />
      <div style={{ padding: '28px' }}>
        <ReferralsClient
          initialReferrals={referrals}
          initialSettings={settings}
        />
      </div>
    </>
  );
}