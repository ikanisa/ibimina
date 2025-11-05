# Mobile APK Production Roadmap

**Status**: Ready to Execute  
**Timeline**: 1-3 weeks depending on path chosen  
**Last Updated**: 2025-11-05

---

## 🚨 CRITICAL BLOCKERS IDENTIFIED

### 1. Admin App SMS Permissions (CRITICAL - MUST FIX)

**Issue**: Two manifests have banned SMS permissions that will cause **instant
Google Play rejection**

#### apps/admin/android/app/src/main/AndroidManifest.xml

**Lines 69-70 - REMOVE THESE:**

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

**Lines 38-45 - REMOVE THIS RECEIVER:**

```xml
<receiver
    android:name=".plugins.SmsReceiver"
    android:permission="android.permission.BROADCAST_SMS"
    android:exported="true">
    <intent-filter android:priority="999">
        <action android:name="android.provider.Telephony.SMS_RECEIVED" />
    </intent-filter>
</receiver>
```

#### apps/staff-mobile-android/app/src/main/AndroidManifest.xml

**Lines 9-10 - REMOVE THESE:**

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

**Lines 58-66 - REMOVE THIS RECEIVER:**

```xml
<receiver
    android:name=".sms.SmsReceiver"
    android:enabled="true"
    android:exported="true"
    android:permission="android.permission.BROADCAST_SMS">
    <intent-filter android:priority="999">
        <action android:name="android.provider.Telephony.SMS_RECEIVED" />
    </intent-filter>
</receiver>
```

**Why This Matters:**

- Google Play **banned** SMS/CALL_LOG permissions for non-default SMS/phone apps
  in October 2023
- Apps with these permissions are **auto-rejected** during review
- No exceptions, no appeals
- See: https://support.google.com/googleplay/android-developer/answer/10208820

**Correct Approach (Already in Client App):** The client app
(`apps/client/android/app/src/main/AndroidManifest.xml`) shows the RIGHT way:

- Line 113:
  `<!-- SMS User Consent API removes the need for SEND/RECEIVE/READ_SMS -->`
- Uses **Notification Listener Service** instead (lines 69-78)
- This is Google Play compliant and works better

---

## 📊 Current App Status

### Admin/Staff App (@ibimina/admin)

**Package**: `rw.ibimina.staff`  
**Version**: 0.1.2 (versionCode 102)  
**Type**: Capacitor-based (Ionic/Angular/React with native wrapper)

**Current State:**

- ✅ Build configuration complete (`apps/admin/android/app/build.gradle`)
- ✅ Signing config ready (environment variables supported)
- ✅ NFC HCE service configured (TapMoMo payee mode)
- ✅ Notification Listener pattern NOT used (problem!)
- 🚨 **BLOCKER**: Banned SMS permissions
- ⚠️ Missing: Release keystore
- ⚠️ Missing: Play Store assets

**Build Requirements:**

```bash
# Environment variables for signing
ANDROID_KEYSTORE_PATH=/path/to/ibimina-staff-release.keystore
ANDROID_KEYSTORE_PASSWORD=<store-password>
ANDROID_KEY_ALIAS=ibimina-staff
ANDROID_KEY_PASSWORD=<key-password>
ANDROID_VERSION_CODE=102
ANDROID_VERSION_NAME=0.1.2
```

### Client App (@ibimina/client)

**Package**: `rw.ibimina.client`  
**Version**: 0.1.0 (versionCode 1)  
**Type**: Capacitor-based with Jetpack Compose UI

**Current State:**

- ✅ Build configuration complete (`apps/client/android/app/build.gradle`)
- ✅ **Correct** Notification Listener Service approach (Google Play compliant)
- ✅ NFC HCE service configured
- ✅ Deep links configured (https://client.ibimina.rw, https://app.ibimina.rw)
- ✅ TapMoMo feature module integrated
- ⚠️ Missing: Release keystore
- ⚠️ Missing: Play Store assets
- ⚠️ Build config uses placeholder env vars (will work but need real values)

**Build Requirements:**

```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
HMAC_SHARED_SECRET=<your-secret>
ANDROID_KEYSTORE_PATH=/path/to/ibimina-client-release.keystore
ANDROID_KEYSTORE_PASSWORD=<store-password>
ANDROID_KEY_ALIAS=ibimina-client
ANDROID_KEY_PASSWORD=<key-password>
```

---

## 🎯 RECOMMENDED PATH: Two-Phase Approach

### Phase 1: Client App Only (1 week to Internal Testing)

**Why Client First:**

1. ✅ Already Google Play compliant (no banned permissions)
2. ✅ Revenue-generating (member deposits, USSD payments)
3. ✅ Larger user base (members vs staff)
4. ✅ Lower risk (staff can use PWA/direct APK)

**Timeline:**

- **Day 1-2**: Generate keystore, fix placeholder env vars, test build
- **Day 3**: Build signed APK, test on 3+ devices
- **Day 4**: Create Play Store listing (prepare assets)
- **Day 5**: Upload to Internal Testing track
- **Day 6-7**: Internal testing, fix issues, expand to beta

### Phase 2: Admin App (1-2 weeks after fixing SMS)

**Timeline:**

- **Week 1**: Fix SMS permissions, implement Notification Listener Service
- **Week 2**: Generate keystore, build, Play Store submission

**Alternative for Admin (Immediate):**

- Distribute via **direct APK download** from staff portal
- No Play Store review needed
- Staff devices can install from "Unknown Sources"
- Update via push notifications

---

## 📋 DETAILED EXECUTION PLAN

### STEP 1: Fix Admin App SMS Permissions (CRITICAL)

**Files to modify:**

1. `apps/admin/android/app/src/main/AndroidManifest.xml`
2. `apps/staff-mobile-android/app/src/main/AndroidManifest.xml` (if this is
   separate build)

**Changes:**

```xml
<!-- REMOVE these lines -->
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />

<!-- REMOVE SMS receiver -->
<receiver android:name=".plugins.SmsReceiver" ... />
<receiver android:name=".sms.SmsReceiver" ... />

<!-- ADD Notification Listener Service (like client app has) -->
<service
    android:name=".MoMoNotificationListener"
    android:label="@string/notification_listener_service_label"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>
```

**Implementation Required:**

- Create `MoMoNotificationListener.kt` class (copy from client app)
- Update SMS reading logic to use notifications instead
- Test with MTN/Airtel notifications
- Update user onboarding flow (grant notification access instead of SMS)

**Testing:**

```bash
# After changes
cd apps/admin/android
./gradlew assembleDebug
# Verify no SMS permissions in APK
aapt dump permissions app/build/outputs/apk/debug/app-debug.apk | grep SMS
# Should return nothing
```

---

### STEP 2: Generate Release Keystores

**For Client App:**

```bash
keytool -genkey -v \
  -keystore ibimina-client-release.keystore \
  -alias ibimina-client \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <generate-strong-password> \
  -keypass <generate-strong-password> \
  -dname "CN=Ibimina Client, OU=Mobile, O=Ibimina, L=Kigali, ST=Kigali, C=RW"
```

**For Admin/Staff App:**

```bash
keytool -genkey -v \
  -keystore ibimina-staff-release.keystore \
  -alias ibimina-staff \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <generate-strong-password> \
  -keypass <generate-strong-password> \
  -dname "CN=Ibimina Staff, OU=Mobile, O=Ibimina, L=Kigali, ST=Kigali, C=RW"
```

**CRITICAL: Store credentials securely**

```bash
# Create secure credential storage
echo "ANDROID_KEYSTORE_PASSWORD=<password>" > ~/.ibimina-client-signing.env
echo "ANDROID_KEY_PASSWORD=<password>" >> ~/.ibimina-client-signing.env
chmod 600 ~/.ibimina-client-signing.env

# DO NOT commit keystores to git
# Store in: 1Password, GitHub Secrets, or encrypted backup
```

---

### STEP 3: Configure Build Environment

**Client App Build Script:**

```bash
#!/bin/bash
# File: apps/client/android/build-release.sh

set -e

# Load signing credentials
source ~/.ibimina-client-signing.env

# Set build variables
export ANDROID_KEYSTORE_PATH="$(pwd)/ibimina-client-release.keystore"
export ANDROID_KEY_ALIAS="ibimina-client"
export NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export HMAC_SHARED_SECRET="<your-production-secret>"

# Build signed APK
cd "$(dirname "$0")"
./gradlew clean assembleRelease

# Verify signing
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk

# Output location
echo "✅ Signed APK: app/build/outputs/apk/release/app-release.apk"
ls -lh app/build/outputs/apk/release/app-release.apk
```

**Admin App Build Script:**

```bash
#!/bin/bash
# File: apps/admin/android/build-release.sh

set -e

# Load signing credentials
source ~/.ibimina-staff-signing.env

# Set build variables
export ANDROID_KEYSTORE_PATH="$(pwd)/ibimina-staff-release.keystore"
export ANDROID_KEY_ALIAS="ibimina-staff"
export ANDROID_KEYSTORE_PASSWORD
export ANDROID_KEY_PASSWORD
export ANDROID_VERSION_CODE="102"
export ANDROID_VERSION_NAME="0.1.2"

# Build signed APK
cd "$(dirname "$0")"
./gradlew clean assembleRelease

# Verify signing
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk

echo "✅ Signed APK: app/build/outputs/apk/release/app-release.apk"
```

---

### STEP 4: Build AAB for Play Store

**Why AAB (Android App Bundle)?**

- Required by Google Play since August 2021
- Smaller downloads (dynamic delivery)
- Automatic APK variants for different devices

**Build AAB:**

```bash
# Client App
cd apps/client/android
export ANDROID_KEYSTORE_PATH="$(pwd)/ibimina-client-release.keystore"
# ... other env vars ...
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

**Verify AAB:**

```bash
# Install bundletool
curl -L -o bundletool.jar \
  https://github.com/google/bundletool/releases/latest/download/bundletool-all-1.15.6.jar

# Generate universal APK from AAB (for testing)
java -jar bundletool.jar build-apks \
  --bundle=app/build/outputs/bundle/release/app-release.aab \
  --output=test-universal.apks \
  --mode=universal \
  --ks=ibimina-client-release.keystore \
  --ks-pass=pass:<password> \
  --ks-key-alias=ibimina-client \
  --key-pass=pass:<password>

# Install on device
java -jar bundletool.jar install-apks --apks=test-universal.apks
```

---

### STEP 5: Prepare Play Store Assets

**Required Assets (per app):**

1. **App Icon** (512x512 PNG, 32-bit, no transparency)
2. **Feature Graphic** (1024x500 PNG)
3. **Screenshots** (minimum 2, up to 8 per device type):
   - Phone: 1080x1920 to 1080x2960 (16:9 to 2:1 ratio)
   - 7-inch tablet: 1200x1920 minimum
   - 10-inch tablet: 1600x2560 minimum
4. **Privacy Policy URL** (required)
5. **App Description**:
   - Short (80 chars max)
   - Full (4000 chars max)
6. **Content Rating Questionnaire**
7. **Target Audience & Content**

**Client App Assets:**

```
assets/playstore/client/
├── icon-512.png
├── feature-graphic.png
├── screenshots/
│   ├── phone/
│   │   ├── 01-home.png
│   │   ├── 02-groups.png
│   │   ├── 03-pay-ussd.png
│   │   ├── 04-tapmomo-nfc.png
│   │   └── 05-statement.png
│   └── tablet/
│       └── (optional but recommended)
└── descriptions/
    ├── en-US.txt
    └── rw-RW.txt (Kinyarwanda)
```

---

### STEP 6: Google Play Console Setup

**Prerequisites:**

- [ ] Google Play Developer account ($25 one-time fee)
- [ ] Payment profile configured
- [ ] Identity verification complete (2-3 days)

**Create App Listing:**

1. **Go to Google Play Console** → Create App
2. **Fill Basic Info:**
   - App name: "Ibimina - SACCO Savings"
   - Default language: English (US)
   - App type: App
   - Free/Paid: Free
   - Category: Finance

3. **Store Presence:**
   - Upload icon, feature graphic, screenshots
   - Short description: "Save with your group, pay with USSD or NFC tap"
   - Full description: (see template below)
   - Contact email: support@ibimina.rw
   - Privacy policy: https://ibimina.rw/privacy

4. **Content Rating:**
   - Complete questionnaire (Finance app, no objectionable content)
   - Target: PEGI 3, ESRB Everyone

5. **Target Audience:**
   - Age: 18+ (financial services)
   - Countries: Rwanda (for now)

6. **App Access:**
   - All functionality available without restrictions
   - OR provide test credentials if login required

7. **Data Safety:**
   - Collects: Personal info (name, phone), Financial info (deposits)
   - Encryption: In transit and at rest
   - User controls: Can request deletion
   - Third parties: Supabase (infrastructure), PostHog (analytics)

---

### STEP 7: Upload to Internal Testing Track

**Internal Testing (First Step):**

- Up to 100 testers
- No review required
- Available immediately
- Good for initial QA

**Steps:**

1. Play Console → Your App → Testing → Internal Testing
2. Create Release → Upload AAB
3. Release name: "0.1.0 - Initial Internal Release"
4. Release notes:
   ```
   Initial internal testing release
   - Member onboarding and group management
   - USSD payment with reference tokens
   - TapMoMo NFC tap-to-pay
   - Offline-first with background sync
   - Biometric authentication
   ```
5. Add testers by email (or create public link)
6. Review → Start Rollout

**Testing Period:**

- Minimum: 3 days
- Recommended: 7 days
- Test on multiple devices (Samsung, Tecno, Infinix common in Rwanda)

---

### STEP 8: Production Release Checklist

**Before Production:**

- [ ] SMS permissions removed (admin app)
- [ ] 7+ days of internal testing with no crashes
- [ ] Tested on 5+ different devices
- [ ] All features work offline
- [ ] Deep links verified (client app)
- [ ] TapMoMo NFC tested on 3+ devices
- [ ] USSD codes dialed successfully on MTN & Airtel
- [ ] Biometric auth working
- [ ] Notification listener tested (admin app)
- [ ] Privacy policy published and linked
- [ ] Support email monitored
- [ ] Crash reporting configured (Sentry)
- [ ] Analytics configured (PostHog)
- [ ] Backend ready for load (Supabase)

**Rollout Strategy:**

1. **Closed Beta** (100-1000 users, 2 weeks)
   - Specific SACCOs/groups
   - Collect feedback
   - Fix critical bugs

2. **Open Beta** (no limit, 1 month)
   - Public opt-in
   - Monitor crash rate (<0.5%)
   - Monitor ANR rate (<0.1%)

3. **Production** (phased rollout)
   - Week 1: 10% of users
   - Week 2: 25% of users
   - Week 3: 50% of users
   - Week 4: 100% of users

---

## 🔧 TECHNICAL REQUIREMENTS

### Development Machine Setup

```bash
# Java 17 (required for Android Gradle Plugin 8.x)
java -version  # Must be 17.x

# Android SDK
export ANDROID_HOME=~/Library/Android/sdk  # macOS
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Gradle (managed by gradlew)
# No separate installation needed

# Capacitor CLI (already in project)
pnpm install  # Installs @capacitor/cli
```

### Minimum Device Requirements

**Client App:**

- Android 6.0 (API 23) or higher
- 50MB storage
- NFC hardware (optional, for TapMoMo)
- Camera (for ID upload)
- Biometric sensor (optional, fallback to PIN)

**Admin App:**

- Android 6.0 (API 23) or higher
- 75MB storage
- NFC hardware (required for TapMoMo payee mode)
- Camera (required for receipt OCR)
- Notification access (required for SMS alternative)

---

## 📱 App Description Templates

### Client App (Ibimina - SACCO Savings)

**Short Description:** "Save with your group, pay with USSD or NFC tap"

**Full Description:**

```
Ibimina brings your community savings group (ikimina) into the digital age. Save together, pay easily, track transparently.

✨ FEATURES

GROUP SAVINGS MADE EASY
• Join your ikimina digitally
• View group members and savings cycles
• Track your contributions and balance
• See group history and statements

PAY IN SECONDS
• USSD: Copy code, dial *182*7*1#, paste, pay
• TapMoMo NFC: Tap phones to pay (Android)
• Reference tokens ensure correct allocation
• Works with MTN Mobile Money & Airtel Money

ALWAYS IN SYNC
• Offline-first: works without internet
• Background sync when connected
• Real-time updates across devices
• Never miss a payment deadline

SECURE BY DEFAULT
• Biometric authentication (fingerprint/face)
• Device-bound encryption
• No passwords to remember
• Open-source security audited

BUILT FOR RWANDA
• Kinyarwanda & English
• Rwanda-specific USSD flows
• Works with Umurenge SACCOs
• Low data usage

🏦 ABOUT IBIMINA

Ibimina helps Umurenge SACCOs and MFIs formalize group savings while preserving the community discipline that makes ibimina work. Members keep their group structure; SACCOs get verified deposits and real-time visibility.

💬 SUPPORT
Email: support@ibimina.rw
Web: https://ibimina.rw
Privacy: https://ibimina.rw/privacy

🇷🇼 Made in Rwanda, for Rwanda
```

### Admin App (Ibimina Staff)

**Short Description:** "Manage SACCOs, groups, and mobile money deposits"

**Full Description:**

```
Ibimina Staff is the professional console for SACCO and MFI staff to manage ibimina (group savings), members, and mobile money deposit allocation.

✨ FEATURES FOR STAFF

MEMBER & GROUP MANAGEMENT
• Onboard members with digital ID verification
• Create and manage ibimina groups
• Set savings amounts, frequencies, cycles
• View member balances and history

DEPOSIT ALLOCATION
• Generate USSD reference tokens
• Monitor incoming mobile money deposits
• Allocate deposits to groups/members
• Handle exceptions and disputes

RECONCILIATION
• Upload MTN/Airtel statements (CSV/PDF)
• OCR receipt scanning
• Match deposits to references
• Export reports for accounting

TAPMOMO PAYEE MODE
• Accept NFC tap payments from members
• Generate time-limited payment requests
• HMAC signature verification
• One-time use, replay protection

DISTRICT OVERSIGHT
• Cross-SACCO dashboards
• Real-time deposit tracking
• Performance metrics
• Export for regulators

🔒 SECURITY
• Multi-factor authentication (MFA)
• Device-bound authentication
• Role-based access control
• Audit logs for all actions
• Notification listener (no SMS permissions)

📊 REPORTING
• Daily/weekly/monthly summaries
• Export to Excel/PDF
• Charts and trends
• Member statements

💬 SUPPORT
Email: staff-support@ibimina.rw
Training: https://ibimina.rw/training
Documentation: https://docs.ibimina.rw

🇷🇼 Professional tools for Rwanda's SACCOs
```

---

## ⏱️ TIME ESTIMATES

### Client App (Google Play Ready)

| Task                       | Time         | Blocker? |
| -------------------------- | ------------ | -------- |
| Generate keystore          | 30 min       | No       |
| Configure build env        | 1 hour       | No       |
| Build & test APK           | 2 hours      | No       |
| Build & verify AAB         | 1 hour       | No       |
| Create Play Store assets   | 4 hours      | No       |
| Set up Play Console        | 2 hours      | No       |
| Upload to Internal Testing | 30 min       | No       |
| **TOTAL**                  | **11 hours** | **None** |

### Admin App (After SMS Fix)

| Task                            | Time         | Blocker?       |
| ------------------------------- | ------------ | -------------- |
| Fix SMS permissions             | 4 hours      | **YES**        |
| Implement Notification Listener | 8 hours      | **YES**        |
| Test notification reading       | 4 hours      | **YES**        |
| Generate keystore               | 30 min       | No             |
| Configure build env             | 1 hour       | No             |
| Build & test APK                | 2 hours      | No             |
| Build & verify AAB              | 1 hour       | No             |
| Create Play Store assets        | 4 hours      | No             |
| Set up Play Console             | 2 hours      | No             |
| Upload to Internal Testing      | 30 min       | No             |
| **TOTAL**                       | **27 hours** | **3 blockers** |

---

## 🚦 DECISION MATRIX

### Option A: Client Only (Recommended)

**Timeline**: 1 week to Internal Testing  
**Pros:**

- ✅ No blockers
- ✅ Larger user base (revenue impact)
- ✅ Already Google Play compliant
- ✅ Staff can use PWA meanwhile

**Cons:**

- ⚠️ Staff features delayed (but PWA works)

**Risk**: Low

### Option B: Fix Admin First, Then Both

**Timeline**: 2-3 weeks to Internal Testing  
**Pros:**

- ✅ Both apps ready together
- ✅ Unified launch

**Cons:**

- ⚠️ 16-hour SMS fix required
- ⚠️ Higher risk (more code changes)
- ⚠️ Delays client revenue

**Risk**: Medium

### Option C: Client to Play Store, Admin via Direct APK

**Timeline**: 1 week client, no admin delay  
**Pros:**

- ✅ Client gets Play Store distribution
- ✅ Staff get app immediately (direct APK)
- ✅ No Google Play review for admin
- ✅ Faster iteration on staff features

**Cons:**

- ⚠️ Manual distribution for staff
- ⚠️ "Unknown Sources" required

**Risk**: Low

---

## 🎯 RECOMMENDED ACTION PLAN

### Immediate (This Week)

1. **Generate client app keystore** (30 min)
2. **Set up signing environment** (1 hour)
3. **Build signed client APK** (2 hours)
4. **Test on 3 devices** (4 hours)

**Deliverable**: Working signed APK for client app

### Week 2

1. **Create Play Store assets** (8 hours)
   - Icon, feature graphic
   - 5 screenshots
   - Descriptions in EN & RW
2. **Set up Google Play Console** (2 hours)
3. **Upload to Internal Testing** (1 hour)

**Deliverable**: Client app in Internal Testing

### Week 3

1. **Internal testing with 10-20 users** (ongoing)
2. **Fix critical bugs** (as needed)
3. **Start admin SMS fix** (if prioritizing Play Store)

**Deliverable**: Client app ready for Closed Beta

### Week 4+

1. **Client Closed Beta** (100 users)
2. **Admin app**: Either fix SMS for Play Store OR distribute direct APK
3. **Prepare for Open Beta**

---

## 📞 NEXT STEPS

**Choose your path:**

**Path 1: Fast Client Launch** (Recommended)

```bash
# Run this first
cd apps/client/android
./build-release.sh  # After creating script from Step 3

# Then prepare Play Store assets
# Then submit to Internal Testing
```

**Path 2: Fix Admin SMS First**

```bash
# 1. Edit manifests (remove SMS permissions)
# 2. Implement Notification Listener Service
# 3. Test thoroughly
# 4. Then build both apps
```

**Path 3: Client Play Store + Admin Direct APK**

```bash
# Client: Follow Path 1
# Admin: Build debug APK for direct distribution
cd apps/admin/android
./gradlew assembleDebug
# Distribute app-debug.apk via staff portal
```

---

## 🔐 SECURITY REMINDERS

1. **Never commit keystores to git**
2. **Store passwords in 1Password/Vault**
3. **Use different keystores for debug/release**
4. **Back up keystores securely** (lose them = lose ability to update apps)
5. **Enable Play App Signing** (Google manages final signing)
6. **Test on real devices, not just emulator**
7. **Monitor crash reports from day 1**

---

## 📚 REFERENCES

- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Google Play Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [SMS/Call Permissions Policy](https://support.google.com/googleplay/android-developer/answer/10208820)
- [Notification Listener Service](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [App Signing Best Practices](https://developer.android.com/studio/publish/app-signing)

---

**Questions? Need help with a specific step?**  
This roadmap is ready to execute. Choose your path and let's ship! 🚀
