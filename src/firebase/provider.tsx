
"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { getInitializedApp, getInitializedAuth, getInitializedFirestore } from ".";

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  // FirebaseClientProvider ensures initializeFirebase() ran before rendering this.
  // Here we just read the initialized singletons; if something goes wrong, expose nulls.
  let firebaseApp: FirebaseApp | null = null;
  let auth: Auth | null = null;
  let firestore: Firestore | null = null;
  try { firebaseApp = getInitializedApp(); } catch { firebaseApp = null; }
  try { auth = getInitializedAuth(); } catch { auth = null; }
  try { firestore = getInitializedFirestore(); } catch { firestore = null; }

  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}

export function useFirebaseApp() {
  const context = useFirebase();
  return context.firebaseApp;
}

export function useAuth() {
  const context = useFirebase();
  return context.auth;
}

export function useFirestore() {
  const context = useFirebase();
  return context.firestore;
}
