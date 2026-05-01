import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import UsersTable from '@/components/UsersTable';

async function getUsers() {
  try {
    const snap = await adminDb
      .collection('players')
      .orderBy('createdAt', 'desc')
      .get();

    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid:           d.id,
        displayName:   data.displayName  || 'Unknown',
        email:         data.email        || '',
        photoURL:      data.photoURL     || null,
        phone:         data.phone        || '',
        city:          data.city         || '',
        address:       data.address      || '',
        postalCode:    data.postalCode   || '',
        country:       data.country      || '',
        totalScore:    data.totalScore   || 0,
        quizzesPlayed: data.quizzesPlayed || 0,
        referralCode:  data.referralCode || null,
        referralCount: data.referralCount || 0,
        status:        data.status       || 'active',
        createdAt:     data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });
  } catch {
    return [];
  }
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <Topbar
        title="Users"
        subtitle={`${users.length} registered players`}
      />
      <div style={{ padding: '28px' }}>
        {users.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>◉</div>
            <div style={{
              fontSize: '15px', fontWeight: '600',
              color: 'var(--text)', marginBottom: '6px',
            }}>
              No players yet
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
              Players appear here once they register in your mobile app
            </div>
          </div>
        ) : (
          <UsersTable initialUsers={users} />
        )}
      </div>
    </>
  );
}