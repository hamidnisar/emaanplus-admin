import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, description, timeLimitMinutes, passingScore, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const doc = await adminDb.collection('quizzes').add({
      title,
      category:          category || 'General',
      description:       description || '',
      timeLimitMinutes:  Number(timeLimitMinutes) || 10,
      passingScore:      Number(passingScore) || 60,
      status:            status || 'draft',
      questionCount:     0,
      totalPlayers:      0,
      createdAt:         FieldValue.serverTimestamp(),
      updatedAt:         FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: doc.id, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}