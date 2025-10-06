package com.example.app;

import android.content.ContentValues;
import android.content.Context;
import android.os.Build;
import android.provider.MediaStore;
import android.net.Uri;
import android.util.Base64;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

import java.io.OutputStream;

@CapacitorPlugin(name = "MediaStoreSaver")
public class MediaStoreSaver extends Plugin {

    @PluginMethod
    public void savePdfToDownloads(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename");
        if (base64 == null || filename == null) {
            call.reject("base64 and filename are required");
            return;
        }

        try {
            Context ctx = getContext();

            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/");
            }

            Uri uri = ctx.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);

            if (uri == null) {
                call.reject("failed to create media store entry");
                return;
            }

            byte[] data = Base64.decode(base64, Base64.DEFAULT);
            OutputStream out = ctx.getContentResolver().openOutputStream(uri);
            if (out == null) {
                call.reject("failed to open output stream");
                return;
            }
            out.write(data);
            out.close();

            call.resolve();
        } catch (Exception e) {
            call.reject("error saving file: " + e.getMessage());
        }
    }
}
