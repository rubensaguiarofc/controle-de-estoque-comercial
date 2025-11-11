package com.rubensaguiarofc.controleestoque;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.webkit.MimeTypeMap;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.activity.result.ActivityResult;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "DocumentPicker")
public class DocumentPicker extends Plugin {

    private static final int REQUEST_CODE = 9101;

    @PluginMethod
    public void pickFile(PluginCall call) {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
            String type = "*/*";
            JSArray arr = call.getArray("mimeTypes");
            if (arr != null && arr.length() > 0) {
                // Use generic type and put specifics in EXTRA_MIME_TYPES
                type = "*/*";
                ArrayList<String> mimes = new ArrayList<>();
                for (int i = 0; i < arr.length(); i++) {
                    mimes.add(arr.getString(i));
                }
                intent.setType(type);
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimes.toArray(new String[0]));
            } else {
                intent.setType(type);
            }
            // Persistable permission to access selected document later if needed
            intent.putExtra(Intent.EXTRA_LOCAL_ONLY, false);

            // Attempt to hint opening in Downloads when requested (Android 8+ may ignore; best-effort)
            try {
                boolean openDownloads = call.getBoolean("openDownloads", false);
                if (openDownloads) {
                    // Common primary Downloads folder path
                    Uri downloadsUri = Uri.parse("content://com.android.externalstorage.documents/document/primary:Download");
                    intent.putExtra("android.provider.extra.INITIAL_URI", downloadsUri);
                }
            } catch (Exception ignored) {}
            // save call to be used in callback
            saveCall(call);
            startActivityForResult(call, intent, "onFilePicked");
        } catch (Exception e) {
            call.reject("failed_to_open_picker", e);
        }
    }

    @ActivityCallback
    private void onFilePicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        try {
            if (result.getResultCode() != Activity.RESULT_OK) {
                call.reject("canceled");
                return;
            }
            Intent data = result.getData();
            if (data == null) {
                call.reject("no_data");
                return;
            }
            Uri uri = data.getData();
            if (uri == null) {
                call.reject("no_uri");
                return;
            }

            // Take persistable permission if available
            final int takeFlags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            try {
                getContext().getContentResolver().takePersistableUriPermission(uri, takeFlags);
            } catch (Exception ignored) {}

            ContentResolver cr = getContext().getContentResolver();
            String mime = cr.getType(uri);
            if (mime == null) {
                String ext = MimeTypeMap.getFileExtensionFromUrl(uri.toString());
                mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            }
            String name = queryDisplayName(cr, uri);

            InputStream is = cr.openInputStream(uri);
            if (is == null) {
                call.reject("failed_to_open_stream");
                return;
            }
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] tmp = new byte[8192];
            int read;
            while ((read = is.read(tmp)) != -1) {
                buffer.write(tmp, 0, read);
            }
            is.close();
            String base64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);

            JSObject ret = new JSObject();
            ret.put("base64", base64);
            ret.put("name", name != null ? name : "");
            ret.put("mimeType", mime != null ? mime : "");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("read_failed", e);
        }
    }

    private String queryDisplayName(ContentResolver cr, Uri uri) {
        Cursor cursor = null;
        try {
            cursor = cr.query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (nameIndex >= 0) return cursor.getString(nameIndex);
            }
        } catch (Exception ignored) {
        } finally {
            if (cursor != null) cursor.close();
        }
        return null;
    }
}
