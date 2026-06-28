'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type State = 'idle' | 'uploading' | 'success' | 'error';

const TEMPLATE_HEADERS =
  'title,category,description,passingScore,timeLimitMinutes,status,text,option1,option2,option3,option4,correctIndex,points,timeLimitSeconds';

const TEMPLATE_ROWS = [
  // quiz info row — columns 0-5 filled, columns 6-13 empty
  'My Quiz Title,General,Optional description,60,10,published,,,,,,,,',
  // question rows — columns 0-5 ignored, columns 6-13 filled
  ',,,,,,What is the first question?,Option A,Option B,Option C,Option D,0,5,30',
  ',,,,,,What is the second question?,Option A,Option B,Option C,Option D,2,5,30',
  ',,,,,,What is the third question?,Option A,Option B,Option C,Option D,1,5,30',
];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS].join('\n');
  const BOM  = '﻿'; // Excel reads Urdu correctly with BOM
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'quiz-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvUpload() {
  const [open, setOpen]       = useState(false);
  const [file, setFile]       = useState<File | null>(null);
  const [drag, setDrag]       = useState(false);
  const [state, setState]     = useState<State>('idle');
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<{ quizId: string; quizzesCreated: number; questionsCreated: number } | null>(null);
  const fileRef               = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  function reset() {
    setFile(null);
    setError('');
    setResult(null);
    setState('idle');
  }

  function close() {
    setOpen(false);
    reset();
  }

  function pickFile(f: File | null) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file.');
      return;
    }
    setError('');
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setState('uploading');
    setError('');

    const body = new FormData();
    body.append('file', file);

    try {
      const res  = await fetch('/api/quizzes/csv', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        setState('error');
      } else {
        setResult(data);
        setState('success');
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
      setState('error');
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  };

  const modal: React.CSSProperties = {
    background: 'var(--surface)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '460px',
    boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
  };

  const dropZone: React.CSSProperties = {
    border: `1.5px dashed ${drag ? 'var(--accent)' : 'var(--border2)'}`,
    borderRadius: '10px',
    padding: '28px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: drag ? 'var(--accent-bg)' : 'var(--surface2)',
    transition: 'all 0.15s',
  };

  return (
    <>
      {/* Trigger */}
      <button className="btn" onClick={() => setOpen(true)}>
        ↑ Import CSV
      </button>

      {/* Modal */}
      {open && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && close()}>
          <div style={modal}>

            {/* Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                  Import Quiz from CSV
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  Creates a quiz and all its questions at once
                </div>
              </div>
              <button onClick={close} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', fontSize: '18px', lineHeight: 1,
                padding: '2px 6px', borderRadius: '6px',
              }}>×</button>
            </div>

            <div style={{ padding: '22px' }}>

              {/* ── Success state ── */}
              {state === 'success' && result && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'var(--success-bg)', border: '2px solid var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="var(--success)" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                    {result.quizzesCreated > 1 ? 'Quizzes created!' : 'Quiz created!'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '22px' }}>
                    {result.quizzesCreated > 1
                      ? <><strong>{result.quizzesCreated}</strong> quizzes with <strong>{result.questionsCreated}</strong> questions imported successfully.</>
                      : <><strong>{result.questionsCreated}</strong> questions imported successfully.</>
                    }
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn" onClick={() => { reset(); }}>
                      Import another
                    </button>
                    {result.quizzesCreated === 1 ? (
                      <a
                        href={`/quizzes/${result.quizId}`}
                        className="btn btn-primary"
                        style={{ textDecoration: 'none' }}
                        onClick={close}
                      >
                        View quiz →
                      </a>
                    ) : (
                      <a
                        href="/quizzes"
                        className="btn btn-primary"
                        style={{ textDecoration: 'none' }}
                        onClick={close}
                      >
                        View all quizzes →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* ── Idle / Error state ── */}
              {state !== 'success' && (
                <>
                  {/* Format hint + template */}
                  <div style={{
                    background: 'var(--surface2)', border: '0.5px solid var(--border)',
                    borderRadius: '8px', padding: '12px 14px', marginBottom: '16px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      CSV FORMAT
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.7 }}>
                      <div><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>Row 1</span> — Header (required)</div>
                      <div><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>Quiz row</span> — title in col A: category, description, passingScore, timeLimitMinutes, status</div>
                      <div><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>Q row</span> — col A empty: text, option1–4, correctIndex (0–3), points, timeLimitSeconds</div>
                      <div style={{ color: 'var(--accent)', marginTop: '4px' }}>Supports multiple quizzes per file. Accepts UTF-8 or UTF-16, comma or tab delimited.</div>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      style={{
                        marginTop: '10px', background: 'none', border: '0.5px solid var(--border2)',
                        borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                        fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font)',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      ↓ Download template
                    </button>
                  </div>

                  {/* Drop zone */}
                  <div
                    style={dropZone}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDrag(false);
                      pickFile(e.dataTransfer.files[0] ?? null);
                    }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={e => pickFile(e.target.files?.[0] ?? null)}
                    />
                    {file ? (
                      <>
                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>📄</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', wordBreak: 'break-all' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                          {(file.size / 1024).toFixed(1)} KB · click to change
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '26px', marginBottom: '8px', color: 'var(--text3)' }}>⬆</div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)' }}>
                          Drop your CSV file here
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                          or click to browse
                        </div>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div style={{
                      marginTop: '12px', padding: '10px 14px',
                      background: 'var(--danger-bg)', border: '0.5px solid var(--danger)',
                      borderRadius: '8px', fontSize: '12px', color: 'var(--danger)', lineHeight: 1.5,
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={close}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2, justifyContent: 'center', opacity: (!file || state === 'uploading') ? 0.7 : 1 }}
                      disabled={!file || state === 'uploading'}
                      onClick={handleUpload}
                    >
                      {state === 'uploading' ? 'Uploading…' : '↑ Upload & create quiz'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
