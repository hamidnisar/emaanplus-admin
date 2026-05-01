import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const snap = await adminDb
      .collection('blog_posts')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const posts = snap.docs.map(d => {
      const data = d.data();
      return {
        id:           d.id,
        userName:     data.userName     || '',
        caption:      data.caption      || '',
        mediaType:    data.mediaType    || 'image',
        mediaUrl:     data.mediaUrl     || '',
        thumbnailUrl: data.thumbnailUrl || null,
        status:       data.status       || 'draft',
        createdAt:    data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });

    return NextResponse.json({ posts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userName, caption, mediaType, mediaUrl, thumbnailUrl, status } = body;

    if (!userName?.trim()) return NextResponse.json({ error: 'User name required' }, { status: 400 });
    if (!mediaUrl?.trim()) return NextResponse.json({ error: 'Media URL required' }, { status: 400 });

    const ref = await adminDb.collection('blog_posts').add({
      userName:     userName.trim(),
      caption:      caption?.trim() || '',
      mediaType:    mediaType || 'image',
      mediaUrl,
      thumbnailUrl: thumbnailUrl || null,
      status:       status || 'published',
      createdAt:    FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
