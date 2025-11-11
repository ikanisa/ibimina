# iOS App Setup Guide - Ibimina Client

This guide walks you through setting up and building the Ibimina Client iOS app using Capacitor.

## Overview

The Ibimina client app is a Progressive Web App (PWA) that can be wrapped as a native iOS app using Capacitor. The iOS implementation includes:

- Native iOS project structure (generated via Capacitor)
- Swift code for USSD handling
- iOS-specific features (biometrics, push notifications)
- Seamless integration with the Next.js web app

## Current Status

✅ **Implemented:**
- Swift USSD builder utility (`apps/client/ios/Ussd/UssdBuilder.swift`)
- Capacitor configuration (`apps/client/capacitor.config.ts`)
- iOS build scripts (`apps/client/build-ios-ipa.sh`)
- Comprehensive iOS documentation

⚠️ **Pending:**
- Full Xcode project generation (requires macOS + Xcode)
- iOS app submission to App Store
- TestFlight beta testing setup

## Prerequisites

### Required Software

1. **macOS** (Version 12 Monterey or later)
   - iOS apps can **ONLY** be built on macOS
   
2. **Xcode 15+**
   - Download from [Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
   - Includes iOS simulators and build tools

3. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

4. **CocoaPods** (iOS dependency manager)
   ```bash
   sudo gem install cocoapods
   ```

5. **Node.js 20+** and **pnpm 10.19.0**
   ```bash
   node --version  # Should be v20.x or higher
   pnpm --version  # Should be 10.19.0
   ```

### Required Accounts

1. **Apple Developer Account** (for App Store distribution)
   - Free tier: Development and testing on physical devices
   - Paid ($99/year): App Store distribution and TestFlight

## Initial Setup

### 1. Install Project Dependencies

From the monorepo root:

```bash
cd /path/to/ibimina
pnpm install --frozen-lockfile
```

### 2. Build the Next.js App

The iOS app wraps the Next.js client app, so you need to build it first:

```bash
# From monorepo root
pnpm --filter @ibimina/client build

# OR from client directory
cd apps/client
pnpm build
```

This creates the production build in `apps/client/.next/`.

### 3. Generate iOS Project

If not already generated, create the iOS platform:

```bash
cd apps/client

# Add iOS platform (creates ios/ directory with Xcode project)
npx cap add ios

# Sync web assets to iOS project
npx cap sync ios
```

This will:
- Create `ios/App/` directory with Xcode project
- Copy web assets to iOS bundle
- Configure Capacitor plugins

### 4. Install iOS Dependencies

```bash
cd ios/App
pod install
cd ../..
```

This installs iOS native dependencies (pods) defined by Capacitor plugins.

## Project Structure

After setup, your iOS directory will look like:

```
apps/client/
├── ios/
│   ├── App/
│   │   ├── App.xcodeproj          # Xcode project
│   │   ├── App.xcworkspace        # Workspace (use this, not .xcodeproj)
│   │   ├── App/
│   │   │   ├── Assets.xcassets    # App icons, launch screens
│   │   │   ├── Info.plist         # App configuration
│   │   │   └── capacitor.config.json
│   │   ├── Podfile                # CocoaPods dependencies
│   │   ├── Pods/                  # Installed pods
│   │   └── public/                # Synced web assets
│   └── Ussd/
│       └── UssdBuilder.swift      # Custom USSD utility
├── capacitor.config.ts            # Capacitor configuration
└── build-ios-ipa.sh               # IPA build script
```

## Development Workflow

### Building for Simulator

The fastest way to test on iOS:

```bash
cd apps/client

# 1. Sync latest web build
npx cap sync ios

# 2. Open in Xcode
npx cap open ios
```

In Xcode:
1. Select any iPhone simulator from the device dropdown (top left)
2. Click the ▶️ **Play** button or press **⌘R**
3. App will build and launch in the simulator

### Building for Physical Device

To test on your iPhone/iPad:

#### 1. Configure Code Signing

1. Open Xcode: `npx cap open ios`
2. Select the **App** target in the project navigator (left sidebar)
3. Go to **Signing & Capabilities** tab
4. **Automatically manage signing**: ✅ Enable
5. **Team**: Select your Apple ID
6. **Bundle Identifier**: Must be unique (e.g., `rw.ibimina.client.yourname`)

Xcode will automatically create a development provisioning profile.

#### 2. Connect Device & Build

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. Select your device from the device dropdown in Xcode
4. Click ▶️ to build and run

**First time only:** On your device, go to:
- Settings → General → VPN & Device Management
- Trust your developer certificate

### Hot Reload During Development

For faster iteration:

```bash
# Terminal 1: Run Next.js dev server
cd apps/client
pnpm dev

# Terminal 2: Update capacitor.config.ts
# Add: server: { url: 'http://YOUR_IP:5000', cleartext: true }

# Terminal 3: Sync and run
npx cap sync ios
npx cap run ios
```

The app will now load from your dev server, with hot reload support.

**Remember:** Remove the `server` config before building for production!

## Xcode Configuration

### App Icons

1. In Xcode, navigate to `App/Assets.xcassets/AppIcon.appiconset`
2. Drag and drop icon images for each size:
   - iPhone: 20pt, 29pt, 40pt, 60pt (2x and 3x)
   - iPad: 20pt, 29pt, 40pt, 76pt, 83.5pt (2x)
   - App Store: 1024pt (1x)

Use the provided icons in `apps/client/public/icons/` or generate from your logo.

### Launch Screen

1. Navigate to `App/App/LaunchScreen.storyboard`
2. Customize the launch screen in Interface Builder
3. Or replace with a static image in `Assets.xcassets/Splash`

### Capabilities

Enable iOS capabilities as needed:

1. Select **App** target → **Signing & Capabilities**
2. Click **+ Capability** to add:
   - **Push Notifications**: For push messaging
   - **Background Modes**: For background refresh
   - **Associated Domains**: For universal links
   - **Keychain Sharing**: For secure storage

### Info.plist Configuration

Important keys in `App/Info.plist`:

```xml
<key>CFBundleDisplayName</key>
<string>Ibimina</string>

<key>CFBundleVersion</key>
<string>1</string>

<key>CFBundleShortVersionString</key>
<string>1.0.0</string>

<!-- Camera permission (for OCR) -->
<key>NSCameraUsageDescription</key>
<string>Take photos of identity documents for verification</string>

<!-- Contacts permission (optional) -->
<key>NSContactsUsageDescription</key>
<string>Find friends already using Ibimina</string>

<!-- Face ID permission -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to securely log in</string>
```

## Building for Distribution

### Archive Build (IPA)

For App Store or TestFlight:

```bash
cd apps/client

# Option 1: Use the build script
./build-ios-ipa.sh

# Option 2: Manual build
npx cap sync ios
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive
```

### Export IPA

After archiving:

```bash
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

Or use Xcode:
1. **Product** → **Archive**
2. Wait for archive to complete
3. **Distribute App**
4. Choose distribution method (App Store, Ad Hoc, etc.)

### TestFlight Beta Testing

1. Archive and export for App Store
2. Upload to App Store Connect:
   ```bash
   xcrun altool --upload-app -f build/App.ipa \
     --username YOUR_APPLE_ID \
     --password APP_SPECIFIC_PASSWORD
   ```
3. In App Store Connect:
   - Add testers (email addresses)
   - Submit build for TestFlight review
   - Share TestFlight link with testers

## Common Issues

### Issue: "App.xcworkspace not found"

**Solution:**
```bash
cd apps/client/ios/App
pod install
```

### Issue: "Signing for App requires a development team"

**Solution:**
1. Open Xcode
2. Select **App** target
3. **Signing & Capabilities** → Select your Team

### Issue: "Command PhaseScriptExecution failed"

**Solution:**
```bash
# Clean and rebuild
cd apps/client
rm -rf ios/App/Pods ios/App/Podfile.lock
cd ios/App
pod install
```

### Issue: "Module 'Capacitor' not found"

**Solution:**
```bash
cd apps/client
npx cap sync ios
```

### Issue: Build succeeds but app crashes on launch

**Solution:**
1. Check Console.app for crash logs
2. Verify `capacitor.config.ts` is correct
3. Ensure web build is up to date: `pnpm build`
4. Re-sync: `npx cap sync ios`

## iOS-Specific Features

### USSD Builder (Swift)

The `UssdBuilder.swift` provides utilities for generating USSD codes:

```swift
import Foundation

// Load USSD config
let config = try JSONDecoder().decode(
  UssdConfig.self,
  from: configData
)

// Build USSD code
let request = UssdBuildRequest(
  merchantCode: "123456",
  amount: 5000,
  operatorId: "mtn-rw"
)

let payload = UssdBuilder.buildCopyPayload(
  config: config,
  request: request
)

// Use payload.code for tel: links
// Use payload.copyText for clipboard
```

### Biometric Authentication

Use Capacitor's Biometric plugin:

```typescript
import { BiometricAuth } from '@capacitor/biometric-auth';

async function authenticateWithBiometrics() {
  try {
    const result = await BiometricAuth.authenticate({
      reason: 'Log in to Ibimina',
      fallbackTitle: 'Use passcode'
    });
    
    if (result.success) {
      // Proceed with login
    }
  } catch (error) {
    // Handle error
  }
}
```

### Push Notifications

Configure push in `capacitor.config.ts`:

```typescript
{
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
}
```

Register for push in your app:

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

await PushNotifications.requestPermissions();
await PushNotifications.register();
```

## App Store Submission

### Prepare for Submission

1. **App Store Connect Setup**
   - Create app listing
   - Add screenshots (required sizes for all devices)
   - Write app description
   - Set pricing and availability

2. **App Review Information**
   - Demo account credentials (if login required)
   - Contact information
   - Notes for reviewer

3. **Privacy Policy**
   - Host privacy policy (required)
   - Add URL in App Store Connect

### Screenshots Requirements

Required screenshot sizes:
- 6.7" (iPhone 14 Pro Max): 1290 x 2796
- 6.5" (iPhone 11 Pro Max): 1242 x 2688
- 5.5" (iPhone 8 Plus): 1242 x 2208
- 12.9" iPad Pro: 2048 x 2732
- 10.5" iPad Pro: 1668 x 2224

Tip: Use Xcode's simulator to capture screenshots at correct resolutions.

### Submit for Review

1. Archive and upload build
2. Select build in App Store Connect
3. Fill in app information
4. Submit for review
5. Wait 1-3 days for Apple's review

## Continuous Integration (CI/CD)

### GitHub Actions Example

```yaml
name: iOS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm@10.19.0
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build web app
        run: pnpm --filter @ibimina/client build
      
      - name: Sync Capacitor
        run: |
          cd apps/client
          npx cap sync ios
      
      - name: Build iOS app
        run: |
          cd apps/client/ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            build
```

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode/)

## Support

For iOS-specific issues:

- Check existing documentation in `apps/client/BUILD_IOS_INSTRUCTIONS.md`
- Review Capacitor iOS issues: https://github.com/ionic-team/capacitor/issues
- Post in GitHub Discussions: https://github.com/ikanisa/ibimina/discussions

## Changelog

### Version 1.0.0 (2025-11-11)
- Initial iOS setup guide
- Xcode configuration documentation
- Build and deployment workflows
- Troubleshooting section added
