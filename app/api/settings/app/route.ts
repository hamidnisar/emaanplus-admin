import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const doc = await adminDb.collection('settings').doc('app').get();
    if (!doc.exists) {
      return NextResponse.json({
        settings: {
          appName:        'QuizApp',
          appDescription: 'Compete, learn and win!',
          maxPlayersPerQuiz: 500,
          defaultTimeLimit:  10,
          passingScore:      60,
          maintenanceMode:   false,
          allowRegistration: true,
        },
      });
    }
    return NextResponse.json({ settings: doc.data() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await adminDb.collection('settings').doc('app').set({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}