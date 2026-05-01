import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    // verify the requester is super_admin
    const cookieStore = await cookies();
    const session     = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded     = await adminAuth.verifySessionCookie(session);
    const requesterDoc = await adminDb
      .collection('admins')
      .doc(decoded.uid)
      .get();

    if (requesterDoc.data()?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can change passwords.' },
        { status: 403 }
      );
    }

    // validate new password
    const { password } = await req.json();
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    await adminAuth.updateUser(uid, { password });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}