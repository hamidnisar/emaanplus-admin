import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue } from 'firebase-admin/firestore';

async function sendFCMV1(
  tokens: string[],
  title: string,
  body: string,
) {
  if (!tokens.length) return { successCount: 0, failureCount: 0 };

  const messaging = getMessaging();

  // send in batches of 500 (FCM limit)
  const batchSize  = 500;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);

    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    successCount += response.successCount;
    failureCount += response.failureCount;
  }

  return { successCount, failureCount };
}

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      body,
      targetType,
      targetUid,
      targetCity,
      scheduleAt,
    } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // save notification record
    const notifRef = await adminDb.collection('notifications').add({
      title,
      body,
      targetType:  targetType  || 'all',
      targetUid:   targetUid   || null,
      targetCity:  targetCity  || null,
      scheduleAt:  scheduleAt  || null,
      status:      scheduleAt  ? 'scheduled' : 'sent',
      sentCount:   0,
      failCount:   0,
      createdAt:   FieldValue.serverTimestamp(),
    });

    // if scheduled — just save and return
    if (scheduleAt) {
      return NextResponse.json({
        success: true,
        id:      notifRef.id,
        status:  'scheduled',
      });
    }

    // build query based on target
    let query: FirebaseFirestore.Query = adminDb
      .collection('players')
      .where('status', '==', 'active');

    if (targetType === 'specific' && targetUid) {
      query = adminDb
        .collection('players')
        .where('__name__', '==', targetUid)
        .where('status', '==', 'active');
    } else if (targetType === 'city' && targetCity) {
      query = adminDb
        .collection('players')
        .where('city', '==', targetCity)
        .where('status', '==', 'active');
    }

    const snap   = await query.get();
    const tokens = snap.docs
      .map(d => d.data().fcmToken as string)
      .filter(Boolean);

    // send via FCM V1
    const { successCount, failureCount } = await sendFCMV1(tokens, title, body);

    // update record
    await adminDb.collection('notifications').doc(notifRef.id).update({
      sentCount: successCount,
      failCount: failureCount,
      status:    'sent',
    });

    return NextResponse.json({
      success:       true,
      id:            notifRef.id,
      sentCount:     successCount,
      failCount:     failureCount,
      totalTargeted: tokens.length,
    });

  } catch (e: any) {
    console.error('Notification error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}