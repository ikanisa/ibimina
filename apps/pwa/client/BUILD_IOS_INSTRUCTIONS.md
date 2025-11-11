# Building the Ibimina Client iOS App

## ⚠️ Important: macOS Required

**iOS apps can ONLY be built on macOS** with Xcode installed. Unlike Android,
which can be built on any platform, Apple requires macOS for iOS development.

## Prerequisites

1. **macOS** (Version 12 Monterey or later)
2. **Xcode 15+** -
   [Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
3. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
4. **CocoaPods** (for managing iOS dependencies):
   ```bash
   sudo gem install cocoapods
   ```
5. **Apple Developer Account** (free for testing, $99/year for App Store
   distribution)

## Initial Setup (One-Time)

### 1. Install Dependencies

```bash
# Navigate to the client app
cd apps/client

# Install Node dependencies (including @capacitor/ios)
pnpm install

# Add iOS platform
npx cap add ios
```

This creates the `ios/` directory with your Xcode project.

### 2. Install iOS Pods

```bash
# Navigate to iOS project
cd ios/App

# Install CocoaPods dependencies
pod install

# Go back to client root
cd ../..
```

## Building for Simulator (Testing)

### Quick Build

```bash
# From apps/client directory

# 1. Sync Capacitor (copies web assets to iOS)
npx cap sync ios

# 2. Open in Xcode
npx cap open ios

# 3. In Xcode:
# - Select any iPhone simulator from the device dropdown
# - Click the ▶️ Play button or press ⌘R
# - App will build and launch in simulator
```

### Command Line Build (Advanced)

```bash
# Build for simulator
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Building for Physical Device (Testing)

### 1. Configure Signing

1. Open Xcode: `npx cap open ios`
2. Select the **App** target in the project navigator
3. Go to **Signing & Capabilities** tab
4. **Team**: Select your Apple ID
5. **Bundle Identifier**: Change to unique ID (e.g.,
   `rw.ibimina.client.yourname`)
6. Xcode will automatically create a provisioning profile

### 2. Connect Device & Build

1. Connect your iPhone via USB
2. Select your device from the device dropdown
3. Click ▶️ to build and run
4. **First time**: On your iPhone, go to Settings → General → VPN & Device
   Management → Trust your developer certificate

## Building for App Store Distribution

### 1. Prepare App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with Bundle ID: `rw.ibimina.client`
3. Fill in app metadata (name, description, screenshots, etc.)

### 2. Configure Release Build

In Xcode:

1. Select **App** target → **Signing & Capabilities**
2. Set **Team** to your paid Apple Developer account
3. Ensure **Automatically manage signing** is checked
4. Select **Release** configuration

### 3. Archive & Submit

```bash
# 1. Build release archive
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# 2. Export IPA
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

**Or use Xcode GUI:**

1. Product → Archive
2. Wait for archive to complete
3. In Organizer window → Distribute App
4. Select App Store Connect → Upload
5. Follow the wizard

### 4. Submit for Review

1. Go to App Store Connect
2. Select your app → TestFlight or App Store
3. Submit for review
4. Wait for Apple approval (typically 1-3 days)

## Configuration

### Change Server URL

To point the app to your production server:

1. **Edit `apps/client/capacitor.config.ts`:**

```typescript
server: {
  url: "https://app.ibimina.rw",
}
```

2. **Resync:**

```bash
npx cap sync ios
```

### Update App Name

Edit `ios/App/App/Info.plist`:

```xml
<key>CFBundleDisplayName</key>
<string>Ibimina</string>
```

### Update App Icon

1. Create app icons (required sizes: 20x20 to 1024x1024)
2. Use [App Icon Generator](https://www.appicon.co/) to generate all sizes
3. Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Update Splash Screen

Edit `ios/App/App/Assets.xcassets/Splash.imageset/` with your custom splash
images.

## App Details

- **App Name**: Ibimina
- **Bundle ID**: rw.ibimina.client
- **Minimum iOS**: 13.0
- **Target iOS**: 17.0
- **Languages**: English, French, Kinyarwanda

## Permissions (Info.plist)

The app requests these permissions (already configured):

```xml
<!-- Camera - For document uploads -->
<key>NSCameraUsageDescription</key>
<string>Take photos of documents, receipts, and ID cards</string>

<!-- Location - For branch finder -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Find the nearest SACCO branch</string>

<!-- Photo Library - For uploading images -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Upload photos from your library</string>

<!-- Face ID / Touch ID -->
<key>NSFaceIDUsageDescription</key>
<string>Unlock app with Face ID or Touch ID</string>

<!-- Notifications -->
<key>NSUserNotificationsUsageDescription</key>
<string>Receive transaction alerts and important updates</string>

<!-- Contacts - For finding other members -->
<key>NSContactsUsageDescription</key>
<string>Find other members to send money</string>
```

## Troubleshooting

### "No signing certificate found"

**Solution**: In Xcode → Preferences → Accounts → Add your Apple ID

### "Untrusted Developer" on device

**Solution**: On iPhone → Settings → General → VPN & Device Management → Trust
certificate

### Pod install fails

**Solution**:

```bash
cd ios/App
pod repo update
pod install
```

### Build fails with "Command PhaseScriptExecution failed"

**Solution**: Clean build folder (Product → Clean Build Folder) or:

```bash
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### "Unable to install on device"

**Solution**:

1. Update iOS on device to latest version
2. Update Xcode to latest version
3. Check Bundle ID doesn't conflict with existing app

## Native Features Supported on iOS

All 16 Capacitor plugins work on iOS:

- ✅ Camera
- ✅ Push & Local Notifications
- ✅ Haptic Feedback (Taptic Engine)
- ✅ Face ID / Touch ID (Biometric Authentication)
- ✅ Geolocation (Core Location)
- ✅ Barcode/QR Scanner
- ✅ File System
- ✅ Network Status
- ✅ Native Sharing
- ✅ Splash Screen
- ✅ Status Bar
- ✅ Keyboard Management
- ✅ Toast Notifications
- ✅ App Lifecycle Events
- ✅ Device Information

**Note**: SMS reading is NOT supported on iOS due to platform restrictions. Use
WhatsApp OTP instead.

## Testing on Simulator vs Device

| Feature            | Simulator      | Physical Device |
| ------------------ | -------------- | --------------- |
| Camera             | ❌             | ✅              |
| Push Notifications | ❌             | ✅              |
| Face ID / Touch ID | ⚠️ (Simulated) | ✅              |
| Location           | ⚠️ (Mocked)    | ✅              |
| Haptics            | ❌             | ✅              |
| Network            | ✅             | ✅              |
| All other features | ✅             | ✅              |

**Recommendation**: Always test on a physical device before release.

## Useful Commands

```bash
# Sync Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios

# Run on device/simulator
npx cap run ios

# Update pods
cd ios/App && pod update && cd ../..

# Clean build
# In Xcode: Product → Clean Build Folder (⇧⌘K)
```

## App Store Submission Checklist

- [ ] App icons (all required sizes)
- [ ] Screenshots (6.5", 5.5" displays)
- [ ] App description & keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App category
- [ ] Age rating
- [ ] Pricing (free or paid)
- [ ] Test on multiple devices
- [ ] Fix all Xcode warnings
- [ ] Enable crash reporting
- [ ] Configure App Store Connect

## Resources

- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Support

For build issues:

- Check Xcode logs (Product → Show Build Log)
- Check
  [Capacitor iOS Troubleshooting](https://capacitorjs.com/docs/ios/troubleshooting)
- Search
  [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor+ios)

For app functionality:

- Test the Client PWA first at the server URL
- Check Safari Web Inspector for errors
- Verify server is accessible from mobile network

## License

© 2025 Ibimina. All rights reserved.
