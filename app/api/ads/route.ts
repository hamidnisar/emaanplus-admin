import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function GET() {
  try {
    const doc = await adminDb.collection('settings').doc('ads').get();
    if (!doc.exists) return NextResponse.json({ ads: DEFAULT_ADS });
    const data = doc.data()!;
    return NextResponse.json({
      ads: {
        admob:    { ...DEFAULT_ADS.admob,    ...(data.admob    || {}) },
        facebook: { ...DEFAULT_ADS.facebook, ...(data.facebook || {}) },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await adminDb.collection('settings').doc('ads').set(
      { ...body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
