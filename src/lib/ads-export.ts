"use client";

import { Capacitor } from '@capacitor/core';
import { showShortInterstitial } from '@/lib/native/ad-manager';
import { Toast } from '@capacitor/toast';

const DAY_KEY = 'ads:export:day';
const COUNT_KEY = 'ads:export:count';

function fmtDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Decide e exibir (se necessário) um vídeo curto antes de exportar.
 * Regras:
 *  - 1ª exportação do dia: exibe
 *  - Depois, a cada 3 exportações (3ª, 6ª, 9ª...): exibe
 *  - Sempre permite avançar após X segundos (skip)
 */
export async function maybeShowAdBeforeExport() {
  try {
    if (!Capacitor.isNativePlatform()) return; // não interromper web
    if (typeof window === 'undefined') return;

    const today = fmtDay(new Date());
    const prevDay = window.localStorage.getItem(DAY_KEY);
    if (prevDay !== today) {
      window.localStorage.setItem(DAY_KEY, today);
      window.localStorage.setItem(COUNT_KEY, '0');
    }

    const raw = Number(window.localStorage.getItem(COUNT_KEY) || '0') || 0;
    const next = raw + 1;
    // 1ª do dia OU múltiplos de 3
    const shouldShow = next === 1 || next % 3 === 0;
    window.localStorage.setItem(COUNT_KEY, String(next));
    if (!shouldShow) return;

    const skipSec = Number(process.env.NEXT_PUBLIC_ADS_SKIP_SECONDS || '5');
    try {
      try { await Toast.show({ text: 'Mostrando anúncio antes da exportação…', duration: 'short' }); } catch {}
      await Promise.race([
        showShortInterstitial(true), // força exibição mesmo se cooldown recente
        new Promise((resolve) => setTimeout(resolve, Math.max(0, skipSec) * 1000)),
      ]);
    } catch (e) {
      console.debug('[ads-export] interstitial unavailable', e);
    }
  } catch {}
}
