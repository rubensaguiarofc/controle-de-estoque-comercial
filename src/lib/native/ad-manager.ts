"use client";

import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

const PRINTS_KEY = "admob:prints_count";
const LAST_ANY_TS = "admob:last_any_ts";
const LAST_INTERSTITIAL_TS = "admob:last_interstitial_ts";
const LAST_REWARDED_TS = "admob:last_rewarded_ts";

const PRINTS_THRESHOLD = Number(process.env.NEXT_PUBLIC_ADS_PRINTS_THRESHOLD || '5');
const COOLDOWN_MS = Number(process.env.NEXT_PUBLIC_ADS_COOLDOWN_SECONDS || '60') * 1000; // min gap between videos
const GLOBAL_MIN_MS = Number(process.env.NEXT_PUBLIC_ADS_GLOBAL_MINUTES || '0') * 60_000; // global rate limit

export function incrementPrintCounter(by: number = 1, threshold?: number): boolean {
  try {
    if (typeof window === "undefined") return false;
    const prev = Number(window.localStorage.getItem(PRINTS_KEY) || "0") || 0;
    const next = prev + Math.max(1, by);
    const th = typeof threshold === 'number' ? threshold : PRINTS_THRESHOLD;
    const should = next >= th;
    window.localStorage.setItem(PRINTS_KEY, String(should ? next - th : next));
    return should;
  } catch {
    return false;
  }
}

async function callIfExists<T extends any[]>(obj: any, names: string[], ...args: T) {
  for (const n of names) {
    const fn = (obj as any)[n];
    if (typeof fn === "function") {
      return await fn.apply(obj, args);
    }
  }
  throw new Error("No matching method found");
}

export async function showShortInterstitial(force: boolean = false) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!force && !canShow('interstitial')) return;
    // Garantir inicialização única
    await ensureInit();
    const adId = process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || "ca-app-pub-3940256099942544/1033173712"; // test interstitial
    // Prepare (varying API names across versions)
    try {
      await callIfExists(AdMob, ["prepareInterstitialAd", "prepareInterstitial"], { adId, isTesting: !process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID });
    } catch {}
    await callIfExists(AdMob, ["showInterstitialAd", "showInterstitial"]);
    markShown('interstitial');
  } catch (e) {
    // swallow errors (ad not available / no fill)
    console.debug("Interstitial error", e);
  }
}

export async function showLongRewarded() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!canShow('rewarded')) return;
    await ensureInit();
    const adId = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || "ca-app-pub-3940256099942544/5224354917"; // test rewarded
    try {
      await callIfExists(AdMob, ["prepareRewardAd", "prepareRewardVideoAd", "prepareRewardedAd", "prepareRewardedVideoAd"], { adId, isTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID });
    } catch {}
    await callIfExists(AdMob, ["showRewardAd", "showRewardVideoAd", "showRewardedAd", "showRewardedVideoAd"]);
    markShown('rewarded');
  } catch (e) {
    console.debug("Rewarded error", e);
  }
}

type AdKind = 'interstitial' | 'rewarded';

function canShow(kind: AdKind): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const now = Date.now();
    const lastAny = Number(window.localStorage.getItem(LAST_ANY_TS) || '0') || 0;
    const lastKind = Number(window.localStorage.getItem(kind === 'interstitial' ? LAST_INTERSTITIAL_TS : LAST_REWARDED_TS) || '0') || 0;
    if (GLOBAL_MIN_MS > 0 && now - lastAny < GLOBAL_MIN_MS) return false;
    if (COOLDOWN_MS > 0 && now - Math.max(lastAny, lastKind) < COOLDOWN_MS) return false;
    return true;
  } catch {
    return true;
  }
}

function markShown(kind: AdKind) {
  try {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    window.localStorage.setItem(LAST_ANY_TS, String(now));
    window.localStorage.setItem(kind === 'interstitial' ? LAST_INTERSTITIAL_TS : LAST_REWARDED_TS, String(now));
  } catch {}
}

export function canShowShortInterstitial(): boolean {
  try {
    if (!Capacitor.isNativePlatform()) return false;
    return canShow('interstitial');
  } catch {
    return false;
  }
}

let _initPromise: Promise<void> | null = null;
async function ensureInit() {
  if (!Capacitor.isNativePlatform()) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      // In some versions initialize() may not exist, so we swallow errors.
      await callIfExists(AdMob, ["initialize"]);
    } catch (e) {
      console.debug('[ad-manager] initialize skipped', e);
    }
  })();
  return _initPromise;
}
