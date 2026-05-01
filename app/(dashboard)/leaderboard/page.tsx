import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import LeaderboardTable from '@/components/LeaderboardTable';

async function getLeaderboard() {
  try {
    const snap = await adminDb
      .collection('players')
      .orderBy('totalScore', 'desc')
      .limit(100)
      .get();

    return snap.docs.map((d, i) => {
      const data = d.data();
      return {
        rank:          i + 1,
        uid:           d.id,
        displayName:   data.displayName   || 'Unknown',
        email:         data.email         || '',
        photoURL:      data.photoURL      || null,
        city:          data.city          || '',
        country:       data.country       || '',
        totalScore:    data.totalScore    || 0,
        quizzesPlayed: data.quizzesPlayed || 0,
        referralCount: data.referralCount || 0,
        status:        data.status        || 'active',
        createdAt:     data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });
  } catch {
    return [];
  }
}

async function getQuizLeaderboards() {
  try {
    const quizzesSnap = await adminDb
      .collection('quizzes')
      .where('status', '==', 'published')
      .get();

    return quizzesSnap.docs.map(d => ({
      id:    d.id,
      title: d.data().title || 'Untitled',
    }));
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const [players, quizzes] = await Promise.all([
    getLeaderboard(),
    getQuizLeaderboards(),
  ]);

  return (
    <>
      <Topbar
        title="Leaderboard"
        subtitle={`Top ${players.length} players ranked by total score`}
      />
      <div style={{ padding: '28px' }}>
        <LeaderboardTable players={players} quizzes={quizzes} />
      </div>
    </>
  );
}