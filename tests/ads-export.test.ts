import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Capacitor core to simulate native platform
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
// Mock Toast to avoid native calls
vi.mock('@capacitor/toast', () => ({ Toast: { show: vi.fn(async () => {}) } }));
// Spy for interstitial
const showSpy = vi.fn(async () => {});
vi.mock('@/lib/native/ad-manager', () => ({ showShortInterstitial: showSpy }));

// Set skip seconds to 0 to avoid timers in tests
process.env.NEXT_PUBLIC_ADS_SKIP_SECONDS = '0';

describe('ads-export gating', () => {
  beforeEach(() => {
    showSpy.mockClear();
    // Simple localStorage polyfill
    const storage: Record<string, string> = {};
    (global as any).window = {
      localStorage: {
        getItem: (k: string) => (k in storage ? storage[k] : null),
        setItem: (k: string, v: string) => { storage[k] = String(v); },
        removeItem: (k: string) => { delete storage[k]; },
        clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
      }
    } as any;
    // Reset module state by re-importing between tests if needed
  });

  it('shows on first export of the day', async () => {
    const mod = await import('@/lib/ads-export');
    await mod.maybeShowAdBeforeExport();
    expect(showSpy).toHaveBeenCalledTimes(1);
  });

  it('shows on every 3rd export after the first', async () => {
    const mod = await import('@/lib/ads-export');
    await mod.maybeShowAdBeforeExport(); // 1st -> show
    showSpy.mockClear();
    await mod.maybeShowAdBeforeExport(); // 2nd -> no show
    await mod.maybeShowAdBeforeExport(); // 3rd -> show
    expect(showSpy).toHaveBeenCalledTimes(1);
  });
});
