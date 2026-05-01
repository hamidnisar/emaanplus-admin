import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const {
      quizId,
      title: directTitle,
      category: directCategory,
      count = 10,
      difficulty = 'Medium',
    } = await req.json();

    if (!quizId && !directTitle) {
      return NextResponse.json({ error: 'quizId or title is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set. Add it to your .env.local file.\nGet a free key at: console.groq.com' },
        { status: 500 },
      );
    }

    let quizTitle: string;
    let quizCategory: string;

    if (quizId) {
      const quizDoc = await adminDb.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      const quiz = quizDoc.data()!;
      quizTitle    = quiz.title;
      quizCategory = quiz.category;
    } else {
      quizTitle    = directTitle;
      quizCategory = directCategory || 'General';
    }

    const difficultyHint =
      difficulty === 'Easy'   ? 'Use simple, beginner-friendly questions with obvious answers.' :
      difficulty === 'Hard'   ? 'Use challenging questions that require expert or deep knowledge.' :
                                'Use moderately difficult questions that a knowledgeable person can answer.';

    const prompt = `Generate exactly ${count} multiple choice quiz questions about "${quizTitle}" (category: ${quizCategory}).
Difficulty: ${difficulty}. ${difficultyHint}

Respond with ONLY a valid JSON array — no markdown, no code fences, no explanation:
[
  {
    "text": "The question text goes here?",
    "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
    "correctIndex": 0,
    "timeLimitSeconds": 30,
    "points": 10
  }
]

Rules:
- Exactly 4 options per question
- correctIndex is 0–3 (0 = first option is correct)
- All facts must be accurate
- No duplicate questions
- Distribute the correct answer position — avoid always using index 0
- Points: Easy=5, Medium=10, Hard=15`;

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:       'llama-3.3-70b-versatile',
          messages:    [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens:  8192,
        }),
      },
    );

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq API error (${groqRes.status})`);
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '';

    // strip accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed  = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) throw new Error('AI returned unexpected format — expected a JSON array.');

    const questions = parsed
      .slice(0, count)
      .map((q: any) => ({
        text:             String(q.text || '').trim(),
        options:          Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
        correctIndex:     Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
        timeLimitSeconds: Number(q.timeLimitSeconds) || 30,
        points:           Number(q.points) || 10,
      }))
      .filter((q: any) => q.text && q.options.length === 4 && q.options.every((o: string) => o.trim()));

    if (questions.length === 0) throw new Error('AI generated 0 valid questions. Try again.');

    return NextResponse.json({ questions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
