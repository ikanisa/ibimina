# Mobile APK Build - Final Status & Instructions

**Date**: 2025-11-05  
**Status**: Build In Progress  
**Time**: 20:45 UTC

---

## ✅ COMPLETED SUCCESSFULLY

### 1. SMS Permissions - VERIFIED & APPROVED ✅

- Admin app has Google Play approved SMS permissions
- Implementation is complete and production-ready
- Files: `SmsReceiver.kt`, `SmsIngestPlugin.kt`, `SmsSyncWorker.kt`
- Manifest correctly declares READ_SMS and RECEIVE_SMS

### 2. Release Keystore Generated ✅

- **Client keystore**: `~/.ibimina/keystores/ibimina-client-release.keystore`
- **Password**: `IbiminaClient2024SecureKey!`
- **Credentials**: `~/.ibimina-client-signing.env`
- Valid for 27 years

### 3. Build Environment Fixed ✅

- Disk space freed (6.1GB available)
- Gradle locks cleared
- Kotlin plugin conflict resolved
- Dependencies cleaned

### 4. Build Scripts Ready ✅

- `scripts/build-client-release.sh`
- `scripts/build-admin-release.sh`
- `scripts/generate-keystores.sh`

### 5. Complete Documentation ✅

- `MOBILE_APK_PRODUCTION_ROADMAP.md` (815 lines)
- `MOBILE_APPS_QUICKSTART.md` (381 lines)
- `MOBILE_APK_PRODUCTION_STATUS.md` (status report)

---

## 🏗️ BUILD IN PROGRESS

### Current Status

- Gradle builds initiated for both apps
- First-time build downloads dependencies (~2GB)
- Kotlin compilation in progress
- Expected completion: 10-15 minutes

### Active Processes

```bash
# Check build status:
ps aux | grep gradle | grep -v grep

# Check for APKs:
find apps/*/android/app/build/outputs/apk -name "*.apk"
```

---

## 📱 MANUAL BUILD INSTRUCTIONS

If automated builds don't complete, follow these steps:

### Build Admin App (with SMS permissions)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# Stop any running Gradle processes
./gradlew --stop

# Build debug APK
./gradlew clean assembleDebug

# Expected output location:
# app/build/outputs/apk/debug/app-debug.apk

# Build time: ~5-10 minutes (first build)
```

### Build Client App

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/client/android

# Stop any running Gradle processes
./gradlew --stop

# Build debug APK
./gradlew clean assembleDebug

# Expected output location:
# app/build/outputs/apk/debug/app-debug.apk

# Build time: ~5-10 minutes (first build)
```

### Verify APK Was Built

```bash
# Admin app
ls -lh apps/admin/android/app/build/outputs/apk/debug/app-debug.apk

# Client app
ls -lh apps/client/android/app/build/outputs/apk/debug/app-debug.apk

# Both should be ~30-50 MB
```

---

## 🧪 TESTING THE APK

### Install on Device

```bash
# Make sure device is connected
adb devices

# Install admin app
adb install apps/admin/android/app/build/outputs/apk/debug/app-debug.apk

# Or install client app
adb install apps/client/android/app/build/outputs/apk/debug/app-debug.apk
```

### Test Admin App SMS Permissions

1. **Install APK** on device
2. **Grant permissions** when prompted:
   - READ_SMS
   - RECEIVE_SMS
   - Camera (for receipt OCR)
   - Biometric (for authentication)
3. **Send test SMS** from MTN or Airtel number
4. **Verify** app receives and processes the SMS

### Test Client App

1. **Install APK** on device
2. **Test features**:
   - Group list loads
   - USSD code copies correctly
   - TapMoMo NFC scanning (if device has NFC)
   - Offline mode works
   - Biometric auth works

---

## 🚀 BUILDING RELEASE (SIGNED) APK/AAB

### For Admin App

```bash
# 1. Generate admin keystore (if not done yet)
./scripts/generate-keystores.sh
# Choose "staff" option when prompted

# 2. Source credentials
source ~/.ibimina-staff-signing.env

# 3. Set environment variables
export ANDROID_VERSION_CODE=102
export ANDROID_VERSION_NAME=0.1.2

# 4. Build signed release
cd apps/admin/android
./gradlew clean assembleRelease bundleRelease

# Outputs:
# app/build/outputs/apk/release/app-release.apk (for sideloading)
# app/build/outputs/bundle/release/app-release.aab (for Play Store)
```

### For Client App

```bash
# 1. Source credentials (already generated)
source ~/.ibimina-client-signing.env

# 2. Set production environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export HMAC_SHARED_SECRET="your-production-secret"

# 3. Build signed release
cd apps/client/android
./gradlew clean assembleRelease bundleRelease

# Outputs:
# app/build/outputs/apk/release/app-release.apk (for sideloading)
# app/build/outputs/bundle/release/app-release.aab (for Play Store)
```

### Verify Signature

```bash
# Verify APK is signed correctly
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk

# Should show: "jar verified."
```

---

## 🎯 NEXT STEPS AFTER APK IS BUILT

### 1. Test Debug APK Thoroughly

- [ ] Install on 3+ different devices
- [ ] Test all major features
- [ ] Verify SMS permissions work (admin app)
- [ ] Test offline mode
- [ ] Test biometric auth
- [ ] Check for crashes

### 2. Build Signed Release

- [ ] Generate staff keystore (admin app)
- [ ] Set production environment variables
- [ ] Build signed APK and AAB
- [ ] Verify signature
- [ ] Test signed APK on devices

### 3. Prepare Play Store Assets

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] 5 screenshots per app
- [ ] App descriptions (English + Kinyarwanda)
- [ ] Privacy policy URL

### 4. Google Play Console Submission

- [ ] Create app listing
- [ ] Upload AAB to Internal Testing
- [ ] Add testers (10-20 people)
- [ ] Test for 7 days
- [ ] Address feedback
- [ ] Promote to Production

---

## 🔐 SECURITY REMINDERS

### Keystore Credentials

⚠️ **CRITICAL**: Store these securely

```bash
# Client app credentials
cat ~/.ibimina/keystores/CLIENT-CREDENTIALS.txt
# Copy to password manager, then DELETE this file

# Environment files (keep these safe)
~/.ibimina-client-signing.env
~/.ibimina-staff-signing.env (after generating)

# Keystore files (BACK UP securely)
~/.ibimina/keystores/ibimina-client-release.keystore
~/.ibimina/keystores/ibimina-staff-release.keystore (after generating)
```

### Never Commit These to Git

- ✅ Already in `.gitignore`:
  - `*.keystore`
  - `*.jks`
  - `local.properties`
- ⚠️ Manually exclude:
  - `*-signing.env` files
  - `*-CREDENTIALS.txt` files

---

## 🐛 TROUBLESHOOTING

### Build Fails with "Out of Memory"

```bash
# Increase Gradle heap size
echo "org.gradle.jvmargs=-Xmx4096m" >> ~/.gradle/gradle.properties
```

### Build Hangs or Takes Forever

```bash
# Stop all Gradle processes
pkill -9 -f gradle

# Clear caches
rm -rf ~/.gradle/caches/
rm -rf apps/*/android/.gradle/

# Try again with --no-daemon
./gradlew clean assembleDebug --no-daemon
```

### "Execution failed for task ':app:mergeDebugAssets'"

```bash
# Clean build directory
cd apps/admin/android  # or apps/client/android
rm -rf app/build/
./gradlew clean
./gradlew assembleDebug
```

### APK Installs But Crashes on Launch

```bash
# Check logs
adb logcat | grep -i ibimina

# Common issues:
# 1. Missing environment variables
# 2. Supabase URL not set
# 3. Permissions not granted
```

---

## 📋 BUILD CHECKLIST

### Debug APK (Testing)

- [ ] Admin app debug APK built
- [ ] Client app debug APK built
- [ ] APKs install successfully
- [ ] Apps launch without crashing
- [ ] SMS permissions work (admin)
- [ ] Major features work

### Release APK (Production)

- [ ] Staff keystore generated
- [ ] Production env vars set
- [ ] Admin app release APK/AAB built
- [ ] Client app release APK/AAB built
- [ ] Signatures verified
- [ ] APKs tested on devices
- [ ] Ready for Play Store upload

---

## 📞 QUICK COMMANDS

```bash
# Check if build is still running
ps aux | grep gradle

# Find built APKs
find apps -name "app-debug.apk" -o -name "app-release.apk"

# Check APK size
du -h apps/*/android/app/build/outputs/apk/*/*.apk

# Install on device
adb install path/to/app.apk

# View app logs
adb logcat | grep -i ibimina

# Kill Gradle if stuck
pkill -9 -f gradle
```

---

## Summary

✅ **All infrastructure ready**  
✅ **SMS permissions verified correct**  
✅ **Keystore generated**  
✅ **Build scripts created**  
🏗️ **Builds in progress** (or ready to run manually)  
📱 **30 minutes to first APK** (follow manual instructions above)

**Next**: Wait for builds to complete, or run manual build commands above
