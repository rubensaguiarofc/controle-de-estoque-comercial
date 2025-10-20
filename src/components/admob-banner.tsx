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
        // Show banner
        await AdMob.showBanner({
          adId: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111",
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: !process.env.NEXT_PUBLIC_ADMOB_BANNER_ID,
        });

        // Heuristic: set a CSS var for bottom inset to avoid UI overlap with the banner.
        // Adaptive banner heights typically ~50-80px depending on device density.
        if (!cancelled && typeof document !== 'undefined') {
          const approx = 64; // px, safe default
          document.documentElement.style.setProperty('--admob-bottom-inset', `${approx}px`);
          document.documentElement.classList.add('admob-banner-visible');
        }
      } catch (e) {
        // ignore on web or if plugin not available
      }
    })();
    return () => {
      cancelled = true;
      try { AdMob.removeBanner(); } catch {}
      if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--admob-bottom-inset');
        document.documentElement.classList.remove('admob-banner-visible');
      }
    };
  }, []);
  return null;
}
