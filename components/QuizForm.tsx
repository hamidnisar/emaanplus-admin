'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'General', 'Quran', 'Hadith', 'Fiqh',
  'Ramadan', 'Zakat', 'Seerah', 'Islamic History',
  'Aqeedah', 'Salah',
];

interface Question {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  timeLimitSeconds: number;
  points: number;
}

const emptyQuestion = (): Question => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimitSeconds: 30,
  points: 10,
});

export default function QuizForm() {
  const router = useRouter();

  // Quiz fields
  const [title, setTitle]               = useState('');
  const [category, setCategory]         = useState('General');
  const [description, setDescription]   = useState('');
  const [timeLimit, setTimeLimit]       = useState(10);
  const [passingScore, setPassingScore] = useState(60);
  const [status, setStatus]             = useState<'draft' | 'published'>('draft');

  // Questions
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  // UI state
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  // AI generation state
  const [aiOpen,       setAiOpen]       = useState(false);
  const [aiCount,      setAiCount]      = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError,      setAiError]      = useState('');
  const [aiGenerated,  setAiGenerated]  = useState<Question[]>([]);
  const [aiAdded,      setAiAdded]      = useState<Set<number>>(new Set());

  // ── Question helpers ──────────────────────────────────────────────

  function updateQuestion(i: number, field: keyof Question, value: any) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qIndex) return q;
      const options = [...q.options] as [string, string, string, string];
      options[oIndex] = value;
      return { ...q, options };
    }));
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQuestion()]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  function removeQuestion(i: number) {
    if (questions.length === 1) return;
    setQuestions(qs => qs.filter((_, idx) => idx !== i));
  }

  // ── AI generation ────────────────────────────────────────────────

  async function handleGenerate() {
    if (!title.trim()) { setAiError('Enter a quiz title first so the AI knows what to generate.'); return; }
    setAiGenerating(true);
    setAiError('');
    setAiGenerated([]);
    setAiAdded(new Set());
    try {
      const res  = await fetch('/api/questions/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, category, count: aiCount, difficulty: aiDifficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setAiGenerated(data.questions);
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiGenerating(false);
    }
  }

  function addAiQuestion(i: number) {
    setQuestions(qs => [...qs, { ...aiGenerated[i] }]);
    setAiAdded(prev => new Set(prev).add(i));
  }

  function addAllAiQuestions() {
    const toAdd = aiGenerated.filter((_, i) => !aiAdded.has(i));
    setQuestions(qs => [...qs, ...toAdd]);
    setAiAdded(new Set(aiGenerated.map((_, i) => i)));
  }

  function closeAiModal() {
    setAiOpen(false);
    setAiGenerated([]);
    setAiError('');
    setAiAdded(new Set());
  }

  const addedCount = aiAdded.size;

  // ── Save ─────────────────────────────────────────────────────────

  async function handleSave(publishStatus: 'draft' | 'published') {
    if (!title.trim()) { setError('Quiz title is required.'); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { setError(`Question ${i + 1} text is empty.`); return; }
      if (q.options.some(o => !o.trim())) { setError(`Question ${i + 1} has empty options.`); return; }
    }

    setSaving(true);
    setError('');

    try {
      // 1. create quiz
      const quizRes = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, category, description,
          timeLimitMinutes: timeLimit,
          passingScore, status: publishStatus,
        }),
      });

      if (!quizRes.ok) throw new Error('Failed to create quiz');
      const { id: quizId } = await quizRes.json();

      // 2. create all questions
      await Promise.all(questions.map(q =>
        fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId, ...q }),
        })
      ));

      setSaved(true);
      setTimeout(() => router.push('/quizzes'), 1000);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px',
    fontSize: '13px', fontFamily: 'var(--font)',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '600' as const,
    color: 'var(--text2)', marginBottom: '6px',
    letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Quiz details card ── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
          Quiz details
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>QUIZ TITLE *</label>
            <input
              style={inputStyle} value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. General Knowledge Quiz"
            />
          </div>

          <div>
            <label style={labelStyle}>CATEGORY</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={category} onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>TIME LIMIT (MINUTES)</label>
            <input
              type="number" style={inputStyle}
              value={timeLimit} min={1} max={120}
              onChange={e => setTimeLimit(Number(e.target.value))}
            />
          </div>

          <div>
            <label style={labelStyle}>PASSING SCORE (%)</label>
            <input
              type="number" style={inputStyle}
              value={passingScore} min={1} max={100}
              onChange={e => setPassingScore(Number(e.target.value))}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional — shown to players before starting the quiz"
            />
          </div>
        </div>
      </div>

      {/* ── Questions ── */}
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
          Questions
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'var(--accent-bg)', padding: '1px 7px', borderRadius: '10px' }}>
            {questions.length}
          </span>
        </span>
        <button onClick={addQuestion} className="btn" style={{ fontSize: '12px', padding: '6px 12px' }}>
          + Add question
        </button>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="card animate-in" style={{ padding: '20px', border: '0.5px solid var(--border)' }}>

          {/* Question header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: 'var(--accent-bg)', color: 'var(--accent)',
                fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>Q{qi + 1}</div>
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Multiple choice</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>TIMER (SEC)</label>
                <input
                  type="number" min={10} max={300} value={q.timeLimitSeconds}
                  onChange={e => updateQuestion(qi, 'timeLimitSeconds', Number(e.target.value))}
                  style={{ ...inputStyle, width: '70px', padding: '5px 8px', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>PTS</label>
                <input
                  type="number" min={1} max={100} value={q.points}
                  onChange={e => updateQuestion(qi, 'points', Number(e.target.value))}
                  style={{ ...inputStyle, width: '60px', padding: '5px 8px', textAlign: 'center' }}
                />
              </div>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qi)} style={{
                  background: 'var(--danger-bg)', border: '0.5px solid var(--danger)',
                  color: 'var(--danger)', borderRadius: '7px',
                  padding: '5px 10px', fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}>
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Question text */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>QUESTION TEXT *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={q.text}
              onChange={e => updateQuestion(qi, 'text', e.target.value)}
              placeholder={`Question ${qi + 1}...`}
            />
          </div>

          {/* Options */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>
              OPTIONS — click the circle to mark correct answer
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {q.options.map((opt, oi) => {
                const isCorrect = q.correctIndex === oi;
                return (
                  <div key={oi} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `0.5px solid ${isCorrect ? 'var(--success)' : 'var(--border2)'}`,
                    background: isCorrect ? 'var(--success-bg)' : 'var(--surface2)',
                    transition: 'all 0.15s',
                  }}>
                    <button
                      onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                      style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isCorrect ? 'var(--success)' : 'var(--border2)'}`,
                        background: isCorrect ? 'var(--success)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        padding: 0,
                      }}
                    >
                      {isCorrect && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2L8 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span style={{
                      fontSize: '10px', fontWeight: '700',
                      color: isCorrect ? 'var(--success)' : 'var(--text3)',
                      fontFamily: 'var(--font-mono)', minWidth: '14px',
                    }}>
                      {['A', 'B', 'C', 'D'][oi]}
                    </span>
                    <input
                      style={{
                        flex: 1, background: 'transparent',
                        border: 'none', outline: 'none',
                        fontSize: '13px', color: 'var(--text)',
                        fontFamily: 'var(--font)',
                      }}
                      value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* ── Add question button ── */}
      <button onClick={addQuestion} style={{
        width: '100%', padding: '14px',
        border: '1.5px dashed var(--border2)',
        borderRadius: 'var(--radius-lg)',
        background: 'transparent', cursor: 'pointer',
        fontSize: '13px', color: 'var(--text3)',
        fontFamily: 'var(--font)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-bg)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}>
        + Add another question
      </button>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--danger-bg)',
          border: '0.5px solid var(--danger)',
          borderRadius: 'var(--radius)',
          fontSize: '13px', color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}

      {/* ── Success ── */}
      {saved && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--success-bg)',
          border: '0.5px solid var(--success)',
          borderRadius: 'var(--radius)',
          fontSize: '13px', color: 'var(--success)',
          fontWeight: '500',
        }}>
          Quiz saved! Redirecting...
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{
        display: 'flex', gap: '10px', justifyContent: 'flex-end',
        paddingBottom: '100px',
      }}>
        <button onClick={() => router.push('/quizzes')} className="btn" disabled={saving}>
          Cancel
        </button>
        <button onClick={() => handleSave('draft')} className="btn" disabled={saving} style={{ minWidth: '120px' }}>
          {saving ? 'Saving...' : 'Save as draft'}
        </button>
        <button onClick={() => handleSave('published')} className="btn btn-primary" disabled={saving} style={{ minWidth: '140px' }}>
          {saving ? 'Publishing...' : 'Publish quiz →'}
        </button>
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setAiOpen(true)}
        title="Auto-generate questions with AI"
        style={{
          position: 'fixed', bottom: '32px', right: '32px',
          width: '58px', height: '58px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, transition: 'transform 0.15s, box-shadow 0.15s',
          color: 'white',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(99,102,241,0.65)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.5)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z"
            fill="white" opacity="0.9"/>
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"
            fill="white" opacity="0.7"/>
          <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17Z"
            fill="white" opacity="0.6"/>
        </svg>
      </button>

      {/* ── AI modal ── */}
      {aiOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeAiModal(); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: '16px',
            width: '100%', maxWidth: '640px',
            maxHeight: '88vh',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          }}>

            {/* Modal header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z" fill="white"/>
                    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" fill="white" opacity="0.8"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                    AI Question Generator
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {title || 'Enter a quiz title first'} · {category}
                  </div>
                </div>
              </div>
              <button onClick={closeAiModal} style={{
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                borderRadius: '8px', padding: '6px 10px',
                cursor: 'pointer', color: 'var(--text2)', fontSize: '18px', lineHeight: 1,
              }}>×</button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

              {/* Config */}
              {aiGenerated.length === 0 && !aiGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Count */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '11px', fontWeight: 600,
                      color: 'var(--text2)', marginBottom: '8px',
                      letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
                    }}>
                      NUMBER OF QUESTIONS
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[5, 10, 15, 20].map(n => (
                        <button
                          key={n}
                          onClick={() => setAiCount(n)}
                          style={{
                            flex: 1, padding: '10px',
                            borderRadius: '9px', fontSize: '14px', fontWeight: 600,
                            fontFamily: 'var(--font)', cursor: 'pointer',
                            background: aiCount === n ? 'var(--accent)' : 'var(--surface2)',
                            color:      aiCount === n ? 'white' : 'var(--text2)',
                            border:     aiCount === n ? '0.5px solid var(--accent)' : '0.5px solid var(--border2)',
                            transition: 'all 0.15s',
                          }}
                        >{n}</button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '11px', fontWeight: 600,
                      color: 'var(--text2)', marginBottom: '8px',
                      letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
                    }}>
                      DIFFICULTY
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {([
                        { v: 'Easy',   color: 'var(--success)' },
                        { v: 'Medium', color: 'var(--warning)' },
                        { v: 'Hard',   color: 'var(--danger)'  },
                      ] as const).map(({ v, color }) => (
                        <button
                          key={v}
                          onClick={() => setAiDifficulty(v)}
                          style={{
                            flex: 1, padding: '10px',
                            borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                            fontFamily: 'var(--font)', cursor: 'pointer',
                            background: aiDifficulty === v ? color : 'var(--surface2)',
                            color:      aiDifficulty === v ? 'white' : 'var(--text2)',
                            border:     aiDifficulty === v ? `0.5px solid ${color}` : '0.5px solid var(--border2)',
                            transition: 'all 0.15s',
                          }}
                        >{v}</button>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{
                    padding: '12px 14px', borderRadius: '9px',
                    background: 'var(--accent-bg)', border: '0.5px solid rgba(99,102,241,0.2)',
                    fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6,
                  }}>
                    <strong style={{ color: 'var(--accent)' }}>Powered by Groq · Llama 3.3 70B (free)</strong>
                    <br />
                    Questions are generated based on the quiz title and category.
                    You can review each one before adding to the quiz.
                  </div>

                  {aiError && (
                    <div style={{
                      padding: '12px 14px', borderRadius: '9px',
                      background: 'var(--danger-bg)', border: '0.5px solid var(--danger)',
                      fontSize: '13px', color: 'var(--danger)',
                      whiteSpace: 'pre-wrap', lineHeight: 1.5,
                    }}>
                      {aiError}
                    </div>
                  )}
                </div>
              )}

              {/* Loading */}
              {aiGenerating && (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '60px 0', gap: '16px',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    border: '3px solid var(--border2)',
                    borderTopColor: 'var(--accent)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    Generating {aiCount} questions…
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    This usually takes 3–8 seconds
                  </div>
                </div>
              )}

              {/* Results */}
              {aiGenerated.length > 0 && !aiGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {aiGenerated.length} questions generated
                      {addedCount > 0 && (
                        <span style={{
                          marginLeft: '8px', fontSize: '11px',
                          color: 'var(--success)', fontFamily: 'var(--font-mono)',
                          background: 'var(--success-bg)', padding: '1px 8px',
                          borderRadius: '10px',
                        }}>
                          {addedCount} added
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleGenerate}
                      style={{
                        fontSize: '11px', padding: '5px 12px', borderRadius: '7px',
                        border: '0.5px solid var(--border2)',
                        background: 'var(--surface2)', color: 'var(--text2)',
                        cursor: 'pointer', fontFamily: 'var(--font)',
                      }}
                    >
                      Regenerate
                    </button>
                  </div>

                  {aiGenerated.map((q, qi) => {
                    const isAdded = aiAdded.has(qi);
                    return (
                      <div key={qi} style={{
                        border: `0.5px solid ${isAdded ? 'var(--success)' : 'var(--border)'}`,
                        borderRadius: '10px', overflow: 'hidden',
                        background: isAdded ? 'var(--success-bg)' : 'var(--surface)',
                        opacity: isAdded ? 0.7 : 1,
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', marginBottom: '8px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                background: isAdded ? 'var(--success)' : 'var(--accent-bg)',
                                color: isAdded ? 'white' : 'var(--accent)',
                                fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {isAdded ? '✓' : `Q${qi + 1}`}
                              </span>
                              <span style={{
                                fontSize: '10px', fontFamily: 'var(--font-mono)',
                                color: 'var(--text3)',
                              }}>
                                {q.timeLimitSeconds}s · {q.points}pts
                              </span>
                            </div>
                            {!isAdded && (
                              <button
                                onClick={() => addAiQuestion(qi)}
                                style={{
                                  padding: '5px 14px', borderRadius: '7px',
                                  background: 'var(--accent)', color: 'white',
                                  border: 'none', cursor: 'pointer',
                                  fontSize: '12px', fontWeight: 600,
                                  fontFamily: 'var(--font)',
                                }}
                              >
                                + Add
                              </button>
                            )}
                          </div>
                          <div style={{
                            fontSize: '13px', fontWeight: 500,
                            color: 'var(--text)', marginBottom: '10px', lineHeight: 1.5,
                          }}>
                            {q.text}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {q.options.map((opt, oi) => {
                              const isCorrect = q.correctIndex === oi;
                              return (
                                <div key={oi} style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '7px 10px', borderRadius: '7px',
                                  background: isCorrect ? 'var(--success-bg)' : 'var(--surface2)',
                                  border: `0.5px solid ${isCorrect ? 'var(--success)' : 'var(--border)'}`,
                                }}>
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    color: isCorrect ? 'var(--success)' : 'var(--text3)',
                                    minWidth: '12px',
                                  }}>
                                    {['A','B','C','D'][oi]}
                                  </span>
                                  <span style={{
                                    fontSize: '12px',
                                    color: isCorrect ? 'var(--success)' : 'var(--text2)',
                                    fontWeight: isCorrect ? 600 : 400, lineHeight: 1.3,
                                  }}>
                                    {opt}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '0.5px solid var(--border)',
              display: 'flex', gap: '10px', flexShrink: 0,
              background: 'var(--surface)',
            }}>
              {aiGenerated.length === 0 && !aiGenerating ? (
                <>
                  <button onClick={closeAiModal} className="btn" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={aiGenerating}
                    style={{
                      flex: 3, padding: '10px',
                      borderRadius: '9px', border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white', fontSize: '13px', fontWeight: 600,
                      fontFamily: 'var(--font)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z" fill="white"/>
                    </svg>
                    Generate {aiCount} questions · {aiDifficulty}
                  </button>
                </>
              ) : aiGenerated.length > 0 && !aiGenerating ? (
                <>
                  <button onClick={closeAiModal} className="btn" style={{ flex: 1, justifyContent: 'center' }}>
                    Done
                  </button>
                  <button
                    onClick={addAllAiQuestions}
                    disabled={addedCount === aiGenerated.length}
                    className="btn btn-primary"
                    style={{ flex: 2, justifyContent: 'center' }}
                  >
                    {addedCount === aiGenerated.length
                      ? `All ${aiGenerated.length} added ✓`
                      : `Add all ${aiGenerated.length - addedCount} remaining`}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

    </div>
  );
}