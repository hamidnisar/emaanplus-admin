import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // verify the Firebase token
    const decoded = await adminAuth.verifyIdToken(idToken);
    console.log('Token verified for:', decoded.email);

    // ── SECURITY CHECK ──────────────────────────────────────────────
    // check if this user exists in the admins collection
    const adminDoc = await adminDb
      .collection('admins')
      .doc(decoded.uid)
      .get();

    if (!adminDoc.exists) {
      console.warn('Login blocked — not in admins collection:', decoded.email);
      return NextResponse.json(
        { error: 'Access denied. You are not authorized to access this panel.' },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();
    const role      = adminData?.role;

    // only these roles are allowed
    const allowedRoles = ['super_admin', 'admin', 'editor'];
    if (!allowedRoles.includes(role)) {
      console.warn('Login blocked — invalid role:', decoded.email, role);
      return NextResponse.json(
        { error: 'Access denied. Your role does not have panel access.' },
        { status: 403 }
      );
    }
    // ───────────────────────────────────────────────────────────────

    // create session cookie
    const expiresIn    = 60 * 60 * 24 * 7 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({
      success: true,
      role,
      displayName: adminData?.displayName || '',
    });

    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   expiresIn / 1000,
      path:     '/',
    });

    return response;

  } catch (error: any) {
    console.error('Session error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');
  return response;
}