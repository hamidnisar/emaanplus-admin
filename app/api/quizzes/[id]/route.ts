// app/api/quizzes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  const { id } = await params;                       // ← await
  try {
    const body = await req.json();
    await adminDb.collection('quizzes').doc(id).update({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await adminDb.collection('quizzes').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}