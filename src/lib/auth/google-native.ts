"use client";

import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export type GoogleNativeResult = {
  ok: boolean;
  idToken?: string;
  error?: string;
};

export async function signInWithGoogleNative(): Promise<GoogleNativeResult> {
  try {
    if (Capacitor.getPlatform() !== "android") {
      return { ok: false, error: "not-native" };
    }
    // Trigger native Google sign-in via Firebase Auth plugin
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      // try to fetch token from currentUser as a fallback
      try {
        const currentUser = await FirebaseAuthentication.getCurrentUser();
        const tokenRes = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        if (tokenRes && tokenRes.token) {
          return { ok: true, idToken: tokenRes.token };
        }
      } catch {}
      return { ok: false, error: "missing-id-token" };
    }
    return { ok: true, idToken };
  } catch (e: any) {
    return { ok: false, error: e?.message || "google-native-failed" };
  }
}
