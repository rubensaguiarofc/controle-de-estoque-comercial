package com.rubensaguiarofc.controleestoque;

import android.Manifest;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.content.ContextCompat;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
	private static final int CAMERA_PERMISSION_REQUEST = 1001;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		// Após a Splash (Theme.SplashScreen), aplicar o tema principal sem ActionBar
		setTheme(R.style.AppTheme_NoActionBar);
		super.onCreate(savedInstanceState);

		// Register native plugins (explicit)
		registerPlugin(MediaStoreSaver.class);

		// Ensure the WebView will grant permission requests (getUserMedia) when compatible
		try {
			if (this.bridge != null && this.bridge.getWebView() != null) {
				this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
					@Override
					public void onPermissionRequest(final PermissionRequest request) {
						// Check camera permission at runtime; if not granted ask for it
						String[] requested = request.getResources();
						boolean needsCamera = false;
						for (String r : requested) {
							if (r.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
								needsCamera = true;
								break;
							}
						}

						if (needsCamera) {
							if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
								request.grant(request.getResources());
							} else {
								// Ask for camera permission; grant will be attempted after user response
								ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST);
								// keep request pending; we will grant in onRequestPermissionsResult if approved
								// For now do not call request.deny() so the web layer waits
							}
						} else {
							// For other resources, just grant
							request.grant(request.getResources());
						}
					}
				});
			}
		} catch (Exception e) {
			// ignore if WebView or bridge not accessible at this time
		}
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);
		if (requestCode == CAMERA_PERMISSION_REQUEST) {
			boolean granted = false;
			if (grantResults != null && grantResults.length > 0) {
				granted = grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED;
			}
			try {
				if (this.bridge != null && this.bridge.getWebView() != null) {
					// If the permission was granted, inject a small JS to notify the page (optional)
					if (granted) {
						this.bridge.getWebView().post(() -> {
							// resume any pending permission handling in web page; webview will retry getUserMedia
							this.bridge.getWebView().reload();
						});
					}
				}
			} catch (Exception e) {
				// ignore
			}
		}
	}
}