import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
        privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      }),
    });

export const adminAuth      = getAuth(adminApp);
export const adminDb        = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);