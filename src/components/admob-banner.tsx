"use client";

import { useEffect } from "react";
import { AdMob, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";

// This component tries to show a simple banner when running on a native build.
// On web it will do nothing.
export function AdmobBanner() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await AdMob.trackingAuthorizationStatus();
        if (info.status === "notDetermined") {
          await AdMob.requestTrackingAuthorization();
        }
        await AdMob.initialize({
          initializeForTesting: false,
        });
        if (cancelled) return;
        await AdMob.showBanner({
          adId: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111",
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: !process.env.NEXT_PUBLIC_ADMOB_BANNER_ID,
        });
      } catch (e) {
        // ignore on web or if plugin not available
      }
    })();
    return () => {
      cancelled = true;
      try { AdMob.removeBanner(); } catch {}
    };
  }, []);
  return null;
}
