# Ibimina Client Mobile Apps (Android & iOS)

## ✅ Project Status: Ready to Build

The mobile apps for members are **fully configured and ready to build** on both
platforms:

- **Android**: Build on any platform (Windows, macOS, Linux)
- **iOS**: Build on macOS with Xcode only

## 📱 App Configuration

### Android

- **App Name**: Ibimina
- **Package ID**: `rw.ibimina.client`
- **Min SDK**: 22 (Android 5.1 Lollipop)
- **Target SDK**: 34 (Android 14)

### iOS

- **App Name**: Ibimina
- **Bundle ID**: `rw.ibimina.client`
- **Minimum iOS**: 13.0
- **Target iOS**: 17.0

### Server

- **Current URL**:
  `https://4095a3b5-fbd8-407c-bbf4-c6a12f21341e-00-2ss8fo7up7zir.kirk.replit.dev`
- **Easily customizable** for production

## 🎯 What's Included

### Native Plugins Installed (16 Total)

- ✅ **@capacitor/app** (7.1.0) - App lifecycle events
- ✅ **@capacitor/camera** (7.0.2) - Camera access for document uploads
- ✅ **@capacitor/device** (7.0.2) - Device information
- ✅ **@capacitor/haptics** (7.0.2) - Haptic feedback
- ✅ **@capacitor/keyboard** (7.0.3) - Keyboard management
- ✅ **@capacitor/push-notifications** (7.0.3) - Push notifications
- ✅ **@capacitor/local-notifications** (7.0.3) - Local notifications
- ✅ **@capacitor/network** (7.0.2) - Network status detection
- ✅ **@capacitor/share** (7.0.2) - Native sharing
- ✅ **@capacitor/splash-screen** (7.0.3) - Splash screen
- ✅ **@capacitor/status-bar** (7.0.3) - Status bar styling
- ✅ **@capacitor/toast** (7.0.2) - Toast notifications
- ✅ **@capacitor/filesystem** (7.1.4) - File system access
- ✅ **@capacitor/geolocation** (7.1.5) - GPS location
- ✅ **@capacitor-community/barcode-scanner** (4.0.1) - QR/barcode scanning
- ✅ **@capawesome-team/capacitor-android-foreground-service** (7.0.1) -
  Background sync

### Advanced Features

- 🔐 **Biometric Authentication** - Fingerprint & face unlock
- 📱 **SMS Integration** - OTP reading & transaction parsing
- 📞 **USSD Dialing** - Mobile money integration
- 📍 **Location Services** - Branch finder & fraud detection
- 📡 **Background Sync** - Offline-first with foreground service
- 🔔 **Notification Listener** - Auto-sync MoMo transactions
- 📸 **Advanced Camera** - CameraX with lifecycle management
- 🗺️ **Google Maps** - Branch locations
- 💼 **Work Manager** - Scheduled background tasks

## 🎨 Member-Focused Features

- 💰 **Wallet Management** - Balance, transactions, statements
- 📊 **Loan Applications** - Apply, track, and manage loans
- 👥 **Group Savings** - Join groups, contribute, track progress
- 💳 **Mobile Money** - MTN, Airtel integration with auto-sync
- 📱 **WhatsApp OTP** - Passwordless authentication
- 🌍 **Multi-Language** - English, French, Kinyarwanda
- 📵 **Offline Support** - Works without internet
- 🔒 **Secure** - Biometrics, device authentication
- 📈 **Real-time Updates** - Live balance & transaction updates

## 🏗️ Building Options

### Android Builds

#### Option 1: Local Build (5 minutes)

**Best for**: Immediate APK creation, full control

See [BUILD_APK_INSTRUCTIONS.md](./BUILD_APK_INSTRUCTIONS.md) for detailed steps.

**Quick Commands:**

```bash
cd apps/client
npx cap sync android
cd android
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

**Requirements:**

- Java JDK 17
- Android SDK (or Android Studio)

#### Option 2: GitHub Actions (Automated)

**Best for**: CI/CD, team collaboration, release automation

We've created `.github/workflows/build-android-client-apk.yml` for you.

**To use:**

1. Push code to GitHub
2. Go to Actions tab
3. Run "Build Client Android APK" workflow
4. Download APK from Artifacts

**Features:**

- ✅ Builds on every push
- ✅ Auto-uploads APK artifacts
- ✅ Creates releases for tags
- ✅ Configurable server URL
- ✅ Both debug & release builds

#### Option 3: Cloud Build Service

**Best for**: No local setup needed

Use services like:

- **Codemagic**: https://codemagic.io (Free tier available)
- **Bitrise**: https://bitrise.io (Free tier available)
- **App Center**: https://appcenter.ms (Microsoft)

Connect your repo and they'll build automatically.

---

### iOS Builds

⚠️ **macOS with Xcode required for iOS builds**

#### Option 1: Local Build on macOS (Recommended)

**Best for**: Full control, testing, development

See [BUILD_IOS_INSTRUCTIONS.md](./BUILD_IOS_INSTRUCTIONS.md) for detailed steps.

**Quick Start:**

```bash
pnpm install
cd apps/client
npx cap add ios
cd ios/App && pod install && cd ../..
npx cap open ios
# Click ▶️ in Xcode
```

#### Option 2: GitHub Actions (Automated)

**Best for**: CI/CD, TestFlight distribution

Workflow: `.github/workflows/build-ios-client-app.yml` ✅ Already created

**Features:**

- ✅ Builds on macOS runners
- ✅ Simulator builds (free)
- ✅ TestFlight uploads (requires Apple Developer account)

#### Option 3: Cloud Mac Service

**Best for**: No Mac available

Rent macOS by the hour:

- [MacinCloud](https://www.macincloud.com) - $1/hour
- [Codemagic](https://codemagic.io) - Free tier for iOS

---

## 📂 Project Structure

```
apps/client/
├── android/                    # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  # App permissions & components
│   │   │   ├── java/               # Native Android code
│   │   │   │   ├── MainActivity.java
│   │   │   │   ├── MoMoNotificationListener.java  # SMS parser
│   │   │   │   └── BootReceiver.java              # Auto-start
│   │   │   ├── res/                # App icons, splash screens
│   │   │   └── assets/
│   │   │       └── public/         # Web assets (synced from .next-static)
│   │   └── build.gradle
│   └── gradlew                     # Gradle wrapper for building
├── .next-static/                   # Web assets for Capacitor
│   └── index.html                  # Entry point (redirects to server)
├── capacitor.config.ts             # Capacitor configuration
├── BUILD_APK_INSTRUCTIONS.md       # Detailed build guide
└── CLIENT_MOBILE_APP_README.md     # This file
```

## 🔧 Configuration

### Change Server URL

To point the app to your production server:

1. **Edit `capacitor.config.ts`:**

```typescript
server: {
  url: "https://app.ibimina.rw",  // Your production URL
}
```

2. **Resync and rebuild:**

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Update App Name/Icon

1. **App Name**: Edit `android/app/src/main/res/values/strings.xml`
2. **App Icon**: Replace images in `android/app/src/main/res/mipmap-*/`
3. **Splash Screen**: Edit `android/app/src/main/res/drawable-*/splash.png`

### Customize Theme Colors

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<item name="colorPrimary">#0066FF</item>      <!-- Atlas Blue -->
<item name="colorPrimaryDark">#0052CC</item>  <!-- Atlas Blue Dark -->
<item name="colorAccent">#3385FF</item>       <!-- Atlas Blue Light -->
```

## 🔐 Permissions Explained

### Core Banking Features

- **Internet & Network** - Connect to server, check connectivity
- **SMS** - Read OTP codes, parse MoMo transaction confirmations
- **Camera** - Upload ID documents, receipts, profile pictures
- **Storage** - Save receipts, offline data

### Enhanced User Experience

- **Location** - Find nearest SACCO branch, fraud detection
- **Biometrics** - Fingerprint/face unlock for quick access
- **Notifications** - Transaction alerts, loan approvals
- **Contacts** - Find other members to send money
- **Phone State** - Device identification for security

### Advanced Features

- **Foreground Service** - Background sync when app is closed
- **Call Phone** - USSD dialing for mobile money (\*182# etc)
- **Boot Receiver** - Auto-start sync after device restart
- **Notification Listener** - Auto-parse MoMo SMS notifications

## 🚀 Next Steps

### For Development Testing

1. Build debug APK (see BUILD_APK_INSTRUCTIONS.md)
2. Install on Android device
3. Test member workflows (login, wallet, loans, groups)

### For Production Release

1. Create signing keystore
2. Configure release build in `android/app/build.gradle`
3. Build signed release APK
4. Submit to Google Play Store

See BUILD_APK_INSTRUCTIONS.md for signing instructions.

## 🔐 Security Notes

- ✅ HTTPS enforced for all server connections
- ✅ Cleartext traffic disabled
- ✅ Mixed content blocked
- ✅ Biometric authentication ready
- ✅ Certificate pinning ready (configure in capacitor.config.ts)
- ⚠️ Debug APKs are not signed - use only for testing
- ⚠️ Release APKs must be signed before distribution
- ⚠️ SMS permissions require user consent on Android 6+

## 📱 Testing the App

### On Physical Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect via USB
4. Run: `cd apps/client/android && ./gradlew installDebug`

### On Emulator

1. Start Android Emulator from Android Studio
2. Run: `cd apps/client/android && ./gradlew installDebug`

### Via Capacitor CLI

```bash
cd apps/client
npx cap run android
```

## 🐛 Troubleshooting

### "SDK location not found"

Create `android/local.properties`:

```
sdk.dir=/path/to/Android/Sdk
```

### "Permission denied: gradlew"

```bash
chmod +x android/gradlew
```

### "Build failed - dependencies"

```bash
cd android
./gradlew clean build --refresh-dependencies
```

### APK Won't Install

- Check minimum Android version (5.1+)
- Enable "Install from Unknown Sources"
- Uninstall previous version first

### SMS Permissions Denied

- Request at runtime (not just in manifest)
- Explain why you need SMS access
- Provide fallback for manual OTP entry

## 🎯 Feature Highlights

### WhatsApp OTP Login

Members can log in using their phone number and receive OTP via WhatsApp - no
password needed!

### Auto-Sync MoMo Transactions

The app listens for MTN/Airtel MoMo SMS notifications and automatically syncs
transactions to the account.

### Offline-First Design

All features work offline. Data syncs automatically when connection is restored.

### Biometric Quick Access

Members can unlock the app with fingerprint or face recognition for fast, secure
access.

### USSD Mobile Money

Tap to dial USSD codes (*182#, *333#) for mobile money top-up without leaving
the app.

## 📞 Support

For build issues:

- Check BUILD_APK_INSTRUCTIONS.md
- See Capacitor docs: https://capacitorjs.com/docs/android
- Check Gradle docs: https://docs.gradle.org

For app functionality:

- Test the Client PWA first at the server URL
- Check browser console for errors
- Verify server is accessible from mobile network

## 📄 License

© 2025 Ibimina. All rights reserved.
