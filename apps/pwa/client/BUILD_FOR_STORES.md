# Ibimina Client App - Build Guide for Google Play & App Store

## 📱 Overview

This guide covers building **production-ready** AAB (Android) and IPA (iOS) for
the **Ibimina Client/Member App**.

**App Details:**

- **Package ID (Android):** `rw.ibimina.client`
- **Bundle ID (iOS):** `rw.ibimina.client`
- **Target Users:** SACCO members (end customers)
- **Features:** Group savings, payments, member dashboard, NFC payments

---

## ✅ Pre-Build Checklist

### Required Software

- ✅ Node.js 20+
- ✅ pnpm 10.19.0+
- ✅ Java 17+ (for Android)
- ✅ Android Studio + Android SDK (for Android)
- ✅ Xcode 15+ (for iOS, macOS only)
- ✅ Apple Developer account ($99/year, for iOS)

### Required Environment Variables

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export ANDROID_HOME="$HOME/Library/Android/sdk"  # macOS
```

---

## 🤖 Build Android AAB (Google Play)

### Quick Start (5-10 minutes)

```bash
cd apps/client

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Run build script
./build-android-aab.sh
```

### What the Script Does

1. ✅ Validates environment (Node, pnpm, Java, Android SDK)
2. ✅ Removes Firebase/push-notifications (if present)
3. ✅ Generates signing keystore (first time only - **SAVE PASSWORD!**)
4. ✅ Cleans previous builds
5. ✅ Installs dependencies
6. ✅ Builds Next.js app
7. ✅ Syncs Capacitor
8. ✅ Builds signed AAB

### Output

**File:** `android/app/build/outputs/bundle/release/app-release.aab`  
**Size:** ~20-30 MB  
**Ready for:** Google Play Internal Testing

### Manual Build Steps (Alternative)

```bash
# 1. Generate keystore (first time only)
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore ibimina-client-release.keystore \
  -alias ibimina-client \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 2. Set keystore env vars
export ANDROID_KEYSTORE_PATH="$PWD/android/app/ibimina-client-release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-password"
export ANDROID_KEY_ALIAS="ibimina-client"
export ANDROID_KEY_PASSWORD="your-password"

# 3. Build Next.js
pnpm build

# 4. Sync Capacitor
npx cap sync android

# 5. Build AAB
cd android
./gradlew bundleRelease
```

---

## 🍎 Build iOS IPA (App Store)

### Requirements

- ✅ **macOS only** (iOS builds require macOS)
- ✅ **Xcode 15+** installed
- ✅ **Apple Developer account** ($99/year)
- ✅ **App ID created:** `rw.ibimina.client`
- ✅ **Distribution certificate** installed
- ✅ **Provisioning profile** downloaded

### Quick Start (15-20 minutes)

```bash
cd apps/client

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Run build script
./build-ios-ipa.sh
```

### Apple Developer Setup (First Time)

1. **Create App ID**
   - Go to: https://developer.apple.com/account
   - Certificates, IDs & Profiles → Identifiers → App IDs
   - Click **+** to create new
   - Bundle ID: `rw.ibimina.client`
   - Name: Ibimina Client

2. **Create Distribution Certificate**
   - Certificates, IDs & Profiles → Certificates
   - Click **+** → iOS Distribution (App Store)
   - Follow prompts to create CSR and download certificate

3. **Create Provisioning Profile**
   - Certificates, IDs & Profiles → Profiles
   - Click **+** → App Store Distribution
   - Select App ID: `rw.ibimina.client`
   - Select Distribution Certificate
   - Download and double-click to install

4. **Configure Xcode Signing**

   ```bash
   open ios/App/App.xcworkspace
   ```

   - Select **App** target
   - Go to **Signing & Capabilities**
   - Team: Select your Apple Developer team
   - Provisioning Profile: Select the profile you created

### Output

**File:** `build/Ibimina-Client.ipa`  
**Size:** ~30-40 MB  
**Ready for:** TestFlight / App Store submission

### Upload to App Store

**Option 1: Xcode (Easiest)**

```bash
# After build completes
open ios/App/App.xcworkspace

# In Xcode:
# Window → Organizer → Select archive → Distribute App → App Store Connect
```

**Option 2: Command Line**

```bash
xcrun altool --upload-app \
  -f build/Ibimina-Client.ipa \
  -t ios \
  -u your-apple-id@example.com \
  --password your-app-specific-password
```

---

## 📤 Upload to Google Play Console

### 1. Create App (First Time)

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - App name: **Ibimina**
   - Default language: **English**
   - App or game: **App**
   - Free or paid: **Free**
   - Category: **Finance**

### 2. Complete Required Sections

#### Privacy Policy

- URL: `https://app.ibimina.rw/privacy`
- (Make sure this page exists and describes SMS, location, camera usage)

#### Data Safety

- **Data collected:**
  - ✅ Location (for branch finder)
  - ✅ Financial info (account balances, transactions)
  - ✅ Photos (profile picture, ID verification)
  - ✅ Device ID (for authentication)
- **Data usage:** Account management, payments
- **Data sharing:** With Supabase (backend)
- **Encrypted:** YES (in transit and at rest)

#### Content Rating

- Complete IARC questionnaire
- Expected rating: **PEGI 3 / Everyone**

### 3. Upload AAB

1. Go to: **Testing → Internal testing**
2. Click: **"Create new release"**
3. Upload: `android/app/build/outputs/bundle/release/app-release.aab`
4. Release notes:

   ```
   Version 1.0.0 - Initial Release

   Features:
   • View group savings and contributions
   • Make payments via NFC (TapMoMo)
   • Check account balances
   • View transaction history
   • Request to join groups
   • Biometric authentication

   Requirements:
   • Android 7.0+ (API 26+)
   • SACCO member credentials
   ```

5. Add testers: Add member emails (up to 100)
6. Click: **"Save"** → **"Start rollout"**

### 4. Get Opt-in Link

Copy the testing link (looks like):

```
https://play.google.com/apps/internaltest/XXXXX
```

Send this to members for installation.

---

## 📤 Upload to App Store Connect

### 1. Create App (First Time)

1. Go to: https://appstoreconnect.apple.com
2. Click **"+"** → **"New App"**
3. Fill in:
   - Platform: **iOS**
   - Name: **Ibimina**
   - Primary Language: **English**
   - Bundle ID: **rw.ibimina.client**
   - SKU: **rw.ibimina.client**

### 2. Complete App Information

#### App Privacy

- **Location:** YES (for branch finder)
- **Financial Info:** YES (account balances)
- **User Content:** YES (profile photos)
- **Identifiers:** YES (for authentication)

#### App Review Information

- Provide demo account credentials for reviewers
- Contact info for support

#### Version Information

- Version: **1.0.0**
- Copyright: **Ikanisa Rwanda**
- Category: **Finance**

### 3. Upload IPA

**After building IPA, upload via Xcode Organizer or:**

```bash
xcrun altool --upload-app \
  -f build/Ibimina-Client.ipa \
  -t ios \
  -u your-apple-id@example.com \
  -p your-app-specific-password
```

### 4. TestFlight

1. In App Store Connect → TestFlight
2. Build appears automatically after upload (processing ~5-10 min)
3. Add internal testers (up to 100)
4. Enable external testing (up to 10,000, requires review)
5. Share TestFlight link with members

---

## 🔍 Verification

### Test Android AAB Locally

```bash
# Install bundletool
brew install bundletool

# Generate APKs from AAB
bundletool build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=test.apks \
  --ks=android/app/ibimina-client-release.keystore \
  --ks-key-alias=ibimina-client

# Install on connected device
bundletool install-apks --apks=test.apks
```

### Test iOS IPA

```bash
# Install on connected device via Xcode
# Devices and Simulators → Select device → Install build/Ibimina-Client.ipa
```

---

## 🐛 Troubleshooting

### Android Build Fails: "ANDROID_HOME not set"

```bash
# macOS
export ANDROID_HOME=$HOME/Library/Android/sdk
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc

# Linux
export ANDROID_HOME=$HOME/Android/Sdk
```

### iOS Build Fails: "Signing requires a development team"

**Solution:** Open Xcode and configure signing:

```bash
open ios/App/App.xcworkspace
# Select App target → Signing & Capabilities → Select Team
```

### Build Fails: "Environment variable not set"

```bash
# Check if variables are set
echo $NEXT_PUBLIC_SUPABASE_URL

# If empty, export them
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 📋 Firebase Cleanup (Already Done)

Firebase references have been **completely removed** from the client app:

✅ Removed from `apps/client/android/build.gradle`  
✅ Removed from `apps/client/android/app/build.gradle`  
✅ Removed from `apps/client/package.json`

**Impact:** Push notifications disabled (can re-add later if needed)

---

## 🎯 Quick Reference

```bash
# Build Android AAB
cd apps/client && ./build-android-aab.sh

# Build iOS IPA
cd apps/client && ./build-ios-ipa.sh

# Android output
android/app/build/outputs/bundle/release/app-release.aab

# iOS output
build/Ibimina-Client.ipa

# Upload to Google Play
https://play.google.com/console → Testing → Internal testing

# Upload to App Store
https://appstoreconnect.apple.com → TestFlight
```

---

## 📞 Support

**Build Issues:**

- Check environment variables
- Check keystore permissions
- Review build logs in terminal

**Store Submission Issues:**

- Check Data Safety / Privacy declarations
- Ensure privacy policy is accessible
- Provide demo account for reviewers

---

## ✅ Success Criteria

**Ready for Google Play Internal Testing:**

- ✅ AAB builds without errors
- ✅ AAB is signed with release keystore
- ✅ Version code increments for updates
- ✅ Privacy policy URL works

**Ready for App Store TestFlight:**

- ✅ IPA builds without errors
- ✅ IPA is signed with distribution certificate
- ✅ Build number increments for updates
- ✅ App Privacy info completed

---

**Both Android and iOS builds are now ready! 🚀**

Run the build scripts and follow the upload instructions above to get your app
in members' hands within 2-3 days!
