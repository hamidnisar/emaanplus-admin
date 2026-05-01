import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    // get all players who have a referral code
    const snap = await adminDb
      .collection('players')
      .where('referralCode', '!=', null)
      .orderBy('referralCode')
      .orderBy('referralCount', 'desc')
      .get();

    const referrals = snap.docs.map(d => {
      const data = d.data();
      return {
        uid:           d.id,
        displayName:   data.displayName   || 'Unknown',
        email:         data.email         || '',
        photoURL:      data.photoURL      || null,
        city:          data.city          || '',
        country:       data.country       || '',
        referralCode:  data.referralCode  || '',
        referralCount: data.referralCount || 0,
        referralReward: data.referralReward || 0,
        totalScore:    data.totalScore    || 0,
        status:        data.status        || 'active',
        createdAt:     data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });

    return NextResponse.json({ referrals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — update global referral settings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await adminDb.collection('settings').doc('referral').set({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}