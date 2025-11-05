# Mobile Apps → Google Play: Quick Start

**Goal**: Get APKs ready for Google Play upload  
**Time to First Upload**: 1 week (client app)  
**Status**: Ready to execute

---

## 🚨 THE ONE CRITICAL BLOCKER

**Admin/Staff App has BANNED SMS permissions** that will cause **instant
rejection** by Google Play.

**Impact**:

- ✅ Client app: No blockers, ready to build
- 🚨 Admin app: MUST fix before Play Store submission

**Fix**: Remove SMS permissions, use Notification Listener Service instead  
**Time**: 16 hours (4h removal + 8h implementation + 4h testing)

---

## ⚡ Fast Track Option (RECOMMENDED)

### Path 1: Client App to Play Store in 1 Week

**Why this wins:**

- ✅ No blockers
- ✅ Larger user base (revenue impact)
- ✅ Staff can use PWA meanwhile

**Timeline:**

```
Day 1: Generate keystore + test build (3 hours)
Day 2: Create Play Store assets (4 hours)
Day 3: Upload to Internal Testing (1 hour)
Day 4-7: Test with 10-20 users
```

**Commands:**

```bash
# Step 1: Generate keystore
./scripts/generate-keystores.sh
# Follow prompts for client app

# Step 2: Build signed APK/AAB
source ~/.ibimina-client-signing.env
./scripts/build-client-release.sh

# Step 3: Test on device
adb install apps/client/android/app/build/outputs/apk/release/app-release.apk

# Step 4: Upload AAB to Play Console
# apps/client/android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📋 Complete Checklist

### Pre-Build Setup ✅

- [ ] **Install Java 17**

  ```bash
  java -version  # Must be 17.x
  ```

- [ ] **Set Android SDK path**

  ```bash
  export ANDROID_HOME=~/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

- [ ] **Verify Gradle works**
  ```bash
  cd apps/client/android
  ./gradlew --version
  ```

### Client App - Build Phase 🏗️

- [ ] **Generate release keystore**

  ```bash
  ./scripts/generate-keystores.sh
  # Store credentials in password manager
  # Back up keystore file
  ```

- [ ] **Set environment variables**

  ```bash
  source ~/.ibimina-client-signing.env

  # Set production Supabase URL (or use placeholder)
  export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
  export HMAC_SHARED_SECRET="your-production-secret"
  ```

- [ ] **Build signed release**

  ```bash
  ./scripts/build-client-release.sh

  # Verify outputs:
  # - apps/client/android/app/build/outputs/apk/release/app-release.apk
  # - apps/client/android/app/build/outputs/bundle/release/app-release.aab
  ```

- [ ] **Verify APK signature**

  ```bash
  jarsigner -verify -verbose -certs \
    apps/client/android/app/build/outputs/apk/release/app-release.apk
  ```

- [ ] **Test on 3+ devices**

  ```bash
  adb install apps/client/android/app/build/outputs/apk/release/app-release.apk

  # Test checklist:
  # [ ] App launches
  # [ ] Deep links work (https://client.ibimina.rw)
  # [ ] USSD code copies and opens dialer
  # [ ] TapMoMo NFC scanning works (if device has NFC)
  # [ ] Biometric auth works
  # [ ] Offline mode works (disable wifi/data)
  # [ ] Background sync works (re-enable network)
  ```

### Play Store Assets 📱

- [ ] **App Icon** (512x512 PNG)
  - Location: `assets/playstore/client/icon-512.png`
  - Requirements: No transparency, 32-bit PNG

- [ ] **Feature Graphic** (1024x500 PNG)
  - Location: `assets/playstore/client/feature-graphic.png`
  - Shows on Play Store listing

- [ ] **Screenshots** (5 minimum)
  - Phone: 1080x1920 to 1080x2960
  - Take on real device, show key features:
    1. Home/dashboard
    2. Group list
    3. USSD payment flow
    4. TapMoMo NFC screen
    5. Statement/history
  - Location: `assets/playstore/client/screenshots/phone/`

- [ ] **App Descriptions**
  - Short (80 chars): "Save with your group, pay with USSD or NFC tap"
  - Full (4000 chars): See MOBILE_APK_PRODUCTION_ROADMAP.md
  - Kinyarwanda translation (optional but recommended)

- [ ] **Privacy Policy**
  - URL: https://ibimina.rw/privacy
  - Must be publicly accessible

### Google Play Console 🎮

- [ ] **Developer Account**
  - Sign up at https://play.google.com/console
  - Pay $25 one-time fee
  - Complete identity verification (2-3 days)

- [ ] **Create App**
  - Name: "Ibimina - SACCO Savings"
  - Default language: English (US)
  - App type: App
  - Free/Paid: Free
  - Package name: `rw.ibimina.client`

- [ ] **App Information**
  - Category: Finance
  - Contact email: support@ibimina.rw
  - Privacy policy: https://ibimina.rw/privacy
  - Upload icon, feature graphic, screenshots

- [ ] **Content Rating**
  - Complete questionnaire
  - Finance app, no objectionable content
  - Expected: PEGI 3, ESRB Everyone

- [ ] **Target Audience**
  - Age: 18+ (financial services)
  - Countries: Rwanda

- [ ] **Data Safety**
  - Collects: Personal info (name, phone), Financial info
  - Encryption: In transit and at rest
  - User controls: Can request deletion
  - Third parties: Supabase, PostHog

### Internal Testing 🧪

- [ ] **Create Release**
  - Go to: Testing → Internal Testing
  - Upload AAB: `app-release.aab`
  - Release name: "0.1.0 - Initial Internal Release"

- [ ] **Release Notes**

  ```
  Initial internal testing release
  - Member onboarding and group management
  - USSD payment with reference tokens
  - TapMoMo NFC tap-to-pay
  - Offline-first with background sync
  - Biometric authentication
  ```

- [ ] **Add Testers**
  - Create tester list (up to 100 emails)
  - OR generate public link

- [ ] **Start Rollout**
  - Review release → Save → Start Rollout to Internal Testing

- [ ] **Test Period** (minimum 7 days)
  - Monitor crash reports (target: <0.5%)
  - Monitor ANR rate (target: <0.1%)
  - Collect feedback from testers
  - Fix critical issues

### Production Readiness 🚀

- [ ] **7+ days internal testing** with no critical issues
- [ ] **Crash-free rate ≥99.5%**
- [ ] **ANR rate <0.1%**
- [ ] **All features tested** on 5+ different devices
- [ ] **Deep links verified** in production environment
- [ ] **Sentry configured** and receiving errors
- [ ] **PostHog configured** and tracking events
- [ ] **Support email** monitored (support@ibimina.rw)
- [ ] **Backend scaled** for expected load

---

## 🚫 Admin App (BLOCKED - Fix Required)

### THE PROBLEM

Two manifests have banned SMS permissions:

**File 1**: `apps/admin/android/app/src/main/AndroidManifest.xml`  
**Lines 69-70**:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

**File 2**: `apps/staff-mobile-android/app/src/main/AndroidManifest.xml`  
**Lines 9-10**:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

### WHY IT'S BANNED

Google Play
[banned SMS/CALL_LOG permissions](https://support.google.com/googleplay/android-developer/answer/10208820)
in October 2023 for all apps except default SMS/phone apps. No exceptions.

### THE FIX

```bash
# Step 1: Remove SMS permissions
./scripts/fix-admin-sms-permissions.sh

# Step 2: Implement Notification Listener Service
# (Copy from client app - already implemented correctly)

# Step 3: Test
cd apps/admin/android
./gradlew assembleDebug
aapt dump permissions app/build/outputs/apk/debug/app-debug.apk | grep SMS
# Should return nothing

# Step 4: Verify runtime
adb install app/build/outputs/apk/debug/app-debug.apk
# Test mobile money notification reading
```

### ALTERNATIVE: Direct APK Distribution

**Skip Play Store for admin app:**

- Build unsigned debug APK
- Distribute via staff portal
- Staff enable "Unknown Sources"
- No Google review needed
- Faster iteration

```bash
cd apps/admin/android
./gradlew assembleDebug

# Distribute:
# apps/admin/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📚 References

- **Full Guide**:
  [MOBILE_APK_PRODUCTION_ROADMAP.md](./MOBILE_APK_PRODUCTION_ROADMAP.md)
- **Build Scripts**: `./scripts/build-*-release.sh`
- **SMS Fix**: `./scripts/fix-admin-sms-permissions.sh`
- **Keystore**: `./scripts/generate-keystores.sh`

---

## 🆘 Troubleshooting

### "JAVA_HOME not set"

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### "Android SDK not found"

```bash
export ANDROID_HOME=~/Library/Android/sdk
```

### "Keystore not found"

```bash
# Verify keystore exists
ls -la ~/.ibimina/keystores/

# Verify environment variables
echo $ANDROID_KEYSTORE_PATH
source ~/.ibimina-client-signing.env
```

### "Build failed - environment variables"

```bash
# Set placeholders for testing
export NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
export HMAC_SHARED_SECRET="placeholder-secret"

# App will build but may not work at runtime
```

### "jarsigner: command not found"

```bash
# jarsigner is part of JDK
which jarsigner
# Should be in: $JAVA_HOME/bin/jarsigner
```

---

## ⚡ TL;DR - Just Ship Client App

```bash
# 1. Generate keystore (5 min)
./scripts/generate-keystores.sh

# 2. Build release (10 min)
source ~/.ibimina-client-signing.env
./scripts/build-client-release.sh

# 3. Test on device (30 min)
adb install apps/client/android/app/build/outputs/apk/release/app-release.apk

# 4. Create Play Store listing (4 hours)
# - Icon, screenshots, descriptions
# - Upload at https://play.google.com/console

# 5. Upload AAB (5 min)
# - Upload: apps/client/android/app/build/outputs/bundle/release/app-release.aab
# - Internal Testing track

# 6. Test with users (7 days)
# - 10-20 testers
# - Monitor crashes

# Done! 🎉
```

---

**Questions? Issues?**  
See [MOBILE_APK_PRODUCTION_ROADMAP.md](./MOBILE_APK_PRODUCTION_ROADMAP.md) for
detailed guides.

**Ready to start?**  
Begin with: `./scripts/generate-keystores.sh`
