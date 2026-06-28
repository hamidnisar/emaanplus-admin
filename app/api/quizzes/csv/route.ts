import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

// ── Encoding detection + CSV parsing ─────────────────────────────────────────

function decodeBuffer(buffer: ArrayBuffer): string {
  const b = new Uint8Array(buffer);
  // UTF-16 LE — Excel "Unicode Text" / Windows saves this by default
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(buffer.slice(2));
  // UTF-16 BE
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(buffer.slice(2));
  // UTF-8 BOM
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return new TextDecoder('utf-8').decode(buffer.slice(3));
  return new TextDecoder('utf-8').decode(buffer);
}

function parseCSVLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t').map(f => f.trim());
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim()); current = '';
    } else { current += ch; }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(buffer: ArrayBuffer): string[][] {
  const text = decodeBuffer(buffer).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  return lines.map(l => parseCSVLine(l, delimiter));
}

// ── Route handler ─────────────────────────────────────────────────────────────
/*
  CSV column layout (14 cols, comma or tab delimited, UTF-8 or UTF-16):
  Col 0  title              ← quiz rows  (non-empty col 0 = new quiz)
  Col 1  category           ← quiz rows
  Col 2  description        ← quiz rows
  Col 3  passingScore       ← quiz rows
  Col 4  timeLimitMinutes   ← quiz rows
  Col 5  status             ← quiz rows (published | draft)
  Col 6  text               ← question rows (col 0 empty + col 6 non-empty)
  Col 7  option1
  Col 8  option2
  Col 9  option3
  Col 10 option4
  Col 11 correctIndex (0-based)
  Col 12 points
  Col 13 timeLimitSeconds

  Supports multiple quizzes per file: each row with a value in col 0
  starts a new quiz; subsequent rows with col 0 empty are its questions.
*/

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a .csv file.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const rows   = parseCSV(buffer);

    if (rows.length < 3) {
      return NextResponse.json(
        { error: 'CSV must have a header row, a quiz row, and at least one question row.' },
        { status: 400 }
      );
    }

    // ── Group rows into quizzes ───────────────────────────────────────────────
    const quizDataList: { quizRow: string[]; questionRows: string[][] }[] = [];
    let current: { quizRow: string[]; questionRows: string[][] } | null = null;

    for (const row of rows.slice(1)) {        // skip header
      if (row[0]?.trim()) {                   // new quiz starts
        if (current) quizDataList.push(current);
        current = { quizRow: row, questionRows: [] };
      } else if (current && row[6]?.trim()) { // question for current quiz
        current.questionRows.push(row);
      }
    }
    if (current && current.questionRows.length > 0) quizDataList.push(current);

    if (quizDataList.length === 0) {
      return NextResponse.json(
        { error: 'No valid question rows found. Questions start at row 3 (column G).' },
        { status: 400 }
      );
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const errors: string[] = [];
    quizDataList.forEach(({ quizRow, questionRows }, qi) => {
      if (!quizRow[0]?.trim()) errors.push(`Quiz ${qi + 1}: title is required.`);
      questionRows.forEach((r, i) => {
        if (!r[7]?.trim()) errors.push(`Quiz ${qi + 1} Q${i + 1}: option1 is required.`);
        const ci = Number(r[11]);
        if (isNaN(ci) || ci < 0 || ci > 3) errors.push(`Quiz ${qi + 1} Q${i + 1}: correctIndex must be 0–3.`);
      });
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.slice(0, 5).join(' | ') }, { status: 400 });
    }

    // ── Write to Firestore (sequential quizzes, parallel questions) ───────────
    let firstQuizId    = '';
    let totalQuestions = 0;

    for (const { quizRow, questionRows } of quizDataList) {
      const title            = quizRow[0]?.trim() || '';
      const category         = quizRow[1]?.trim() || 'General';
      const description      = quizRow[2]?.trim() || '';
      const passingScore     = Math.max(0, Math.min(100, Number(quizRow[3]) || 50));
      const timeLimitMinutes = Math.max(1, Number(quizRow[4]) || 10);
      const status           = ['published', 'draft', 'archived'].includes(quizRow[5]?.trim())
        ? quizRow[5].trim() : 'published';

      const quizRef = await adminDb.collection('quizzes').add({
        title, category, description, passingScore, timeLimitMinutes, status,
        questionCount: 0, totalPlayers: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (!firstQuizId) firstQuizId = quizRef.id;

      await Promise.all(
        questionRows.map(r =>
          adminDb.collection('questions').add({
            quizId:           quizRef.id,
            text:             r[6].trim(),
            options:          [r[7], r[8], r[9], r[10]].map(o => (o || '').trim()).filter(Boolean),
            correctIndex:     Number(r[11]) || 0,
            points:           Math.max(1, Number(r[12]) || 5),
            timeLimitSeconds: Math.max(5, Number(r[13]) || 30),
            createdAt:        FieldValue.serverTimestamp(),
          })
        )
      );

      await adminDb.collection('quizzes').doc(quizRef.id).update({
        questionCount: questionRows.length,
        updatedAt:     FieldValue.serverTimestamp(),
      });

      totalQuestions += questionRows.length;
    }

    revalidatePath('/quizzes');

    return NextResponse.json({
      success:          true,
      quizId:           firstQuizId,
      quizzesCreated:   quizDataList.length,
      questionsCreated: totalQuestions,
    });
  } catch (e: any) {
    console.error('CSV upload error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
