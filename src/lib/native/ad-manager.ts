"use client";

import { Capacitor } from "@capacitor/core";
import { AdMob, RewardAdPluginEvents, AdMobRewardItem } from "@capacitor-community/admob";

// Flag para desabilitar anúncios completamente (útil para testes)
const ADS_DISABLED = process.env.NEXT_PUBLIC_DISABLE_ADS === 'true';

const PRINTS_KEY = "admob:prints_count";
const LAST_ANY_TS = "admob:last_any_ts";
const LAST_INTERSTITIAL_TS = "admob:last_interstitial_ts";
const LAST_REWARDED_TS = "admob:last_rewarded_ts";

const PRINTS_THRESHOLD = Number(process.env.NEXT_PUBLIC_ADS_PRINTS_THRESHOLD || '5');
const COOLDOWN_MS = Number(process.env.NEXT_PUBLIC_ADS_COOLDOWN_SECONDS || '60') * 1000; // min gap between videos
const GLOBAL_MIN_MS = Number(process.env.NEXT_PUBLIC_ADS_GLOBAL_MINUTES || '0') * 60_000; // global rate limit

export function incrementPrintCounter(by: number = 1, threshold?: number): boolean {
  if (ADS_DISABLED) return false;
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

export async function showShortInterstitial(force: boolean = false) {
  if (ADS_DISABLED) return;
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!force && !canShow('interstitial')) return;
    await ensureInit();
    const adId = process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || "ca-app-pub-3940256099942544/1033173712"; // test interstitial
    await AdMob.prepareInterstitial({ adId, isTesting: !process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID });
    await AdMob.showInterstitial();
    markShown('interstitial');
  } catch (e) {
    // swallow errors (ad not available / no fill)
    console.debug("Interstitial error", e);
  }
}

export async function showLongRewarded() {
  if (ADS_DISABLED) {
    console.debug('[showLongRewarded] Ads disabled, skipping');
    return;
  }
  if (!Capacitor.isNativePlatform()) {
    console.debug('[showLongRewarded] not native platform, skipping');
    return;
  }
  
  try {
    // Verificações silenciosas em produção
    if (!Capacitor.isPluginAvailable('AdMob') || !AdMob) {
      console.debug('[showLongRewarded] AdMob plugin not available');
      return;
    }
    
    // Verificar cooldown mas NÃO bloquear (apenas logar)
    const allowed = canShow('rewarded');
    if (!allowed) {
      console.warn('[showLongRewarded] cooldown active but proceeding anyway');
      // NÃO return aqui - vamos tentar mostrar mesmo assim
    }
    
    await ensureInit();
    
    const adId = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || "ca-app-pub-3940256099942544/5224354917";
    const isTesting = !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID;

    try {
      // Explicit initialize to ensure SDK ready (Capacitor 6 sometimes needs this)
      await AdMob.initialize({ initializeForTesting: isTesting });
      console.debug('[showLongRewarded] AdMob.initialize resolved');
    } catch (initErr) {
      console.debug('[showLongRewarded] AdMob.initialize failed', initErr);
    }

    const cleanup: Array<() => void> = [];
    try {
      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        console.debug('[showLongRewarded] reward received');
      });
      cleanup.push(() => rewardListener.remove());
    } catch (listenerErr) {
      console.debug('[showLongRewarded] listener attach failed', listenerErr);
    }

    try {
      const loadListener = await AdMob.addListener(RewardAdPluginEvents.Loaded, info => {
        console.debug('[showLongRewarded] ad loaded');
      });
      cleanup.push(() => loadListener.remove());
    } catch {}

    try {
      const failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, info => {
        console.error('[showLongRewarded] ad load failed', info.code);
      });
      cleanup.push(() => failListener.remove());
    } catch {}

    try {
      const showListener = await AdMob.addListener(RewardAdPluginEvents.Showed, () => {
        console.debug('[showLongRewarded] ad showing');
      });
      cleanup.push(() => showListener.remove());
    } catch {}

    try {
      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.debug('[showLongRewarded] ad dismissed');
      });
      cleanup.push(() => dismissListener.remove());
    } catch {}
    
    // Preparar anúncio
    try {
      if (typeof (AdMob as any).prepareRewardVideoAd !== 'function') {
        throw new Error('prepareRewardVideoAd is not a function. Available methods: ' + Object.keys(AdMob).filter(k => typeof (AdMob as any)[k] === 'function').join(', '));
      }
      await (AdMob as any).prepareRewardVideoAd({ adId, isTesting });
      console.debug('[showLongRewarded] ad prepared');
    } catch (prepErr: any) {
      console.error('[showLongRewarded] prepare failed', prepErr?.code);
      throw prepErr;
    }
    
    // Mostrar anúncio
    try {
      if (typeof (AdMob as any).showRewardVideoAd !== 'function') {
        throw new Error('showRewardVideoAd is not a function. Available methods: ' + Object.keys(AdMob).filter(k => typeof (AdMob as any)[k] === 'function').join(', '));
      }
      await (AdMob as any).showRewardVideoAd();
      console.debug('[showLongRewarded] ad shown');
    } catch (showErr: any) {
      console.error('[showLongRewarded] showRewardVideoAd failed:', showErr);
      console.error('[showLongRewarded] showErr.code:', showErr?.code);
      console.error('[showLongRewarded] showErr.message:', showErr?.message);
      throw showErr;
    }
    
    console.log('[showLongRewarded] ✅ ad shown successfully!');
    markShown('rewarded');
    cleanup.forEach(fn => {
      try { fn(); } catch {}
    });
  } catch (e: any) {
    console.error("[showLongRewarded] ❌ FAILED:", e?.message || e);
    // Mostrar detalhes do erro
    if (e?.code) console.error('[showLongRewarded] error code:', e.code);
    if (e?.message) console.error('[showLongRewarded] error message:', e.message);
    try {
      const { Toast } = await import('@capacitor/toast');
      await Toast.show({ text: `Erro ao carregar vídeo: ${e?.code || e?.message || 'desconhecido'}`, duration: 'short' });
    } catch {}
  }
}

type AdKind = 'interstitial' | 'rewarded';

function canShow(kind: AdKind): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const now = Date.now();
    const lastAny = Number(window.localStorage.getItem(LAST_ANY_TS) || '0') || 0;
    const lastKind = Number(window.localStorage.getItem(kind === 'interstitial' ? LAST_INTERSTITIAL_TS : LAST_REWARDED_TS) || '0') || 0;
    
    // Se nunca mostrou, pode mostrar
    if (lastAny === 0 && lastKind === 0) {
      console.debug(`[canShow:${kind}] first time, allowing`);
      return true;
    }
    
    if (GLOBAL_MIN_MS > 0 && now - lastAny < GLOBAL_MIN_MS) {
      console.debug(`[canShow:${kind}] blocked by global cooldown (${Math.round((GLOBAL_MIN_MS - (now - lastAny)) / 1000)}s remaining)`);
      return false;
    }
    
    if (COOLDOWN_MS > 0 && now - Math.max(lastAny, lastKind) < COOLDOWN_MS) {
      console.debug(`[canShow:${kind}] blocked by cooldown (${Math.round((COOLDOWN_MS - (now - Math.max(lastAny, lastKind))) / 1000)}s remaining)`);
      return false;
    }
    
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
  
  if (_initPromise) {
    console.debug('[ensureInit] already initialized, reusing promise');
    return _initPromise;
  }
  
  console.log('[ensureInit] initializing AdMob...');
  _initPromise = (async () => {
    try {
      await AdMob.initialize();
      console.log('[ensureInit] ✅ AdMob initialized successfully');
    } catch (e: any) {
      console.warn('[ensureInit] initialize failed (may be normal):', e?.message || e);
      // Não é crítico - algumas versões não têm initialize
    }
  })();
  
  return _initPromise;
}
