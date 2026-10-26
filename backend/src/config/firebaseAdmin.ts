import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export const initFirebaseAdmin = () => {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID?.replace(/"/g, '');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Make sure we handle escaped newlines if they are injected via strings
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase Admin] Missing full credentials (clientEmail or privateKey). Initializing with projectId only for Auth.');
    if (!projectId) {
       console.error('[Firebase Admin] Even projectId is missing. Auth will fail.');
       return;
    }
    try {
      initializeApp({ projectId });
      console.log('[Firebase Admin] Initialized in Auth-only mode (FCM disabled).');
    } catch (error) {
      console.error('[Firebase Admin] Failed to initialize Auth-only mode:', error);
    }
    return;
  }

  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
  }
};

export const getFirebaseAdmin = () => getApp();
export const getFirebaseMessaging = () => getMessaging();
