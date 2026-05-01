import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    const body = await req.json();

    // update Firestore
    await adminDb.collection('admins').doc(uid).update({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // if displayName changed — update Firebase Auth too
    if (body.displayName) {
      await adminAuth.updateUser(uid, { displayName: body.displayName });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  try {
    // delete from Firestore
    await adminDb.collection('admins').doc(uid).delete();

    // delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}