import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import NotificationsClient from '@/components/NotificationsClient';

async function getNotifications() {
  try {
    const snap = await adminDb
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map(d => {
      const data = d.data();
      return {
        id:         d.id,
        title:      data.title       || '',
        body:       data.body        || '',
        targetType: data.targetType  || 'all',
        targetUid:  data.targetUid   || null,
        targetCity: data.targetCity  || null,
        status:     data.status      || 'sent',
        sentCount:  data.sentCount   || 0,
        failCount:  data.failCount   || 0,
        scheduleAt: data.scheduleAt  || null,
        createdAt:  data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });
  } catch {
    return [];
  }
}

async function getCities() {
  try {
    const snap = await adminDb
      .collection('players')
      .where('status', '==', 'active')
      .get();

    const cities = new Set<string>();
    snap.docs.forEach(d => {
      const city = d.data().city;
      if (city) cities.add(city);
    });

    return Array.from(cities).sort();
  } catch {
    return [];
  }
}

async function getPlayerCount() {
  try {
    const snap = await adminDb
      .collection('players')
      .where('status', '==', 'active')
      .get();
    return snap.size;
  } catch {
    return 0;
  }
}

export default async function NotificationsPage() {
  const [notifications, cities, playerCount] = await Promise.all([
    getNotifications(),
    getCities(),
    getPlayerCount(),
  ]);

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle="Send push notifications to your players"
      />
      <div style={{ padding: '28px' }}>
        <NotificationsClient
          initialNotifications={notifications}
          cities={cities}
          playerCount={playerCount}
        />
      </div>
    </>
  );
}