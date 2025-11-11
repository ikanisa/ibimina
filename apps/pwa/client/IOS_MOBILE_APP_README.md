# Ibimina Client Mobile App (iOS)

## ✅ Project Status: Ready to Build (Requires macOS)

The iOS mobile app for members is **fully configured and ready to build on
macOS**. The Capacitor iOS project can be generated and built with Xcode.

## 📱 App Configuration

- **App Name**: Ibimina
- **Bundle ID**: `rw.ibimina.client`
- **Platform**: iOS
- **Minimum iOS**: 13.0
- **Target iOS**: 17.0
- **Current Server**:
  `https://4095a3b5-fbd8-407c-bbf4-c6a12f21341e-00-2ss8fo7up7zir.kirk.replit.dev`

## ⚠️ macOS Required

**iOS apps can ONLY be built on macOS with Xcode.** This is an Apple
requirement.

### Why macOS?

- Xcode (Apple's IDE) only runs on macOS
- iOS SDK and simulators require macOS
- Code signing and provisioning requires macOS tools
- App Store submission must be done from macOS

### Alternatives if You Don't Have a Mac:

1. **Cloud Mac Services** (Rent macOS by the hour):
   - [MacinCloud](https://www.macincloud.com) - $1/hour
   - [MacStadium](https://www.macstadium.com) - Dedicated Mac hosting
2. **CI/CD Services** (Automated builds):
   - [Codemagic](https://codemagic.io) - Free tier for iOS builds
   - [GitHub Actions](https://github.com/features/actions) - macOS runners
     available
   - [Bitrise](https://bitrise.io) - Free tier available

## 🎯 What's Included

### Native Features (15 iOS Plugins)

- ✅ **Camera** - Document uploads, receipts
- ✅ **Push Notifications** - APNs (Apple Push Notification service)
- ✅ **Local Notifications** - Offline reminders
- ✅ **Haptic Feedback** - Taptic Engine feedback
- ✅ **Face ID / Touch ID** - Biometric authentication
- ✅ **Geolocation** - GPS for branch finder
- ✅ **Barcode Scanner** - QR code payments
- ✅ **File System** - Document storage
- ✅ **Network** - Connectivity status
- ✅ **Share** - Native iOS share sheet
- ✅ **Splash Screen** - Launch screen
- ✅ **Status Bar** - iOS status bar styling
- ✅ **Keyboard** - Keyboard management
- ✅ **Toast** - Native alerts
- ✅ **Device** - Device information

### iOS-Specific Features

- 🍎 **Face ID / Touch ID** - Native biometric authentication
- 🎨 **Taptic Engine** - Advanced haptic feedback
- 📱 **iOS Share Sheet** - System-wide sharing
- 🔔 **APNs** - Apple Push Notifications
- 🎯 **iOS Permissions** - Privacy-focused permission system
- 📲 **Universal Links** - Deep linking support
- 🌙 **Dark Mode** - Automatic iOS dark mode

### Not Supported on iOS

- ❌ **SMS Reading** - iOS doesn't allow apps to read SMS (security)
  - **Alternative**: WhatsApp OTP is already implemented
- ❌ **Background Service** - iOS restricts background execution
  - **Alternative**: Background fetch & push notifications

## 🏗️ Building Options

### Option 1: Local Build on macOS (Recommended)

**Best for**: Full control, testing, development

See [BUILD_IOS_INSTRUCTIONS.md](./BUILD_IOS_INSTRUCTIONS.md) for detailed steps.

**Quick Start (on macOS):**

```bash
# 1. Install dependencies
pnpm install

# 2. Add iOS platform
cd apps/client
npx cap add ios

# 3. Install CocoaPods
cd ios/App
pod install
cd ../..

# 4. Open in Xcode
npx cap open ios

# 5. Select simulator and click ▶️ Run
```

### Option 2: Cloud Mac Service

**Best for**: No Mac available, occasional builds

1. Rent Mac from MacinCloud or similar service
2. Clone your repository
3. Follow Option 1 steps above
4. Download .ipa file

### Option 3: GitHub Actions (Automated)

**Best for**: CI/CD, automated App Store uploads

We've created `.github/workflows/build-ios-client-app.yml` for you.

**To use:**

1. Push code to GitHub
2. Go to Actions tab
3. Run "Build Client iOS App" workflow
4. Download .app or .ipa from Artifacts

**Note**: Requires macOS runner (costs GitHub Actions minutes)

## 📂 Project Structure (After Setup)

```
apps/client/
├── ios/                        # iOS project (created by cap add ios)
│   ├── App/
│   │   ├── App.xcworkspace    # Xcode workspace (OPEN THIS)
│   │   ├── App.xcodeproj      # Xcode project
│   │   ├── Podfile            # CocoaPods dependencies
│   │   ├── App/
│   │   │   ├── Info.plist     # App permissions & config
│   │   │   ├── Assets.xcassets # Icons, splash screens
│   │   │   └── public/        # Web assets (synced from .next-static)
│   │   └── Pods/              # Installed pods
├── .next-static/              # Web assets for Capacitor
│   └── index.html            # Entry point (redirects to server)
├── capacitor.config.ts       # Capacitor configuration
├── BUILD_IOS_INSTRUCTIONS.md # Detailed build guide
└── IOS_MOBILE_APP_README.md  # This file
```

## 🔧 Configuration

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

1. Create app icons (1024x1024 PNG required)
2. Use [App Icon Generator](https://www.appicon.co/)
3. Replace in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Customize Theme Colors

iOS automatically uses your app's primary color. Update in
`capacitor.config.ts`:

```typescript
ios: {
  backgroundColor: "#0066FF", // Atlas Blue
}
```

## 🔐 Permissions Explained

All permissions are already configured in `Info.plist`:

### Core Banking Features

- **Camera** - Upload ID documents, receipts, profile pictures
- **Photo Library** - Select images from gallery
- **Location** - Find nearest SACCO branch, fraud detection
- **Face ID / Touch ID** - Biometric authentication
- **Notifications** - Transaction alerts, loan approvals
- **Contacts** - Find other members to send money

### Privacy First

iOS requires explicit permission descriptions. Users must approve each
permission before use.

## 🚀 Development Workflow

### 1. Make Code Changes

```bash
# Edit your Next.js app
code apps/client/app/
```

### 2. Sync to iOS

```bash
cd apps/client
npx cap sync ios
```

### 3. Test in Xcode

```bash
npx cap open ios
# Click ▶️ Run in Xcode
```

### 4. Debug

- Use Safari Web Inspector (Develop → Simulator → localhost)
- Check Xcode console for native logs
- Use Capacitor DevTools

## 📱 Testing

### Simulator vs Physical Device

**Simulator (Quick Testing):**

```bash
# Open in Xcode
npx cap open ios

# Select iPhone simulator
# Click ▶️ Run
```

**Physical Device (Full Testing):**

1. Connect iPhone via USB
2. In Xcode → Select your device
3. Configure signing (Signing & Capabilities)
4. Trust developer cert on device (Settings → General → VPN & Device Management)
5. Run from Xcode

### What Works Where

| Feature                 | Simulator      | Physical Device |
| ----------------------- | -------------- | --------------- |
| Camera                  | ❌             | ✅              |
| Push Notifications      | ❌             | ✅              |
| Face ID / Touch ID      | ⚠️ (Simulated) | ✅              |
| Location                | ⚠️ (Mocked)    | ✅              |
| Haptics (Taptic Engine) | ❌             | ✅              |
| All other features      | ✅             | ✅              |

**Always test on a real device before App Store submission.**

## 🎯 Member-Focused Features

- 💰 **Wallet Management** - Balance, transactions, statements
- 📊 **Loan Applications** - Apply, track, and manage loans
- 👥 **Group Savings** - Join groups, contribute, track progress
- 💳 **Mobile Money** - MTN, Airtel integration
- 📱 **WhatsApp OTP** - Passwordless authentication (iOS doesn't allow SMS
  reading)
- 🌍 **Multi-Language** - English, French, Kinyarwanda
- 📵 **Offline Support** - Works without internet
- 🔒 **Face ID / Touch ID** - Native biometric security
- 📈 **Real-time Updates** - Live balance & transaction updates
- 🔍 **QR Scanning** - Quick payments via QR codes
- 📍 **Branch Finder** - Locate nearest SACCO branch

## 🚀 App Store Submission

### Requirements

1. **Apple Developer Account** - $99/year
2. **App Icons** - All required sizes
3. **Screenshots** - 6.5" and 5.5" displays
4. **Privacy Policy** - Required URL
5. **App Description** - Localized content
6. **Age Rating** - Complete questionnaire

### Steps

1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Configure app metadata
3. Archive app in Xcode (Product → Archive)
4. Upload to App Store Connect
5. Submit for review
6. Wait for approval (1-3 days typically)

See [BUILD_IOS_INSTRUCTIONS.md](./BUILD_IOS_INSTRUCTIONS.md) for detailed steps.

## 🔐 Security Notes

- ✅ HTTPS enforced for all server connections
- ✅ Face ID / Touch ID for biometric authentication
- ✅ iOS Keychain for secure storage
- ✅ App Transport Security (ATS) enabled
- ✅ Certificate pinning ready
- ⚠️ TestFlight builds expire after 90 days
- ⚠️ Always use paid Apple Developer account for production

## 🐛 Troubleshooting

### "iOS platform not found"

```bash
cd apps/client
pnpm install
npx cap add ios
```

### "Pod install failed"

```bash
cd ios/App
pod repo update
pod install
```

### "No signing certificate"

- Add your Apple ID in Xcode → Preferences → Accounts
- Select your team in Signing & Capabilities

### "Untrusted Developer" on device

- Settings → General → VPN & Device Management → Trust certificate

### Build fails in Xcode

- Product → Clean Build Folder (⇧⌘K)
- Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Restart Xcode

## 📞 Support

For build issues:

- Check [BUILD_IOS_INSTRUCTIONS.md](./BUILD_IOS_INSTRUCTIONS.md)
- See [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- Check Xcode build logs

For app functionality:

- Test the Client PWA first at the server URL
- Check Safari Web Inspector for errors
- Verify server is accessible from mobile network

## 🎓 Learning Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Swift & iOS Development](https://developer.apple.com/tutorials/swiftui/)

## 📄 License

© 2025 Ibimina. All rights reserved.
