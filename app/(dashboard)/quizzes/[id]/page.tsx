import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import QuizEditForm from '@/components/QuizEditForm';
import { notFound } from 'next/navigation';

function serializeQuiz(data: any) {
  return {
    id:               data.id,
    title:            data.title || '',
    category:         data.category || 'General',
    description:      data.description || '',
    timeLimitMinutes: data.timeLimitMinutes || 10,
    passingScore:     data.passingScore || 60,
    status:           data.status || 'draft',
    questionCount:    data.questionCount || 0,
    totalPlayers:     data.totalPlayers || 0,
  };
}

function serializeQuestions(docs: any[]) {
  return docs.map(d => ({
    id:               d.id,
    quizId:           d.quizId || '',
    text:             d.text || '',
    options:          d.options || ['', '', '', ''],
    correctIndex:     d.correctIndex ?? 0,
    timeLimitSeconds: d.timeLimitSeconds || 30,
    points:           d.points || 10,
  }));
}

async function getQuiz(id: string) {
  try {
    const doc = await adminDb.collection('quizzes').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (e: any) {
    console.error('[QuizEditPage] getQuiz failed:', e.message);
    throw e;
  }
}

async function getQuestions(quizId: string) {
  try {
    // try with orderBy first (requires composite index in Firestore)
    const snap = await adminDb
      .collection('questions')
      .where('quizId', '==', quizId)
      .orderBy('createdAt', 'asc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    // fallback: no orderBy — works without a composite index
    try {
      const snap = await adminDb
        .collection('questions')
        .where('quizId', '==', quizId)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  }
}

export default async function QuizEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quiz, questions] = await Promise.all([
    getQuiz(id),
    getQuestions(id),
  ]);
  if (!quiz) notFound();

  // serialize before passing to client component
  const safeQuiz      = serializeQuiz(quiz);
  const safeQuestions = serializeQuestions(questions);

  return (
    <>
      <Topbar title="Edit quiz" subtitle={safeQuiz.title} />
      <div style={{ padding: '28px', maxWidth: '780px' }}>
        <QuizEditForm quiz={safeQuiz} questions={safeQuestions} />
      </div>
    </>
  );
}