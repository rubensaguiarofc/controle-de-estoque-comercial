
"use client";

import React, { ReactNode } from "react";
import { initializeFirebase } from ".";
import { FirebaseProvider } from "./provider";

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the main layout of the application.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
