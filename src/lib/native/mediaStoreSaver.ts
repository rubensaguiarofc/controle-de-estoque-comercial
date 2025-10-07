export async function savePdfToDownloads(base64: string, filename: string) {
  try {
    const capacitor = (window as any).Capacitor;
    if (!capacitor) throw new Error('Capacitor not available');
    const Plugins = (window as any).Capacitor.Plugins || (window as any).Plugins || {};
    const MediaStoreSaver = Plugins.MediaStoreSaver || (window as any).MediaStoreSaver;
    if (!MediaStoreSaver || typeof MediaStoreSaver.savePdfToDownloads !== 'function') {
      throw new Error('MediaStoreSaver plugin not available');
    }
    await MediaStoreSaver.savePdfToDownloads({ base64, filename });
    return true;
  } catch (e) {
    console.warn('Native MediaStore save not available:', e);
    return false;
  }
}
