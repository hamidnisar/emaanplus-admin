import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const doc = await adminDb.collection('settings').doc('referral').get();
    if (!doc.exists) {
      return NextResponse.json({
        settings: {
          rewardPoints:   50,
          maxPerUser:     10,
          enabled:        true,
          welcomeBonus:   20,
        },
      });
    }
    return NextResponse.json({ settings: doc.data() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}