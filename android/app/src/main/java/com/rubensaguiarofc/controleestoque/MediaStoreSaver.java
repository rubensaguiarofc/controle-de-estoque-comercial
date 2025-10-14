package com.rubensaguiarofc.controleestoque;

import android.content.ContentValues;
import android.content.Context;
import android.os.Build;
import android.provider.MediaStore;
import android.net.Uri;
import android.content.ContentResolver;
import android.util.Base64;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import java.io.OutputStream;
import java.io.File;
import java.io.FileOutputStream;
import android.os.Environment;
import android.media.MediaScannerConnection;

@CapacitorPlugin(name = "MediaStoreSaver")
public class MediaStoreSaver extends Plugin {
    @PluginMethod
    public void savePdfToDownloads(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename");
        if (base64 == null || filename == null) {
            call.reject("base64 or filename missing");
            return;
        }

        try {
            byte[] data = Base64.decode(base64, Base64.DEFAULT);
            Context context = getContext();
            Uri uri = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/");
                ContentResolver resolver = context.getContentResolver();
                uri = resolver.insert(MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values);
                if (uri == null) {
                    call.reject("Failed to create MediaStore entry");
                    return;
                }
                OutputStream out = resolver.openOutputStream(uri);
                if (out == null) {
                    call.reject("Failed to open output stream");
                    return;
                }
                out.write(data);
                out.flush();
                out.close();
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) downloadsDir.mkdirs();
                File outFile = new File(downloadsDir, filename);
                FileOutputStream fos = new FileOutputStream(outFile);
                fos.write(data);
                fos.flush();
                fos.close();
                MediaScannerConnection.scanFile(context, new String[]{outFile.getAbsolutePath()}, new String[]{"application/pdf"}, null);
                uri = Uri.fromFile(outFile);
            }

            JSObject ret = new JSObject();
            ret.put("uri", uri != null ? uri.toString() : "");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Save failed: " + e.getMessage(), e);
        }
    }
}