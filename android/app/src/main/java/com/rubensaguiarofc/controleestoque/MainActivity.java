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
	private static final int PERMISSIONS_REQUEST_CODE = 1000;
	private static final int CAMERA_PERMISSION_REQUEST = 1001;
	private static final int STORAGE_PERMISSION_REQUEST = 1002;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		// Após a Splash (Theme.SplashScreen), aplicar o tema principal sem ActionBar
		setTheme(R.style.AppTheme_NoActionBar);
		super.onCreate(savedInstanceState);

		// Register native plugins (explicit)
		registerPlugin(DocumentPicker.class);
		registerPlugin(MediaStoreSaver.class);
		registerPlugin(AppSettings.class);

		// Request camera and media permissions at startup
		requestCameraPermission();

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

	/**
	 * Request camera and media permissions at startup
	 * - Camera: for QR code scanning
	 * - Media: for accessing images, videos, and audio files (Android 13+)
	 * Note: DocumentPicker uses Storage Access Framework (SAF) for documents
	 */
	private void requestCameraPermission() {
		android.util.Log.d("MainActivity", "Android SDK Version: " + android.os.Build.VERSION.SDK_INT);
		
		List<String> permissionsNeeded = new ArrayList<>();
		
		// Camera permission for QR code scanning
		if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
			!= android.content.pm.PackageManager.PERMISSION_GRANTED) {
			permissionsNeeded.add(Manifest.permission.CAMERA);
		}
		
		// Media permissions for Android 13+ (API 33+)
		if (android.os.Build.VERSION.SDK_INT >= 33) {
			if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) 
				!= android.content.pm.PackageManager.PERMISSION_GRANTED) {
				permissionsNeeded.add(Manifest.permission.READ_MEDIA_IMAGES);
			}
			if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) 
				!= android.content.pm.PackageManager.PERMISSION_GRANTED) {
				permissionsNeeded.add(Manifest.permission.READ_MEDIA_VIDEO);
			}
			if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) 
				!= android.content.pm.PackageManager.PERMISSION_GRANTED) {
				permissionsNeeded.add(Manifest.permission.READ_MEDIA_AUDIO);
			}
		} else {
			// For Android 12 and below, use READ_EXTERNAL_STORAGE
			if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) 
				!= android.content.pm.PackageManager.PERMISSION_GRANTED) {
				permissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
			}
		}
		
		if (!permissionsNeeded.isEmpty()) {
			android.util.Log.d("MainActivity", "Requesting permissions: " + permissionsNeeded);
			ActivityCompat.requestPermissions(this, 
				permissionsNeeded.toArray(new String[0]), 
				PERMISSIONS_REQUEST_CODE);
		} else {
			android.util.Log.d("MainActivity", "All permissions already granted");
		}
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);
		
		if (requestCode == PERMISSIONS_REQUEST_CODE || requestCode == CAMERA_PERMISSION_REQUEST) {
			boolean cameraGranted = false;
			if (grantResults != null && grantResults.length > 0) {
				// Check if at least camera permission was granted
				for (int i = 0; i < permissions.length; i++) {
					if (permissions[i].equals(Manifest.permission.CAMERA) && 
						grantResults[i] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
						cameraGranted = true;
						break;
					}
				}
			}
			
			// Log all permission results
			StringBuilder resultLog = new StringBuilder("Permission results: ");
			if (permissions != null && grantResults != null) {
				for (int i = 0; i < permissions.length && i < grantResults.length; i++) {
					resultLog.append(permissions[i])
						.append("=")
						.append(grantResults[i] == android.content.pm.PackageManager.PERMISSION_GRANTED ? "GRANTED" : "DENIED")
						.append("; ");
				}
			}
			android.util.Log.d("MainActivity", resultLog.toString());
			
			try {
				if (this.bridge != null && this.bridge.getWebView() != null) {
					// If the camera permission was granted, reload to enable QR scanning
					if (cameraGranted) {
						this.bridge.getWebView().post(() -> {
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