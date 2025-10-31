# TWA (Trusted Web Activity) for Ibimina Client App

This directory contains the configuration and build scripts for packaging the
Ibimina Client web app as an Android TWA (Trusted Web Activity).

## Prerequisites

1. **Node.js** (v18+)
2. **Java JDK** (v11 or higher)
3. **Android SDK** with Build Tools
4. **Bubblewrap CLI**:
   ```bash
   npm install -g @bubblewrap/cli
   ```

## Setup

### 1. Generate Android Keystore

First, generate a keystore for signing your app:

```bash
cd infra/twa/client
keytool -genkey -v -keystore android.keystore -alias ibimina-client -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Store the keystore password securely. You'll need it for signing
builds.

### 2. Get SHA-256 Fingerprint

Extract the SHA-256 fingerprint from your keystore:

```bash
keytool -list -v -keystore android.keystore -alias ibimina-client
```

Copy the SHA-256 fingerprint and update:

- `apps/client/public/.well-known/assetlinks.json`

### 3. Initialize Bubblewrap Project

Initialize the TWA project using the manifest:

```bash
cd infra/twa/client
bubblewrap init --manifest twa-manifest.json
```

This will create the Android project structure.

## Building the APK/AAB

### Development Build (APK)

Build an unsigned APK for local testing:

```bash
bubblewrap build
```

The APK will be generated in `app/build/outputs/apk/`.

### Production Build (AAB)

Build a signed Android App Bundle for Play Store distribution:

```bash
bubblewrap build --signingKeyPath ./android.keystore --signingKeyAlias ibimina-client
```

You'll be prompted for the keystore password. The AAB will be generated in
`app/build/outputs/bundle/`.

## Testing Digital Asset Links

### Local Testing

1. Install the APK on a test device:

   ```bash
   adb install app/build/outputs/apk/app.apk
   ```

2. Launch the app and verify it opens without showing a URL bar.

### Online Testing

1. Deploy the web app with the assetlinks.json file at:

   ```
   https://client.ibimina.ikanisa.gov.rw/.well-known/assetlinks.json
   ```

2. Verify using Google's tool:

   ```
   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://client.ibimina.ikanisa.gov.rw&relation=delegate_permission/common.handle_all_urls
   ```

3. Test on a physical device:
   ```bash
   adb shell pm set-app-links --package rw.gov.ikanisa.ibimina.client 0 client.ibimina.ikanisa.gov.rw
   adb shell pm verify-app-links --re-verify rw.gov.ikanisa.ibimina.client
   adb shell pm get-app-links rw.gov.ikanisa.ibimina.client
   ```

## Configuration

### twa-manifest.json

The `twa-manifest.json` file contains all TWA configuration:

- **packageId**: Android package identifier
- **host**: Web app domain
- **name**: Full app name
- **launcherName**: Name shown on device home screen
- **themeColor**: Status bar color
- **startUrl**: Initial URL to load
- **iconUrl**: App icon URL (512x512)
- **shortcuts**: Android app shortcuts (like PWA shortcuts)

Update these values as needed for different environments (staging, production).

## Deployment

### Play Store Release

1. Build the signed AAB:

   ```bash
   bubblewrap build --signingKeyPath ./android.keystore --signingKeyAlias ibimina-client
   ```

2. Upload to Google Play Console:
   - Go to https://play.google.com/console
   - Create a new app or select existing
   - Upload the AAB from `app/build/outputs/bundle/release/app-release.aab`
   - Fill in store listing details
   - Submit for review

### Update Process

For app updates:

1. Increment `appVersionCode` and `appVersionName` in `twa-manifest.json`
2. Rebuild the app
3. Upload new AAB to Play Store

**Note**: Most content updates happen via the web app and don't require TWA
updates. Only update the TWA when changing app configuration or Android-specific
features.

## Troubleshooting

### App Opens in Chrome Instead of Standalone

- Verify assetlinks.json is accessible at `/.well-known/assetlinks.json`
- Ensure SHA-256 fingerprint matches your keystore
- Clear Chrome data and reinstall the app

### Build Errors

- Ensure Android SDK is properly configured
- Check Java version (JDK 11+ required)
- Verify Bubblewrap is up to date: `npm update -g @bubblewrap/cli`

### Digital Asset Links Not Verified

- Check the assetlinks.json syntax
- Ensure the file is served with `Content-Type: application/json`
- Verify the domain matches exactly (no trailing slashes)
- Use Google's verification tool to debug

## References

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
