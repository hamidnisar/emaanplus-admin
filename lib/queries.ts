// lib/queries.ts
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getLeaderboard(top = 50) {
  const q = query(
    collection(db, 'players'),
    orderBy('totalScore', 'desc'),
    limit(top)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}