"use client";

import { enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";

export async function setupOffline(app: FirebaseApp) {
  // Initialize Firestore with cache to support offline reliably on mobile
  const db = initializeFirestore(app, {
    localCache: undefined,
  });
  try {
    await enableIndexedDbPersistence(db);
  } catch (e) {
    console.warn("Firestore persistence not enabled:", e);
  }
  return db;
}
