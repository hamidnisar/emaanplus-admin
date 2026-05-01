// app/api/questions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    await adminDb.collection('questions').doc(id).update({
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
    const snap = await adminDb.collection('questions').doc(id).get();
    const quizId = snap.data()?.quizId;
    await adminDb.collection('questions').doc(id).delete();
    if (quizId) {
      await adminDb.collection('quizzes').doc(quizId).update({
        questionCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}