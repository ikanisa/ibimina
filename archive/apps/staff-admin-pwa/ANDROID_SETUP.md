# 📱 Android App Setup Guide - Staff Admin PWA

## 🎯 Overview

This guide shows you how to build the Staff Admin PWA as a native Android app using Capacitor.

**What you'll get:**
- ✅ Native Android APK/AAB
- ✅ Same codebase as web PWA
- ✅ Offline support
- ✅ Native features (camera, biometrics, push, etc.)
- ✅ Google Play Store ready

---

## 📋 Prerequisites

### Required Software

1. **Node.js 20+** (already installed ✅)
2. **pnpm** (already installed ✅)
3. **Android Studio** (download from https://developer.android.com/studio)
4. **Java JDK 17+** (comes with Android Studio)

### Install Android Studio

```bash
# macOS
brew install --cask android-studio

# Or download from: https://developer.android.com/studio
```

### Configure Android SDK

1. Open Android Studio
2. Go to **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Install:
   - ✅ Android SDK Platform 33 (Android 13)
   - ✅ Android SDK Build-Tools 33.0.0
   - ✅ Android SDK Command-line Tools
   - ✅ Android Emulator

4. Set environment variables:

```bash
# Add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Reload shell
source ~/.zshrc  # or ~/.bashrc
```

5. Verify:

```bash
# Check Android SDK
android --version

# Check ADB
adb version
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /Users/jeanbosco/workspace/ibimina

# Install Capacitor dependencies (already added to package.json)
pnpm install
```

### 2. Build the Web App

```bash
cd apps/staff-admin-pwa

# Build production bundle
pnpm build

# Verify dist/ folder exists
ls -la dist/
```

### 3. Initialize Capacitor (First Time Only)

```bash
# Initialize Capacitor with app details
pnpm exec cap init "Ibimina Staff Admin" "rw.ibimina.staffadmin" --web-dir=dist

# This creates capacitor.config.ts (already created)
```

### 4. Add Android Platform

```bash
# Add Android project
pnpm cap add android

# This creates android/ folder with Gradle project
```

### 5. Sync Web Build to Android

```bash
# Copy web assets to Android project
pnpm cap sync android

# Or just: pnpm cap sync
```

### 6. Open in Android Studio

```bash
# Open Android project in Android Studio
pnpm cap open android

# Or manually: android-studio android/
```

### 7. Run on Device/Emulator

**Option A: From Android Studio**
1. Click **Run** (green play button)
2. Select device/emulator
3. App will install and launch

**Option B: From Command Line**
```bash
# Run on connected device
pnpm cap run android

# Run on specific device
pnpm cap run android --target=<device-id>

# List devices
adb devices
```

---

## 🛠️ Development Workflow

### Live Reload (Development)

You can develop with live reload from the web dev server:

1. Start Vite dev server:
```bash
pnpm dev
# Runs on http://localhost:3000
```

2. Get your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: 192.168.1.100
```

3. Update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.1.100:3000',
  cleartext: true,
}
```

4. Sync and run:
```bash
pnpm cap sync android
pnpm cap run android
```

Now changes in your web code will live reload on the Android device!

### Build → Sync → Run Cycle

```bash
# Build web app
pnpm build

# Sync to Android
pnpm cap sync

# Run on device
pnpm cap run android
```

Or use the combined command:

```bash
# Build and sync in one command
pnpm cap:build

# Then run
pnpm cap run android
```

---

## 📦 Building Release APK/AAB

### Debug APK (for testing)

```bash
cd apps/staff-admin-pwa

# Build web
pnpm build

# Sync to Android
pnpm cap sync

# Build debug APK
pnpm android:build

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

Install debug APK:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Release AAB (for Google Play)

1. **Generate Signing Key**

```bash
cd apps/staff-admin-pwa/android

# Generate release keystore
keytool -genkey -v -keystore ibimina-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias ibimina-staffadmin

# Enter password and details
# IMPORTANT: Save this password! You'll need it.
```

2. **Configure Signing**

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../ibimina-release-key.jks")
            storePassword "YOUR_KEYSTORE_PASSWORD"
            keyAlias "ibimina-staffadmin"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Security Note:** Don't commit passwords! Use environment variables or Gradle properties.

3. **Build Release AAB**

```bash
# Build release bundle
pnpm android:release

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

4. **Upload to Google Play Console**
   - Go to https://play.google.com/console
   - Create app listing
   - Upload `app-release.aab`
   - Fill in store details
   - Submit for review

---

## 🎨 Customizing Android App

### App Name

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Ibimina Staff Admin</string>
    <string name="title_activity_main">Ibimina Staff Admin</string>
    <string name="package_name">rw.ibimina.staffadmin</string>
    <string name="custom_url_scheme">rw.ibimina.staffadmin</string>
</resources>
```

### App Icon

**Option 1: Use Capacitor Assets CLI**

```bash
# Install Capacitor Assets
npm install -g @capacitor/assets

# Generate all icons from logo.svg
npx capacitor-assets generate --android
```

**Option 2: Manual (using our script)**

```bash
# Requires ImageMagick: brew install imagemagick
node scripts/generate-android-assets.mjs

# Copy to Android project
pnpm cap sync
```

**Option 3: Android Studio**

1. Open `android/app/src/main/res/` in Android Studio
2. Right-click `mipmap` → **New** → **Image Asset**
3. Upload your icon
4. Generate all densities

### Splash Screen

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

Create `android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:src="@drawable/splash_image"
            android:gravity="center" />
    </item>
</layer-list>
```

### Theme Colors

Edit `android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="colorPrimary">#1976d2</color>
    <color name="colorPrimaryDark">#115293</color>
    <color name="colorAccent">#ff4081</color>
    <color name="splash_background">#1976d2</color>
</resources>
```

### Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Optional: for camera -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Optional: for push notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Optional: for biometric auth -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    
    <application>
        ...
    </application>
</manifest>
```

---

## 🧪 Testing

### Test on Emulator

1. Open Android Studio → **Device Manager**
2. Create virtual device:
   - Device: Pixel 6
   - System Image: Android 13 (API 33)
   - RAM: 2GB+
3. Start emulator
4. Run app: `pnpm cap run android`

### Test on Physical Device

1. Enable Developer Options on device:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. Connect via USB

3. Verify connection:
```bash
adb devices
# Should show your device
```

4. Run app:
```bash
pnpm cap run android
```

### Debug Logs

```bash
# View app logs
adb logcat | grep -i "Capacitor"

# View all logs
adb logcat

# Clear logs
adb logcat -c
```

---

## 🚨 Troubleshooting

### Gradle Build Fails

```bash
# Clean build
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug --stacktrace
```

### ANDROID_HOME not set

```bash
# Check if set
echo $ANDROID_HOME

# Should output: /Users/yourname/Library/Android/sdk
# If not, add to ~/.zshrc and reload shell
```

### Device not detected

```bash
# Restart ADB
adb kill-server
adb start-server

# List devices
adb devices
```

### Web assets not updating

```bash
# Clean and rebuild
pnpm clean
pnpm build
pnpm cap sync android --force
```

### Port already in use (dev server)

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Java version mismatch

```bash
# Check Java version
java -version

# Should be 17 or higher
# Install if needed: brew install openjdk@17
```

---

## 📱 Native Features

Capacitor provides plugins for native features:

### Camera

```bash
pnpm add @capacitor/camera
```

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
  return image.webPath;
};
```

### Geolocation

```bash
pnpm add @capacitor/geolocation
```

```typescript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();
  return coordinates.coords;
};
```

### Push Notifications

```bash
pnpm add @capacitor/push-notifications
```

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

await PushNotifications.requestPermissions();
await PushNotifications.register();
```

### Biometric Authentication

```bash
pnpm add @capacitor-community/biometric
```

```typescript
import { BiometricAuth } from '@capacitor-community/biometric';

const result = await BiometricAuth.authenticate({
  reason: 'Please authenticate'
});
```

See full list: https://capacitorjs.com/docs/plugins

---

## 📚 Useful Commands Reference

```bash
# Development
pnpm dev                      # Start web dev server
pnpm build                    # Build web app
pnpm cap sync                 # Sync to native platforms
pnpm cap open android         # Open in Android Studio
pnpm cap run android          # Run on device

# Building
pnpm android:build            # Build debug APK
pnpm android:release          # Build release AAB

# Debugging
adb devices                   # List connected devices
adb logcat                    # View device logs
adb install app.apk           # Install APK

# Capacitor
pnpm cap add android          # Add Android platform (once)
pnpm cap copy android         # Copy web assets only
pnpm cap update android       # Update Capacitor/plugins
```

---

## 🎯 Next Steps

1. ✅ **Build and test** the debug APK
2. ✅ **Customize** app icon and splash screen
3. ✅ **Test** all features on physical device
4. ✅ **Generate** release signing key
5. ✅ **Build** release AAB
6. ✅ **Create** Google Play Store listing
7. ✅ **Submit** for review

---

## 📞 Support

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Docs:** https://developer.android.com
- **Issues:** File issues in the monorepo

---

**Status:** ✅ Capacitor Android integration complete!  
**Package:** rw.ibimina.staffadmin  
**Platform:** Android 13+ (API 33+)  
**Build Tool:** Gradle 8.0+

**Ready to build your first APK!** 🚀
