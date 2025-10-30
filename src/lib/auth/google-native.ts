"use client";

import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export type GoogleNativeResult = {
  ok: boolean;
  idToken?: string;
  accessToken?: string;
  error?: string;
};

export async function signInWithGoogleNative(): Promise<GoogleNativeResult> {
  try {
    if (Capacitor.getPlatform() !== "android") {
      return { ok: false, error: "not-native" };
    }
    // Trigger native Google sign-in via Firebase Auth plugin
    // To receive a Google ID token (verifiable by backend), pass the Web Client ID as serverClientId
    const serverClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!serverClientId) {
      return { ok: false, error: "missing-web-client-id" };
    }
    // 1) Tenta o fluxo nativo do Google Play Services
    try {
      const result = await FirebaseAuthentication.signInWithGoogle({
      // Include 'openid' to ensure an ID token is requested alongside profile/email
      scopes: ["openid", "profile", "email"],
      // serverClientId is required to request an ID token bound to your Web OAuth client
      serverClientId,
      // Avoid native Firebase sign-in to prevent internal NPEs; we'll sign in via Web SDK
      skipNativeAuth: true,
      } as any);
      const idToken = result.credential?.idToken;
      const accessToken = (result as any)?.credential?.accessToken;
      if (!idToken) {
        return { ok: false, error: "missing-id-token" };
      }
      return { ok: true, idToken, accessToken };
    } catch (nativeErr: any) {
      // retornar erro detalhado para ser exibido no snackbar
      const msg = nativeErr?.message || "google-native-failed";
      return { ok: false, error: msg };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || "google-native-failed" };
  }
}
