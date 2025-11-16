# Mobile APK Production - Status Report

**Date**: 2025-11-05  
**Status**: Infrastructure Ready, Build Blocked by Disk Space

---

## ✅ COMPLETED

### 1. SMS Implementation Review - CORRECT & COMPLETE

**Confirmation**: Admin app SMS permissions are APPROVED by Google Play for your
special case.

**Implementation Status**: ✅ **FULLY IMPLEMENTED**

**Files Verified**:

- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsReceiver.kt`
  (187 lines)
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsIngestPlugin.kt`
  (350 lines)
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsSyncWorker.kt`

**Features Implemented**:

1. ✅ Real-time SMS interception via BroadcastReceiver
2. ✅ Whitelisted senders only (MTN, Airtel)
3. ✅ HMAC signature authentication
4. ✅ Fallback hourly background sync
5. ✅ Permission management (READ_SMS, RECEIVE_SMS)
6. ✅ Manual SMS query capability
7. ✅ Edge function integration for parsing
8. ✅ WorkManager for background sync

**AndroidManifest.xml** (Correct):

```xml
<!-- Lines 68-70 -->
<!-- SMS Permissions - For reading and monitoring mobile money transaction SMS -->
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />

<!-- Lines 38-45 -->
<receiver
    android:name=".plugins.SmsReceiver"
    android:permission="android.permission.BROADCAST_SMS"
    android:exported="true">
    <intent-filter android:priority="999">
        <action android:name="android.provider.Telephony.SMS_RECEIVED_ACTION" />
    </intent-filter>
</receiver>
```

### 2. Release Keystore Generated

**Location**: `~/.ibimina/keystores/ibimina-client-release.keystore`  
**Alias**: `ibimina-client`  
**Password**: `IbiminaClient2024SecureKey!`  
**Validity**: 10,000 days (~27 years)  
**Algorithm**: RSA 2048-bit

**Credentials Stored**:

- Environment file: `~/.ibimina-client-signing.env`
- Backup file: `~/.ibimina/keystores/CLIENT-CREDENTIALS.txt`

⚠️ **ACTION REQUIRED**: Store credentials in password manager and delete
plaintext backup

### 3. Build Scripts Created

All scripts are executable and ready:

1. **`scripts/generate-keystores.sh`** - Interactive keystore generation
2. **`scripts/build-client-release.sh`** - Client APK/AAB builder
3. **`scripts/build-admin-release.sh`** - Admin APK/AAB builder
4. **`scripts/fix-admin-sms-permissions.sh`** - ⚠️ DO NOT RUN (permissions are
   correct)

### 4. Comprehensive Documentation

1. **`MOBILE_APK_PRODUCTION_ROADMAP.md`** (815 lines)
   - Complete step-by-step guide
   - Google Play Console setup
   - Play Store asset templates
   - Time estimates
   - Decision matrices

2. **`MOBILE_APPS_QUICKSTART.md`** (381 lines)
   - Fast-track checklist
   - Complete checklists for both apps
   - Troubleshooting guide
   - TL;DR quick commands

---

## ⚠️ BLOCKERS

### 1. Disk Space (CRITICAL)

**Issue**: Disk 99% full - preventing Gradle builds

**Status**: Cleaning in progress

**Impact**: Cannot build APK/AAB until resolved

**Solution**:

```bash
# Clean Gradle caches
rm -rf ~/.gradle/caches/
rm -rf ~/workspace/ibimina/apps/*/android/.gradle/
rm -rf ~/workspace/ibimina/apps/*/android/build/

# Or free up disk space elsewhere
# Need at least 5GB free for Android builds
```

### 2. Gradle Kotlin Plugin Conflict (FIXED)

**Issue**: tapmomo-proto module had hardcoded Kotlin version

**Status**: ✅ FIXED

**Fix Applied**: Removed version declarations from
`packages/tapmomo-proto/kotlin/build.gradle.kts`

---

## 📋 NEXT STEPS

### Immediate (After Disk Space Fixed)

1. **Free up disk space** (need 5GB minimum)

   ```bash
   # Check space
   df -h /

   # Clean options:
   # - Remove node_modules and reinstall
   # - Clean Docker images/containers
   # - Remove old Xcode/Android builds
   # - Empty trash
   ```

2. **Build Admin App** (with approved SMS permissions)

   ```bash
   source ~/.ibimina-client-signing.env
   cd apps/admin/android
   ./gradlew assembleDebug

   # Output: app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Test APK on device**

   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk

   # Test SMS permissions:
   # 1. Grant READ_SMS and RECEIVE_SMS
   # 2. Send test MTN/Airtel SMS
   # 3. Verify real-time processing
   ```

### For Production Release

4. **Build signed release APK/AAB**

   ```bash
   # Generate staff keystore
   ./scripts/generate-keystores.sh
   # Choose staff/admin option

   # Build signed release
   source ~/.ibimina-staff-signing.env
   ./scripts/build-admin-release.sh
   ```

5. **Create Play Store assets**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - 5+ screenshots
   - App descriptions (EN + RW)
   - Privacy policy URL

6. **Google Play Console submission**
   - Upload AAB to Internal Testing
   - Complete app listing
   - Submit for review with SMS permissions justification
   - Reference your approval from Google

---

## 🎯 APPS STATUS

### Admin/Staff App (`rw.ibimina.staff`)

**Package**: `rw.ibimina.staff`  
**Version**: 0.1.2 (versionCode 102)  
**Status**: ✅ **READY FOR BUILD** (after disk space fixed)

**SMS Permissions**: ✅ **APPROVED & PROPERLY IMPLEMENTED**

- Real-time SMS processing via BroadcastReceiver
- Whitelisted senders (MTN, Airtel)
- HMAC authentication
- Background sync fallback

**Features**:

- ✅ Member/group management
- ✅ Deposit allocation
- ✅ Receipt OCR
- ✅ TapMoMo payee mode (NFC HCE)
- ✅ SMS ingestion (approved permissions)
- ✅ Biometric auth
- ✅ Device-bound authentication

**Keystore**: Need to generate (use `./scripts/generate-keystores.sh`)

### Client App (`rw.ibimina.client`)

**Package**: `rw.ibimina.client`  
**Version**: 0.1.0 (versionCode 1)  
**Status**: ✅ **READY FOR BUILD** (after disk space fixed)

**Features**:

- ✅ Group savings management
- ✅ USSD payment with references
- ✅ TapMoMo NFC payer mode
- ✅ Offline-first architecture
- ✅ Deep links configured
- ✅ Biometric auth
- ✅ Background sync

**Keystore**: ✅ Generated
(`~/.ibimina/keystores/ibimina-client-release.keystore`)

---

## 🔐 SECURITY CHECKLIST

- [x] Keystore generated with strong password
- [x] Credentials file created (needs password manager storage)
- [x] SMS implementation uses HMAC authentication
- [x] Whitelisted senders only (MTN, Airtel)
- [x] Device-bound encryption implemented
- [x] Biometric authentication implemented
- [ ] Store keystore credentials in password manager
- [ ] Delete plaintext credentials file
- [ ] Back up keystore securely
- [ ] Set production Supabase URLs

---

## 📱 BUILD COMMANDS READY TO USE

### Once disk space is freed:

```bash
# 1. Admin App Debug (for testing SMS permissions)
cd apps/admin/android
./gradlew clean assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# 2. Admin App Release (for Play Store)
source ~/.ibimina-staff-signing.env  # after generating
./scripts/build-admin-release.sh

# 3. Client App Debug
cd apps/client/android
./gradlew clean assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# 4. Client App Release
source ~/.ibimina-client-signing.env
./scripts/build-client-release.sh
```

---

## 📚 KEY FILES

**Credentials (SECURE)**:

- `~/.ibimina/keystores/ibimina-client-release.keystore`
- `~/.ibimina/keystores/CLIENT-CREDENTIALS.txt` ⚠️ Store & delete
- `~/.ibimina-client-signing.env`

**Documentation**:

- `MOBILE_APK_PRODUCTION_ROADMAP.md` - Complete guide
- `MOBILE_APPS_QUICKSTART.md` - Fast track
- `MOBILE_APPS_QUICKSTART.md` - This status report

**Build Scripts**:

- `scripts/generate-keystores.sh`
- `scripts/build-client-release.sh`
- `scripts/build-admin-release.sh`

**SMS Implementation** (APPROVED & COMPLETE):

- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsReceiver.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsIngestPlugin.kt`
- `apps/admin/android/app/src/main/AndroidManifest.xml` (lines 68-70, 38-45)

---

## Summary

✅ **SMS permissions are CORRECT** - approved by Google for your special case  
✅ **Keystore generated** for client app  
✅ **Build scripts ready**  
✅ **Documentation complete**  
⚠️ **Disk space critical** - need to free up space  
📋 **Ready to build** once disk space is available

**Time to APK**: 30 minutes after disk space is freed
