import { adminDb } from '@/lib/firebase-admin';
import Topbar from '@/components/Topbar';
import SettingsClient from '@/components/SettingsClient';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

async function getAdmins() {
  try {
    const snap = await adminDb.collection('admins').get();
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid:         d.id,
        displayName: data.displayName || '',
        email:       data.email       || '',
        role:        data.role        || 'editor',
        createdAt:   data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });
  } catch {
    return [];
  }
}

async function getAppSettings() {
  try {
    const doc = await adminDb.collection('settings').doc('app').get();
    if (!doc.exists) {
      return {
        appName:           'QuizApp',
        appDescription:    'Compete, learn and win!',
        maxPlayersPerQuiz: 500,
        defaultTimeLimit:  10,
        passingScore:      60,
        maintenanceMode:   false,
        allowRegistration: true,
      };
    }
    const data = doc.data()!;
    return {
      appName:           data.appName           || 'QuizApp',
      appDescription:    data.appDescription    || '',
      maxPlayersPerQuiz: data.maxPlayersPerQuiz  || 500,
      defaultTimeLimit:  data.defaultTimeLimit   || 10,
      passingScore:      data.passingScore       || 60,
      maintenanceMode:   data.maintenanceMode    ?? false,
      allowRegistration: data.allowRegistration  ?? true,
    };
  } catch {
    return {
      appName:           'QuizApp',
      appDescription:    'Compete, learn and win!',
      maxPlayersPerQuiz: 500,
      defaultTimeLimit:  10,
      passingScore:      60,
      maintenanceMode:   false,
      allowRegistration: true,
    };
  }
}

async function getCurrentUserRole() {
  try {
    const cookieStore = await cookies();
    const session     = cookieStore.get('session')?.value;
    if (!session) return 'editor';
    const decoded = await adminAuth.verifySessionCookie(session);
    const doc     = await adminDb.collection('admins').doc(decoded.uid).get();
    return doc.data()?.role || 'editor';
  } catch {
    return 'editor';
  }
}

export default async function SettingsPage() {
  const [admins, appSettings, currentRole] = await Promise.all([
    getAdmins(),
    getAppSettings(),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Manage admins, roles and app configuration"
      />
      <div style={{ padding: '28px' }}>
        <SettingsClient
          initialAdmins={admins}
          initialSettings={appSettings}
          currentRole={currentRole}
        />
      </div>
    </>
  );
}