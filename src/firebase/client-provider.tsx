
"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { initializeFirebase } from ".";
import { FirebaseProvider } from "./provider";

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the main layout of the application.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initializeFirebase();
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false };
  }, []);
  if (!ready) return null;
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
