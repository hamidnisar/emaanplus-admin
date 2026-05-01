import Topbar from '@/components/Topbar';
import QuizForm from '@/components/QuizForm';

export default function NewQuizPage() {
  return (
    <>
      <Topbar
        title="Create quiz"
        subtitle="Fill in the details then add your questions"
      />
      <div style={{ padding: '28px', maxWidth: '780px' }}>
        <QuizForm />
      </div>
    </>
  );
}