import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quizId, text, options, correctIndex, timeLimitSeconds, points } = body;

    if (!quizId || !text || !options || correctIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // add question
    const questionRef = await adminDb.collection('questions').add({
      quizId,
      text,
      options,
      correctIndex:     Number(correctIndex),
      timeLimitSeconds: Number(timeLimitSeconds) || 30,
      points:           Number(points) || 10,
      createdAt:        FieldValue.serverTimestamp(),
    });

    // increment questionCount on quiz
    await adminDb.collection('quizzes').doc(quizId).update({
      questionCount: FieldValue.increment(1),
      updatedAt:     FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: questionRef.id, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const quizId = req.nextUrl.searchParams.get('quizId');
    if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 });

    const snap = await adminDb.collection('questions')
      .where('quizId', '==', quizId)
      .orderBy('createdAt', 'asc')
      .get();

    const questions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ questions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}