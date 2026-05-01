import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = snap.docs.map(d => {
      const data = d.data();
      return {
        id:          d.id,
        title:       data.title       || '',
        body:        data.body        || '',
        targetType:  data.targetType  || 'all',
        targetUid:   data.targetUid   || null,
        targetCity:  data.targetCity  || null,
        status:      data.status      || 'sent',
        sentCount:   data.sentCount   || 0,
        failCount:   data.failCount   || 0,
        scheduleAt:  data.scheduleAt  || null,
        createdAt:   data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });

    return NextResponse.json({ notifications });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}