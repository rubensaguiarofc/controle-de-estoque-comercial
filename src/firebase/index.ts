
"use client";

import { getFirebaseConfig } from "./config";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { setupOffline } from "./offline";

// This module now performs initialization lazily and only on the client.
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

export async function initializeFirebase() {
  // Only initialize in a browser environment and when config is present.
  if (typeof window === "undefined") {
    // Server-side: do not initialize Firebase.
  return { firebaseApp: null, auth: null, firestore: null };
  }

  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig.apiKey) {
    // Client runtime but missing config: warn and return nulls.
    console.warn('Firebase config missing at runtime; Firebase will not be initialized.');
    return { firebaseApp: null, auth: null, firestore: null };
  }

  if (!getApps().length) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase initialization error", error);
      throw error;
    }
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);
  try {
    firestore = await setupOffline(firebaseApp);
  } catch (e) {
    console.warn('Falling back to default Firestore without persistence', e);
    firestore = getFirestore(firebaseApp);
  }

  return { firebaseApp, auth, firestore };
}

export function getInitializedApp() {
  if (!firebaseApp) throw new Error('Firebase not initialized. Call initializeFirebase() on the client first.');
  return firebaseApp;
}

export function getInitializedAuth() {
  if (!auth) throw new Error('Auth not initialized. Call initializeFirebase() on the client first.');
  return auth;
}

export function getInitializedFirestore() {
  if (!firestore) throw new Error('Firestore not initialized. Call initializeFirebase() on the client first.');
  return firestore;
}

export * from './provider';
export * from './auth/use-user';
