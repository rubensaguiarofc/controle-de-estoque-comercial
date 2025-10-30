"use client";

import { useEffect, useRef, useState } from "react";
import { AdMob, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";

// This component tries to show a simple banner when running on a native build.
// On web it will do nothing.
export function AdmobBanner() {
  const closeDelaySeconds = Number(process.env.NEXT_PUBLIC_ADMOB_CLOSE_DELAY_SECONDS || '10');
  const reshowMinutes = Number(process.env.NEXT_PUBLIC_ADMOB_RESHOW_MINUTES || '5');
  const reshowDelayMs = Math.max(0, reshowMinutes) * 60_000;

  const [secondsLeft, setSecondsLeft] = useState<number>(closeDelaySeconds);
  const [canClose, setCanClose] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reshowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function showBannerNow() {
      try {
        const info = await AdMob.trackingAuthorizationStatus();
        if (info.status === "notDetermined") {
          await AdMob.requestTrackingAuthorization();
        }
        await AdMob.initialize({ initializeForTesting: false });
        if (cancelled) return;

        await AdMob.showBanner({
          adId: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111",
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: !process.env.NEXT_PUBLIC_ADMOB_BANNER_ID,
        });

        if (!cancelled && typeof document !== 'undefined') {
          const approx = 64;
          document.documentElement.style.setProperty('--admob-bottom-inset', `${approx}px`);
          document.documentElement.classList.add('admob-banner-visible');
        }

        if (!cancelled) {
          setIsVisible(true);
          setCanClose(false);
          setSecondsLeft(closeDelaySeconds);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setSecondsLeft((s) => {
              if (s <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                setCanClose(true);
                return 0;
              }
              return s - 1;
            });
          }, 1000);
        }
      } catch (e) {
        // ignore on web or if plugin not available
      }
    }

    // Determine when to show, based on last close time
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('admob_last_closed_ts') : null;
      const lastClosed = raw ? Number(raw) : 0;
      const now = Date.now();
      const nextAllowed = lastClosed + reshowDelayMs;
      if (!lastClosed || now >= nextAllowed) {
        showBannerNow();
      } else {
        const wait = Math.max(0, nextAllowed - now);
        if (reshowRef.current) clearTimeout(reshowRef.current);
        reshowRef.current = setTimeout(() => { if (!cancelled) showBannerNow(); }, wait);
      }
    } catch {
      // Fallback: show immediately
      showBannerNow();
    }

    return () => {
      cancelled = true;
      try { AdMob.removeBanner(); } catch {}
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (reshowRef.current) { clearTimeout(reshowRef.current); reshowRef.current = null; }
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--admob-bottom-inset', '0px');
        document.documentElement.classList.remove('admob-banner-visible');
      }
    };
  }, [closeDelaySeconds, reshowDelayMs]);

  // Safety: whenever visibility changes, enforce CSS state
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isVisible) {
      document.documentElement.classList.add('admob-banner-visible');
    } else {
      document.documentElement.classList.remove('admob-banner-visible');
      document.documentElement.style.setProperty('--admob-bottom-inset', '0px');
      // Double-ensure after a tick (guards against async overlay release)
      setTimeout(() => {
        document.documentElement.style.setProperty('--admob-bottom-inset', '0px');
      }, 150);
    }
  }, [isVisible]);

  async function handleClose() {
    try { await AdMob.removeBanner(); } catch {}
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (typeof document !== 'undefined') {
      // Ensure nav snaps back to the absolute footer
      document.documentElement.style.setProperty('--admob-bottom-inset', '0px');
      document.documentElement.classList.remove('admob-banner-visible');
    }
    setIsVisible(false);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('admob_last_closed_ts', String(Date.now()));
      }
    } catch {}
    // Schedule automatic reshow after the configured delay
    if (reshowRef.current) clearTimeout(reshowRef.current);
    if (reshowDelayMs > 0) {
      reshowRef.current = setTimeout(async () => {
        // Attempt to show again
        try {
          await AdMob.showBanner({
            adId: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111",
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: !process.env.NEXT_PUBLIC_ADMOB_BANNER_ID,
          });
          if (typeof document !== 'undefined') {
            const approx = 64;
            document.documentElement.style.setProperty('--admob-bottom-inset', `${approx}px`);
            document.documentElement.classList.add('admob-banner-visible');
          }
          setIsVisible(true);
          setCanClose(false);
          setSecondsLeft(closeDelaySeconds);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setSecondsLeft((s) => {
              if (s <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                setCanClose(true);
                return 0;
              }
              return s - 1;
            });
          }, 1000);
        } catch {}
      }, reshowDelayMs);
    }
  }

  // Render a small chip above the banner; stays outside the ad area
  if (!isVisible) return null;
  const allowClose = (process.env.NEXT_PUBLIC_ADMOB_ALLOW_CLOSE || 'true') !== 'false';

  return (
    <div
      className="fixed z-50 right-3 rounded-full shadow bg-card border border-border text-foreground text-xs px-3 py-1.5"
      style={{ insetBlockEnd: 'calc(var(--admob-bottom-inset, 0px) + env(safe-area-inset-bottom) + 0.5rem)' }}
      aria-live="polite"
    >
      {allowClose ? (
        canClose ? (
        <button onClick={handleClose} className="font-medium hover:opacity-80">
          Fechar anúncio
        </button>
        ) : (
          <span>Fechar anúncio em {secondsLeft}s</span>
        )
      ) : (
        <span>Anúncio: {secondsLeft}s</span>
      )}
    </div>
  );
}
