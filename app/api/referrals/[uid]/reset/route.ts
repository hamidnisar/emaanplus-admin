import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// reset a user's referral code and count
export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    const doc  = await adminDb.collection('players').doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const name   = doc.data()?.displayName || 'USER';
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
    const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    const code   = `${prefix}-${suffix}`;

    await adminDb.collection('players').doc(uid).update({
      referralCode:   code,
      referralCount:  0,
      referralReward: 0,
      updatedAt:      FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ code, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}