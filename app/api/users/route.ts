import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb
      .collection('players')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snap.docs.map(d => {
      const data = d.data();
      return {
        uid:           d.id,
        displayName:   data.displayName || 'Unknown',
        email:         data.email || '',
        totalScore:    data.totalScore || 0,
        quizzesPlayed: data.quizzesPlayed || 0,
        referralCode:  data.referralCode || null,
        referralCount: data.referralCount || 0,
        status:        data.status || 'active',
        createdAt:     data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });

    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}