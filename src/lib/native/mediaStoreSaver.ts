export async function savePdfToDownloads(base64: string, filename: string) {
  try {
    const win = typeof window !== 'undefined' ? (window as any) : undefined;
    const capacitor = win?.Capacitor;
    if (!capacitor) throw new Error('Capacitor not available');

    // Prefer official Plugins registry
    const Plugins = capacitor.Plugins || win?.Plugins || {};
    const MediaStoreSaver = Plugins.MediaStoreSaver || win?.MediaStoreSaver || win?.cordova?.plugins?.MediaStoreSaver;
    if (!MediaStoreSaver || typeof MediaStoreSaver.savePdfToDownloads !== 'function') {
      throw new Error('MediaStoreSaver plugin not available');
    }

    const res = await MediaStoreSaver.savePdfToDownloads({ base64, filename });
    // Some native implementations return an object with uri
    if (res && typeof res === 'object' && res.uri) return res.uri;
    return true;
  } catch (e) {
    console.warn('Native MediaStore save not available:', e);
    return false;
  }
}
