import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClient {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  isConfigured: boolean;
}

let firebaseClient: FirebaseClient = {
  app: null,
  auth: null,
  db: null,
  isConfigured: false,
};

export function initFirebase(config?: any): FirebaseClient {
  if (typeof window === 'undefined') return firebaseClient;
  try {
    const savedConfig = config || JSON.parse(localStorage.getItem('my_school_firebase_config') || '{}');
    if (savedConfig && savedConfig.apiKey && savedConfig.projectId) {
      const app = getApps().length === 0 ? initializeApp(savedConfig) : getApp();
      firebaseClient = {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        isConfigured: true,
      };
      return firebaseClient;
    }
  } catch (error) {
    console.warn('Firebase initialization skipped or failed:', error);
  }

  firebaseClient = {
    app: null,
    auth: null,
    db: null,
    isConfigured: false,
  };
  return firebaseClient;
}

export function getFirebaseClient(): FirebaseClient {
  if (!firebaseClient.isConfigured) {
    initFirebase();
  }
  return firebaseClient;
}
