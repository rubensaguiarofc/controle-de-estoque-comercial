
// Firebase configuration helper
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? undefined,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? undefined,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? undefined,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? undefined,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? undefined,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? undefined,
};

/**
 * Returns the current firebase config object. Values may be undefined during
 * static builds; use `isFirebaseConfigured()` to check readiness before
 * attempting initialization.
 */
export function getFirebaseConfig(): FirebaseConfig {
  return firebaseConfig;
}

/**
 * Indicates whether the minimal required fields for Firebase initialization
 * are present. We require apiKey, projectId and appId as a baseline.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
