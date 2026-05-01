import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const snap = await adminDb.collection('admins').get();
    const admins = snap.docs.map(d => {
      const data = d.data();
      return {
        uid:         d.id,
        displayName: data.displayName || '',
        email:       data.email       || '',
        role:        data.role        || 'editor',
        createdAt:   data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });
    return NextResponse.json({ admins });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, displayName, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password and role are required' },
        { status: 400 }
      );
    }

    // create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    // save to admins collection
    await adminDb.collection('admins').doc(userRecord.uid).set({
      uid:         userRecord.uid,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt:   FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: userRecord.uid, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}