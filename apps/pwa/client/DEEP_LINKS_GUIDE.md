# Deep Links Implementation Guide

This document describes the deep link implementation for the Ibimina client app,
including Android App Links, iOS Universal Links, and custom scheme fallbacks.

## Overview

The app supports deep links through three mechanisms:

1. **Android App Links** (HTTPS, verified)
2. **iOS Universal Links** (HTTPS, verified)
3. **Custom Scheme** (ibimina://, fallback)

## Supported Deep Link Patterns

### HTTPS Links (Verified)

- `https://client.ibimina.rw/join/{groupId}` - Join a specific group
- `https://client.ibimina.rw/invite/{token}` - Accept an invite via token
- `https://client.ibimina.rw/groups/{id}` - View group details
- `https://client.ibimina.rw/pay` - Navigate to payment screen
- `https://client.ibimina.rw/statements` - Navigate to statements
- `https://client.ibimina.rw/profile` - Navigate to profile

### Custom Scheme (Fallback)

- `ibimina://join?group_id={groupId}` - Join a specific group
- `ibimina://invite?token={token}` - Accept an invite via token
- `ibimina://group?id={id}` - View group details
- `ibimina://pay` - Navigate to payment screen
- `ibimina://statements` - Navigate to statements
- `ibimina://profile` - Navigate to profile

## Android Setup

### 1. AndroidManifest.xml Configuration

The AndroidManifest.xml has been configured with deep link intent filters:

```xml
<!-- Deep Links: HTTPS App Links (verified) -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="client.ibimina.rw" />
    <data
        android:scheme="https"
        android:host="app.ibimina.rw" />
</intent-filter>

<!-- Deep Links: Custom Scheme (fallback) -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="ibimina" />
</intent-filter>
```

### 2. Digital Asset Links (assetlinks.json)

To enable Android App Links verification, you need to host a Digital Asset Links
JSON file at:

```
https://client.ibimina.rw/.well-known/assetlinks.json
```

**File Contents:**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "rw.ibimina.client",
      "sha256_cert_fingerprints": ["YOUR_APP_SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

#### Getting Your SHA-256 Fingerprint

**For Debug Build:**

```bash
cd apps/client/android
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**For Release Build:**

```bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your-key-alias
```

Copy the SHA-256 fingerprint (format: `AA:BB:CC:...`) and replace
`YOUR_APP_SHA256_FINGERPRINT_HERE` in the assetlinks.json file.

### 3. Testing Android App Links

#### Test with ADB:

```bash
# Test HTTPS link
adb shell am start -a android.intent.action.VIEW -d "https://client.ibimina.rw/join/123"

# Test custom scheme
adb shell am start -a android.intent.action.VIEW -d "ibimina://join?group_id=123"
```

#### Verify App Links Status:

```bash
# Check if App Links are verified
adb shell pm get-app-links rw.ibimina.client

# Reset App Links verification (for testing)
adb shell pm set-app-links --package rw.ibimina.client 0 all

# Manually verify App Links
adb shell pm verify-app-links --re-verify rw.ibimina.client
```

## iOS Setup

### 1. Associated Domains

In Xcode, add the Associated Domains capability to your project:

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select the App target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "Associated Domains"
5. Add domains:
   - `applinks:client.ibimina.rw`
   - `applinks:app.ibimina.rw`

### 2. Apple App Site Association (AASA)

Host an Apple App Site Association file at:

```
https://client.ibimina.rw/.well-known/apple-app-site-association
```

**File Contents:**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.rw.ibimina.client",
        "paths": [
          "/join/*",
          "/invite/*",
          "/groups/*",
          "/group/*",
          "/pay",
          "/statements",
          "/profile"
        ]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

**Important:**

- The file must be served over HTTPS
- Content-Type should be `application/json`
- No file extension (.json) should be in the URL

### 3. Info.plist Configuration (Custom Scheme)

Add custom scheme support to `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>ibimina</string>
        </array>
        <key>CFBundleURLName</key>
        <string>rw.ibimina.client</string>
    </dict>
</array>
```

### 4. Testing iOS Universal Links

#### Test with Simulator:

```bash
# Test HTTPS Universal Link
xcrun simctl openurl booted "https://client.ibimina.rw/join/123"

# Test custom scheme
xcrun simctl openurl booted "ibimina://join?group_id=123"
```

#### Test on Device:

1. Send the link via iMessage, Mail, or Notes
2. Long press the link and verify "Open in Ibimina" appears
3. Tap to open

#### Verify AASA File:

Visit in Safari:

```
https://client.ibimina.rw/.well-known/apple-app-site-association
```

Or use Apple's AASA validator:

```
https://branch.io/resources/aasa-validator/
```

## JavaScript Integration

### Basic Usage

```typescript
import {
  registerDeepLinkHandler,
  checkInitialDeepLink,
  generateDeepLink,
  type DeepLinkRoute,
} from "@/lib/deep-links";

// Register handler for incoming deep links
useEffect(() => {
  const cleanup = registerDeepLinkHandler((route: DeepLinkRoute) => {
    switch (route.type) {
      case "join":
        router.push(`/groups/join/${route.groupId}`);
        break;
      case "invite":
        router.push(`/invite/${route.token}`);
        break;
      case "group":
        router.push(`/groups/${route.id}`);
        break;
      case "pay":
        router.push("/pay");
        break;
      case "statements":
        router.push("/statements");
        break;
      case "profile":
        router.push("/profile");
        break;
    }
  });

  // Check if app was opened via deep link
  checkInitialDeepLink((route: DeepLinkRoute) => {
    // Handle initial deep link
  });

  return cleanup;
}, []);
```

### Generating Share Links

```typescript
import { generateDeepLink, generateCustomSchemeLink } from "@/lib/deep-links";

// Generate HTTPS link (preferred)
const shareLink = generateDeepLink({ type: "join", groupId: "123" });
// Returns: https://client.ibimina.rw/join/123

// Generate custom scheme link (fallback)
const customLink = generateCustomSchemeLink({ type: "join", groupId: "123" });
// Returns: ibimina://join?group_id=123
```

## Usage Examples

### Example 1: Group Invite Flow

```typescript
// Generate invite link
const inviteLink = generateDeepLink({
  type: "invite",
  token: "abc123xyz",
});

// Share via Capacitor Share API
await Share.share({
  title: "Join our savings group",
  text: "You've been invited to join our group on Ibimina",
  url: inviteLink,
  dialogTitle: "Share invite link",
});
```

### Example 2: Join Group from QR Code

```typescript
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";

// Scan QR code
const result = await BarcodeScanner.startScan();

if (result.hasContent) {
  const route = parseDeepLink(result.content);

  if (route.type === "join") {
    router.push(`/groups/join/${route.groupId}`);
  }
}
```

## Troubleshooting

### Android

**Issue:** App Links not working (opens in browser)

- **Solution:** Verify assetlinks.json is accessible and SHA-256 fingerprint
  matches
- **Check:** `adb shell pm get-app-links rw.ibimina.client`

**Issue:** Custom scheme not working

- **Solution:** Verify intent-filter in AndroidManifest.xml
- **Test:**
  `adb shell am start -a android.intent.action.VIEW -d "ibimina://home"`

### iOS

**Issue:** Universal Links not working

- **Solution:** Verify AASA file is accessible (no redirects, HTTPS only)
- **Check:** Delete app, reinstall, wait a few minutes for AASA to be fetched

**Issue:** Custom scheme not working

- **Solution:** Verify CFBundleURLTypes in Info.plist

### Both Platforms

**Issue:** Deep link handler not firing

- **Solution:** Ensure `registerDeepLinkHandler` is called early in app
  lifecycle
- **Check:** Look for console logs "Deep link received:"

## Security Considerations

1. **Validate Input:** Always validate groupId, token, and other parameters from
   deep links
2. **Authentication:** Require user to be authenticated before processing
   sensitive deep links
3. **Rate Limiting:** Implement rate limiting for invite token validation
4. **HTTPS Only:** Use HTTPS links for production; custom scheme for development
   only

## References

- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [iOS Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
- [Capacitor Deep Links Plugin](https://capacitorjs.com/docs/apis/app#deep-links)
