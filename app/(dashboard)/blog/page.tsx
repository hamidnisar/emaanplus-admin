import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import BlogClient from '@/components/BlogClient';
import { BlogPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const snap = await adminDb
      .collection('blog_posts')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    return snap.docs.map(d => {
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
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <Topbar
        title="Blog"
        subtitle="Upload and manage user review photos and videos"
      />
      <div style={{ padding: '28px' }}>
        <BlogClient initialPosts={posts} />
      </div>
    </>
  );
}
