import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';

const getQuizzes = unstable_cache(
  async () => {
    try {
      const snap = await adminDb
        .collection('quizzes')
        .orderBy('createdAt', 'desc')
        .get();

    // serialize — strip all Timestamps
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id:               d.id,
        title:            data.title || '',
        category:         data.category || 'General',
        timeLimitMinutes: data.timeLimitMinutes || 10,
        questionCount:    data.questionCount || 0,
        totalPlayers:     data.totalPlayers || 0,
        status:           data.status || 'draft',
      };
    });
  } catch {
    return [];
  }
  },
  ['quizzes-list'],
  { revalidate: 30 },
);

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

  const statusColor: Record<string, string> = {
    published: 'pill-green',
    draft:     'pill-amber',
    archived:  'pill-gray',
  };

  return (
    <>
      <Topbar
        title="Quizzes"
        subtitle={`${quizzes.length} total quizzes`}
        action={
          <Link href="/quizzes/new" className="btn btn-primary">
            + Create quiz
          </Link>
        }
      />
      <div style={{ padding: '28px' }}>
        {quizzes.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>◈</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
              No quizzes yet
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>
              Create your first quiz to get started
            </div>
            <Link href="/quizzes/new" className="btn btn-primary"
              style={{ display: 'inline-flex' }}>
              + Create quiz
            </Link>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {['Title', 'Category', 'Questions', 'Time', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '10px', fontWeight: '600',
                      color: 'var(--text3)', letterSpacing: '0.7px',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--surface2)',
                    }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz, i) => (
                  <tr key={quiz.id} style={{
                    borderBottom: i < quizzes.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                      {quiz.title}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text2)' }}>
                      {quiz.category}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                      {quiz.questionCount} qs
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                      {quiz.timeLimitMinutes} min
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`pill ${statusColor[quiz.status] || 'pill-gray'}`}>
                        {quiz.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/quizzes/${quiz.id}`} className="btn"
                          style={{ padding: '5px 12px', fontSize: '12px' }}>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}