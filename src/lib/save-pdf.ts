// Utility to save jsPDF documents: browser fallback + Capacitor Filesystem for native
import type jsPDF from 'jspdf';
import { savePdfToDownloads } from './native/mediaStoreSaver';

export async function savePdf(doc: any, filename: string) {
  // If running in a Capacitor native container, try to write to filesystem
  try {
    const win = typeof window !== 'undefined' ? (window as any) : undefined;
    if (win && win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform()) {
      try {
        // generate base64 data from jsPDF
        const data = doc.output('datauristring'); // data:[mime];base64,.....
        // strip prefix
        const base64 = data.split(',')[1];

        // Prefer native MediaStore approach (works on Android 13+ scoped storage)
        try {
          const nativeSaved = await savePdfToDownloads(base64, filename);
          if (nativeSaved) return { success: true };
        } catch (e) {
          // continue to other strategies
          console.warn('mediaStoreSaver failed or not available', e);
        }

        // dynamic import to avoid bundling capacitor on web
        const cap = await import('@capacitor/filesystem');
        const { Filesystem, Directory } = cap;

        // try to request Android storage permission if available
        try {
          const capCore = await import('@capacitor/core').catch(() => null);
          const Plugins = (capCore as any)?.Plugins || (win.Capacitor && (win.Capacitor as any).Plugins) || (win as any).Plugins;
          const Permissions = Plugins?.Permissions;
          if (Permissions && Permissions.request) {
            // Try common permission names; some Capacitor versions/platforms accept different values
            try {
              // android specific
              await Permissions.request({ name: 'android.permission.WRITE_EXTERNAL_STORAGE' });
            } catch (e) {
              try { await Permissions.request({ name: 'storage' }); } catch (_e) { /* ignore */ }
            }
          }
        } catch (permErr) {
          // ignore permission request errors and attempt write anyway
          console.warn('Permission request for storage failed or not available', permErr);
        }

        // write file to Documents (Android) or appropriate directory
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });

        // try to open/share the file
        try {
          const share = await import('@capacitor/share');
          await share.Share.share({ title: filename, text: 'Arquivo PDF gerado', url: result.uri });
        } catch (shareErr) {
          // ignore share errors, file is still written
          console.warn('Share plugin not available or failed', shareErr);
        }

        return { success: true, uri: result.uri };
      } catch (e) {
        console.warn('Capacitor Filesystem/save failed, falling back to browser download', e);
        // fallthrough to web
      }
    }
  } catch (e) {
    // ignore
    console.warn('error checking Capacitor', e);
  }

  // Web fallback
  try {
    doc.save(filename);
    return { success: true };
  } catch (e) {
    console.error('Failed to save PDF in web fallback', e);
    return { success: false, error: e };
  }
}
