# Production Build Guide - Ibimina Client Mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Java 17+ (for Android)
- Xcode 14+ (for iOS, macOS only)
- Android Studio (for Android)
- EAS CLI (optional, for cloud builds)

### Build Commands

```bash
# Android APK (for direct distribution)
./build-android-apk.sh

# Android AAB (for Google Play Store)
./build-android-aab.sh

# iOS IPA (for App Store, macOS only)
./build-ios-ipa.sh
```

---

## 📱 Android Builds

### Option 1: Local Build (APK)

**Use Case**: Internal testing, direct distribution

```bash
# 1. Ensure .env.production exists
cp .env.example .env.production
# Edit .env.production with production values

# 2. Build APK
./build-android-apk.sh

# 3. Find APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Option 2: Local Build (AAB)

**Use Case**: Google Play Store submission

```bash
# 1. Build AAB
./build-android-aab.sh

# 2. Find AAB at:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Option 3: Cloud Build (EAS)

**Use Case**: Automated builds, no local setup needed

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production-aab
```

### Signing Configuration

Create `android/app/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=ibimina-client
storeFile=ibimina-client.keystore
```

Generate keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/ibimina-client.keystore \
  -alias ibimina-client \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

---

## 🍎 iOS Builds

### Option 1: Local Build

**Prerequisites**:

- macOS with Xcode 14+
- Apple Developer account
- Valid distribution certificate
- App Store provisioning profile

```bash
# 1. Ensure .env.production exists
cp .env.example .env.production

# 2. Update ExportOptions.plist with your Team ID

# 3. Build IPA
./build-ios-ipa.sh

# 4. Find IPA at:
# ios/build/Ibimina.ipa
```

### Option 2: Cloud Build (EAS)

```bash
# Build for TestFlight/App Store
eas build --platform ios --profile production
```

### Certificates Setup

1. **Open Xcode** → Preferences → Accounts
2. **Add Apple ID**
3. **Download Certificates** (Automatic)
4. **Update `ExportOptions.plist`** with Team ID

Or use Fastlane:

```bash
cd ios
fastlane match appstore
```

---

## 🌍 Environment Configuration

### Required Variables

Create `.env.production`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# WhatsApp Business API
EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
EXPO_PUBLIC_WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# App Configuration
EXPO_PUBLIC_APP_ENVIRONMENT=production
EXPO_PUBLIC_API_URL=https://api.ibimina.rw

# Features
EXPO_PUBLIC_ENABLE_BIOMETRIC=true
EXPO_PUBLIC_ENABLE_NFC=true
```

### Environment-Specific Builds

```bash
# Development
npm run android  # or npm run ios

# Staging
EXPO_PUBLIC_APP_ENVIRONMENT=staging npm run android

# Production
./build-android-apk.sh
```

---

## 📤 Distribution

### Android - Google Play Store

1. **Build AAB**:

   ```bash
   ./build-android-aab.sh
   ```

2. **Upload to Play Console**:
   - Go to https://play.google.com/console
   - Select app → Production → Create new release
   - Upload `app-release.aab`
   - Fill release notes
   - Submit for review

3. **Internal Testing** (Optional):
   ```bash
   eas submit --platform android --profile production
   ```

### iOS - App Store

1. **Build IPA**:

   ```bash
   ./build-ios-ipa.sh
   ```

2. **Upload to App Store Connect**:

   ```bash
   xcrun altool --upload-app \
     --type ios \
     --file ibimina-client.ipa \
     --username "your@email.com" \
     --password "@keychain:AC_PASSWORD"
   ```

   Or use Transporter app:
   - Open Transporter
   - Drag & drop IPA
   - Click "Deliver"

3. **Submit for Review**:
   - Open App Store Connect
   - TestFlight → Submit to App Store
   - Fill metadata and submit

### Direct Distribution (Android)

1. **Enable Unknown Sources** on device
2. **Copy APK** to device or host it:

   ```bash
   # Host locally
   npx serve -p 8080 android/app/build/outputs/apk/release/

   # Download on device:
   # http://YOUR_IP:8080/app-release.apk
   ```

3. **Install APK** by opening file

---

## 🔧 Troubleshooting

### Android Issues

**Error: "SDK location not found"**

```bash
# Create local.properties
echo "sdk.dir=/Users/$USER/Library/Android/sdk" > android/local.properties
```

**Error: "Gradle build failed"**

```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

**Error: "Keystore not found"**

- Verify `keystore.properties` exists
- Check keystore file path
- Ensure passwords are correct

### iOS Issues

**Error: "Provisioning profile not found"**

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Re-download profiles
xcodebuild -downloadAllPlatforms
```

**Error: "Signing certificate expired"**

- Renew certificate in Apple Developer portal
- Download new certificate in Xcode

**Error: "CocoaPods install failed"**

```bash
cd ios
pod deintegrate
pod install --repo-update
```

---

## 🧪 Testing Builds

### Android

```bash
# Install APK on connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat | grep -i "ibimina"
```

### iOS

```bash
# Install on simulator
xcrun simctl install booted ios/build/Ibimina.app

# Install on device via Xcode
# Devices & Simulators → Drag IPA to device
```

---

## 📊 Build Size Optimization

### Current Sizes

- Android APK: ~50 MB
- Android AAB: ~30 MB (Play Store optimizes per device)
- iOS IPA: ~40 MB

### Reduce Size

**Android**:

```gradle
// android/app/build.gradle
android {
    buildTypes {
        release {
            shrinkResources true
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }

    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
        }
    }
}
```

**iOS**:

- Enable Bitcode in Xcode (deprecated iOS 14+)
- Use asset catalogs for images
- Strip debug symbols

---

## 🔐 Security Checklist

Before production release:

- [ ] Remove all `console.log` statements
- [ ] Verify no hardcoded secrets
- [ ] Test with production Supabase
- [ ] Enable certificate pinning (optional)
- [ ] Test deep linking
- [ ] Test push notifications
- [ ] Verify biometric auth
- [ ] Test offline functionality
- [ ] Run security audit: `npm audit`
- [ ] Test on multiple devices/OS versions

---

## 📝 Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `versionCode` (Android) and `buildNumber` (iOS)
- [ ] Write changelog (CHANGELOG.md)
- [ ] Tag release: `git tag v1.0.0`
- [ ] Build production artifacts
- [ ] Test on physical devices
- [ ] Submit to stores
- [ ] Monitor crash reports (Sentry)
- [ ] Update documentation

---

## 🆘 Support

- **Documentation**: `./README.md`
- **Build Issues**: Check `./TROUBLESHOOTING.md`
- **Contact**: dev@ibimina.rw
