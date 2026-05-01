import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // get Firebase Auth user by email
    const userRecord = await adminAuth.getUserByEmail(email.trim());

    // check admins collection
    const adminDoc = await adminDb
      .collection('admins')
      .doc(userRecord.uid)
      .get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { isSuperAdmin: false, error: 'Not an admin account.' },
        { status: 403 }
      );
    }

    const role = adminDoc.data()?.role;

    return NextResponse.json({
      isSuperAdmin: role === 'super_admin',
      role,
    });

  } catch (e: any) {
    // user not found in Firebase Auth
    if (e.code === 'auth/user-not-found') {
      return NextResponse.json(
        { isSuperAdmin: false, error: 'No account found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}