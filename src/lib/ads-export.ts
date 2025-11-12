"use client";

import { Capacitor } from '@capacitor/core';
import { showLongRewarded } from '@/lib/native/ad-manager';
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
 * Decide e exibir (se necessário) um vídeo rewarded antes de exportar.
 * Regras:
 *  - 1ª exportação do dia: exibe
 *  - Depois, a cada 3 exportações (3ª, 6ª, 9ª...): exibe
 *  - Vídeo com recompensa (rewarded)
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
    
    if (!shouldShow) {
      console.debug(`[ads-export] skip (export #${next})`);
      return;
    }

    console.debug(`[ads-export] attempting rewarded video (export #${next})`);
    
    try {
      try { await Toast.show({ text: 'Mostrando vídeo com recompensa…', duration: 'short' }); } catch {}
      await showLongRewarded();
    } catch (e) {
      console.error('[ads-export] rewarded video error:', e);
      try { await Toast.show({ text: 'Vídeo não disponível no momento', duration: 'short' }); } catch {}
    }
  } catch {}
}