// Cross-platform haptics wrapper
// - Simplified to use navigator.vibrate fallback only.
// - Rationale: Avoids bundler resolution errors for '@capacitor/haptics' in web/dev
//   (Capacitor Haptics plugin is not installed for this project version).

export type Impact = 'light' | 'medium' | 'heavy';
export type Notification = 'success' | 'warning' | 'error';

function vibrateFallback(ms: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { (navigator as any).vibrate(ms); } catch { /* ignore */ }
  }
}

export async function hapticImpact(style: Impact = 'light') {
  // Fallback-only patterns per style
  const pattern = style === 'heavy' ? [60] : style === 'medium' ? [40] : [20];
  vibrateFallback(pattern);
}

export async function hapticNotification(type: Notification = 'success') {
  // Fallback-only simple buzz pattern
  const pattern = type === 'error' ? [30, 50, 30] : type === 'warning' ? [30, 30] : [20, 20];
  vibrateFallback(pattern);
}
