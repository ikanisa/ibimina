# Building the Ibimina Client Android APK

## Prerequisites

1. **Java JDK 17** -
   [Download](https://www.oracle.com/java/technologies/downloads/#java17)
2. **Android Studio** (optional but recommended) -
   [Download](https://developer.android.com/studio)
   - OR just the Android SDK Command Line Tools

## Quick Build (Command Line)

### Method 1: Using Gradle Wrapper (No Android Studio needed)

```bash
# 1. Navigate to the client app directory
cd apps/client

# 2. Set Android SDK path (replace with your actual path)
export ANDROID_HOME=$HOME/Android/Sdk  # On macOS/Linux
# OR on Windows:
# set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk

# 3. Sync Capacitor (optional, already done)
npx cap sync android

# 4. Build the APK
cd android
./gradlew assembleDebug
cd ..
```

### Method 2: Using Android Studio

```bash
# 1. Sync Capacitor
cd apps/client
npx cap sync android

# 2. Open Android Studio
# File → Open → Select apps/client/android directory

# 3. Build APK
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

## Finding Your APK

After building, find the APK at:

```
apps/client/android/app/build/outputs/apk/debug/app-debug.apk
```

## Configuration

The app is currently configured to connect to:

```
https://4095a3b5-fbd8-407c-bbf4-c6a12f21341e-00-2ss8fo7up7zir.kirk.replit.dev
```

To change the server URL:

1. Edit `apps/client/capacitor.config.ts`
2. Update the `server.url` property
3. Run `npx cap sync android`
4. Rebuild the APK

## Signing the APK for Release

For production distribution (Google Play Store):

```bash
# Create a keystore (one-time only)
keytool -genkey -v -keystore ibimina-client.keystore -alias ibimina-client -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd apps/client/android
./gradlew assembleRelease

# Sign the APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ../../ibimina-client.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk ibimina-client

# Align the APK
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/ibimina-client.apk
```

## App Details

- **App Name**: Ibimina
- **Package ID**: rw.ibimina.client
- **Minimum SDK**: 22 (Android 5.1+)
- **Target SDK**: 34 (Android 14)

## Troubleshooting

### SDK Location Not Found

Create `apps/client/android/local.properties`:

```
sdk.dir=/path/to/your/Android/Sdk
```

### Permission Denied on gradlew

```bash
chmod +x android/gradlew
```

### Build Fails - Missing Dependencies

```bash
cd android
./gradlew clean build --refresh-dependencies
```

## Features Included

- 📱 Native Android app wrapper
- 🔐 Secure HTTPS connection to server
- 🎨 Atlas Blue splash screen (#0066FF)
- 📸 Camera support for document uploads
- 🔔 Push & local notifications
- 💾 Offline data caching with Preferences API
- 📳 Haptic feedback support
- 📍 Geolocation for branch finder
- 📱 SMS reading for OTP & transaction confirmations
- 📞 USSD dialing for mobile money
- 🔒 Biometric authentication (fingerprint/face)
- 📡 Background sync with foreground service
- 🔍 Barcode/QR scanner
- 📤 Native sharing
- 🌐 Network status detection
- ⌨️ Keyboard management
- 🗂️ File system access
- 🎯 Toast notifications
