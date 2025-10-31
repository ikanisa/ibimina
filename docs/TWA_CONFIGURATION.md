# Android Trusted Web Activity (TWA) Configuration

This document describes how to configure and deploy the SACCO+ client app as an
Android Trusted Web Activity (TWA) using Bubblewrap.

## What is a Trusted Web Activity?

A Trusted Web Activity (TWA) is a way to open your Progressive Web App (PWA) in
a full-screen Android activity without any browser UI. It provides a native app
experience while using web technologies.

### Benefits

- **Native Feel**: Full-screen, no browser UI
- **Easy Updates**: Update web content without app store review
- **Smaller Package**: No embedded browser engine
- **Instant Loading**: Leverages browser cache
- **Web Features**: Access to all PWA capabilities

## Prerequisites

- Node.js 20+ and npm/pnpm installed
- Android SDK and build tools
- Java Development Kit (JDK) 11 or higher
- Bubblewrap CLI tool
- Valid SSL certificate for your domain
- Google Play Console account (for production)

## Installation

### 1. Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

### 2. Verify Installation

```bash
bubblewrap help
```

## Initial Setup

### 1. Initialize TWA Project

From the `infra/twa/client` directory:

```bash
cd infra/twa/client
bubblewrap init --manifest https://your-domain.com/manifest.json
```

Follow the prompts to configure:

- **Application Name**: SACCO+ Client
- **Package Name**: `rw.gov.ikanisa.ibimina.client`
- **Host**: `your-domain.com`
- **Start URL**: `/`
- **Theme Color**: From manifest.json
- **Background Color**: From manifest.json
- **Icon URL**: From manifest.json
- **Enable Notifications**: Yes

### 2. Configure twa-manifest.json

The generated `twa-manifest.json` should look like:

```json
{
  "packageId": "rw.gov.ikanisa.ibimina.client",
  "host": "your-domain.com",
  "name": "SACCO+ Client",
  "launcherName": "SACCO+",
  "display": "standalone",
  "themeColor": "#16a34a",
  "backgroundColor": "#ffffff",
  "startUrl": "/",
  "iconUrl": "https://your-domain.com/icons/icon-512x512.png",
  "maskableIconUrl": "https://your-domain.com/icons/maskable-icon-512x512.png",
  "splashScreenFadeOutDuration": 300,
  "enableNotifications": true,
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false,
  "orientation": "portrait",
  "navigationColor": "#16a34a",
  "navigationColorDark": "#15803d",
  "navigationDividerColor": "#e5e7eb",
  "navigationDividerColorDark": "#374151",
  "signing": {
    "keystore": "./android.keystore",
    "alias": "sacco-client-key",
    "file": "./android.keystore"
  },
  "appVersion": "1",
  "appVersionCode": 1,
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "url": "/dashboard",
      "icon": "https://your-domain.com/icons/shortcut-dashboard.png"
    },
    {
      "name": "Payments",
      "short_name": "Payments",
      "url": "/payments",
      "icon": "https://your-domain.com/icons/shortcut-payments.png"
    }
  ],
  "generatorApp": "bubblewrap-cli",
  "webManifestUrl": "https://your-domain.com/manifest.json",
  "fallbackType": "customtabs",
  "features": {
    "locationDelegation": {
      "enabled": false
    },
    "playBilling": {
      "enabled": false
    }
  },
  "alphaDependencies": {
    "enabled": false
  },
  "minSdkVersion": 19,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "sacco-client-key"
  }
}
```

## Digital Asset Links (assetlinks.json)

### 1. Generate Signing Key

Create a keystore for signing your app:

```bash
keytool -genkey -v -keystore android.keystore \
  -alias sacco-client-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass your-store-password \
  -keypass your-key-password \
  -dname "CN=SACCO+, OU=IT, O=Ikanisa, L=Kigali, ST=Kigali, C=RW"
```

**IMPORTANT**: Store the keystore and passwords securely. You'll need them for
all future updates.

### 2. Extract Certificate Fingerprint

```bash
keytool -list -v -keystore android.keystore -alias sacco-client-key -storepass your-store-password | grep SHA256
```

Output will be like:

```
SHA256: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90
```

### 3. Format for assetlinks.json

Remove colons and convert to uppercase:

```bash
# Original
AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90

# Formatted for assetlinks.json
ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890
```

### 4. Update assetlinks.json

Edit `apps/client/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "rw.gov.ikanisa.ibimina.client",
      "sha256_cert_fingerprints": [
        "ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890"
      ]
    }
  }
]
```

### 5. Deploy and Verify

Deploy the updated `assetlinks.json` to your production server at:

```
https://your-domain.com/.well-known/assetlinks.json
```

Verify it's accessible:

```bash
curl https://your-domain.com/.well-known/assetlinks.json
```

Verify with Google's tool:

```
https://developers.google.com/digital-asset-links/tools/generator
```

## Building the APK/AAB

### Development Build (APK)

```bash
cd infra/twa/client
bubblewrap build
```

This creates: `app-release-unsigned.apk`

### Production Build (AAB)

For Google Play Store:

```bash
bubblewrap build --skipPwaValidation
```

This creates: `app-release-signed.aab`

### Build Script

Use the provided build script:

```bash
cd infra/twa/client
./build.sh
```

## Testing

### 1. Install on Device

```bash
# Via USB
adb install app-release-unsigned.apk

# Or upload to device and install manually
```

### 2. Verify TWA Connection

When you open the app:

1. It should open in full-screen (no browser UI)
2. Check Chrome DevTools: `chrome://inspect`
3. Verify domain verification:
   ```bash
   adb shell pm get-app-links rw.gov.ikanisa.ibimina.client
   ```

### 3. Test Offline Functionality

1. Open the app
2. Navigate through pages
3. Enable airplane mode
4. Verify cached pages still work

### 4. Test Notifications

1. Grant notification permission
2. Trigger a push notification
3. Verify it appears and opens correctly

## Troubleshooting

### TWA Doesn't Open (Shows Browser UI)

**Cause**: Digital Asset Links not verified

**Solution**:

1. Verify `assetlinks.json` is accessible
2. Check certificate fingerprint matches
3. Wait 24 hours for Google to cache the verification
4. Clear app data and reinstall

### SSL Certificate Issues

**Cause**: Invalid or self-signed certificate

**Solution**:

- Use valid SSL certificate from trusted CA
- TWAs require HTTPS with valid certificate
- Let's Encrypt certificates work fine

### App Crashes on Startup

**Cause**: Manifest validation failed

**Solution**:

1. Check `manifest.json` is valid JSON
2. Verify all URLs are absolute and accessible
3. Ensure icons exist and are correct size
4. Check browser console for errors

### Notifications Not Working

**Cause**: Web Push not configured

**Solution**:

1. Verify VAPID keys configured
2. Check notification permission granted
3. Test with Chrome first (before TWA)

## Google Play Store Submission

### 1. Prepare Store Listing

Required assets:

- High-res icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2)
- Privacy policy URL
- App description

### 2. Version Management

Update version in `twa-manifest.json`:

```json
{
  "appVersion": "1.0.0",
  "appVersionCode": 1
}
```

Increment `appVersionCode` for each release.

### 3. Upload AAB

1. Go to Google Play Console
2. Create new app or select existing
3. Navigate to Release → Production
4. Upload `app-release-signed.aab`
5. Complete store listing
6. Submit for review

### 4. Post-Submission

- Review typically takes 1-3 days
- Monitor for rejection reasons
- Respond promptly to review feedback

## Updating the App

### Web Content Updates

Web updates are instant:

1. Deploy updated web app
2. Users get updates on next app launch
3. No app store review needed

### Native Updates (Requires Store Submission)

Update when changing:

- Package name
- Permissions
- Icons
- App name
- Start URL
- TWA configuration

Process:

```bash
# Update twa-manifest.json version
# Rebuild
bubblewrap build
# Upload new AAB to Play Store
```

## PWA Requirements for TWA

### Manifest Requirements

✅ Required fields:

- `name`
- `short_name`
- `start_url`
- `display: "standalone"` or `"fullscreen"`
- `icons` (192x192 and 512x512)
- `theme_color`
- `background_color`

### Service Worker

✅ Required:

- Service worker registered
- Responds to fetch events
- Caches critical resources

### HTTPS

✅ Required:

- Valid SSL certificate
- All resources served over HTTPS

## Performance Optimization

### Reduce App Size

1. **Optimize Icons**: Use compressed PNG or WebP
2. **Minimize Manifest**: Remove unused shortcuts
3. **Remove Debug Info**: Use release builds

### Improve Startup Time

1. **Optimize First Load**: Critical CSS inline
2. **Reduce Dependencies**: Bundle size analysis
3. **Cache Strategy**: Aggressive service worker caching
4. **Splash Screen**: Use simple background color

### Network Optimization

1. **CDN**: Use CDN for static assets
2. **Compression**: Enable Brotli/Gzip
3. **HTTP/2**: Use HTTP/2 for multiplexing
4. **Prefetch**: Prefetch critical resources

## Security

### Certificate Pinning

Add to `twa-manifest.json`:

```json
{
  "certFingerprints": [
    {
      "name": "CN=your-domain.com",
      "fingerprint": "SHA-256-FINGERPRINT-HERE"
    }
  ]
}
```

### Content Security Policy

Ensure CSP headers are set on web app.

### API Security

- Use HTTPS for all API calls
- Implement proper authentication
- Validate all inputs

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build TWA

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install Bubblewrap
        run: npm install -g @bubblewrap/cli

      - name: Build AAB
        run: |
          cd infra/twa/client
          bubblewrap build --skipPwaValidation
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText:
            ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: rw.gov.ikanisa.ibimina.client
          releaseFiles: infra/twa/client/app-release-signed.aab
          track: production
```

## Resources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Overview](https://developers.google.com/web/android/trusted-web-activity)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [PWA Requirements](https://web.dev/install-criteria/)
- [Google Play Console](https://play.google.com/console)

## Checklist

Before going to production:

- [ ] Valid SSL certificate configured
- [ ] `assetlinks.json` deployed and accessible
- [ ] Certificate fingerprint matches keystore
- [ ] Keystore backed up securely
- [ ] App icons optimized (512x512 PNG)
- [ ] Splash screen configured
- [ ] Shortcuts defined (optional)
- [ ] Notifications configured (if using)
- [ ] PWA checklist complete
- [ ] Service worker caching strategy optimized
- [ ] Google Play listing completed
- [ ] Privacy policy published
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Target API level meets Play Store requirements
- [ ] App tested on multiple devices
- [ ] Offline functionality verified
