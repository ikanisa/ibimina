# Android Mobile Authentication - Complete Implementation

## Overview

Complete mobile authentication system for the Ibimina Staff Android app
including:

1. **SMS Ingestion** - Automatic MoMo payment capture
2. **QR Scanner** - Biometric web login
3. **PIN Authentication** - 6-digit PIN for quick login

## Implementation Status: ✅ COMPLETE

---

## 1. SMS Ingestion (Android Only)

### Purpose

Automatically capture MoMo SMS messages to extract payment references and
allocate deposits to groups/members.

### Native Android Components

#### SmsIngestPlugin.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsIngestPlugin.kt`
- **Methods**:
  - `enable()` - Enable SMS ingestion
  - `disable()` - Disable SMS ingestion
  - `isEnabled()` - Check if enabled
  - `checkPermissions()` - Check SMS permissions
  - `requestPermissions()` - Request SMS permissions
  - `scheduleBackgroundSync()` - Schedule periodic sync
  - `ingestRecentMessages()` - Manually ingest recent SMS

#### SmsReceiver.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsReceiver.kt`
- **Purpose**: BroadcastReceiver for real-time SMS capture
- **Filters**: MTN, Airtel, payment keywords
- **Extracts**: sender, body, timestamp, amount, reference

#### SmsSyncWorker.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsSyncWorker.kt`
- **Purpose**: Background worker using WorkManager
- **Interval**: 15 minutes (configurable)
- **Function**: Syncs SMS messages to Supabase backend

### JavaScript/TypeScript Layer

#### sms-ingest.ts

- **Location**: `apps/admin/lib/native/sms-ingest.ts`
- **Purpose**: TypeScript wrapper for native plugin
- **Features**: Type-safe interface, error handling, logging

### User Interface

#### SMS Consent Page

- **Location**: `apps/admin/app/settings/sms-consent/page.tsx`
- **Features**:
  - Privacy information and consent flow
  - Permission request UI
  - Toggle to enable/disable
  - Shows permission status
  - Android only (shows message on web)

### Permissions Required

- `android.permission.RECEIVE_SMS`
- `android.permission.READ_SMS`

### Data Flow

```
SMS Received → SmsReceiver → Extract metadata →
→ Store locally → Background Worker →
→ POST /api/sms/ingest → Supabase allocations table
```

### Key Features

- ✅ Real-time SMS capture (BroadcastReceiver)
- ✅ Background sync (WorkManager, 15-min intervals)
- ✅ Privacy-first (user consent required)
- ✅ MoMo-specific filtering (MTN/Airtel)
- ✅ Reference extraction for allocation
- ✅ Offline-capable (local storage)

---

## 2. QR Code Scanner for Web Login

### Purpose

Allow staff to scan QR codes displayed on the web dashboard to authenticate
using biometric authentication.

### Components

#### Web Dashboard (QR Display)

- **qr-login.tsx** - `apps/admin/components/auth/qr-login.tsx`
  - Generates session challenge (nonce, expiry 2min, origin)
  - Displays QR code for mobile scanning
  - Polls for authentication completion
  - Auto-refreshes expired codes

#### Mobile App (QR Scanner)

- **qr-scanner-page.tsx** - `apps/admin/components/auth/qr-scanner-page.tsx`
  - Uses html5-qrcode library for camera access
  - Validates challenge structure and expiry
  - Triggers biometric authentication
  - Sends signed challenge to backend

- **scan-login/page.tsx** - `apps/admin/app/(main)/scan-login/page.tsx`
  - Protected route (requires authentication)
  - Renders QR scanner component
  - Instructions for users

### Device Authentication Flow

```
Web displays QR → Mobile scans QR →
→ Validate challenge (expiry, structure) →
→ Sign with device key (biometric prompt) →
→ POST /api/device-auth/verify →
→ Web session authenticated
```

### Native Android Support

#### DeviceAuthPlugin.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/DeviceAuthPlugin.kt`
- **Methods**:
  - `checkBiometricAvailable()`
  - `hasDeviceKey()`
  - `signChallenge()`
  - `validateChallenge()`

#### BiometricAuthHelper.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/BiometricAuthHelper.kt`
- **Purpose**: BiometricPrompt configuration
- **Supports**: Fingerprint, face authentication

#### ChallengeSigner.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/ChallengeSigner.kt`
- **Purpose**: Signs challenge with device private key
- **Algorithm**: EC P-256

#### DeviceKeyManager.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/DeviceKeyManager.kt`
- **Purpose**: Android Keystore integration
- **Security**: Keys never leave device

### Dependencies

- ✅ `html5-qrcode` - QR code scanning library

### Security Features

- **Time-limited challenges** - QR codes expire after 2 minutes
- **One-time use** - Each QR code can only be used once
- **Origin validation** - Ensures request from legitimate domain
- **Nonce verification** - Prevents replay attacks
- **Biometric gating** - Requires fingerprint/face to sign
- **Device key binding** - Private key never leaves device

---

## 3. PIN Authentication (6-Digit)

### Purpose

Allow staff to set up a 6-digit PIN for quick login after initial email/password
authentication.

### Native Android Components

#### PinAuthPlugin.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/PinAuthPlugin.kt`
- **Methods**:
  - `hasPin()` - Check if PIN is set
  - `setPin(pin: String)` - Set new PIN (encrypted)
  - `verifyPin(pin: String)` - Verify PIN
  - `deletePin()` - Remove PIN
  - `changePIN(oldPin: String, newPin: String)` - Change PIN

#### PinStorageHelper.kt

- **Location**:
  `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/PinStorageHelper.kt`
- **Purpose**: Secure PIN storage using Android Keystore
- **Security**:
  - PIN is hashed with PBKDF2
  - Salt stored securely
  - Protected by device encryption

### JavaScript/TypeScript Layer

#### pin-auth.ts

- **Location**: `apps/admin/lib/native/pin-auth.ts`
- **Purpose**: TypeScript wrapper for PIN plugin
- **Features**: Type-safe interface, validation

### User Interface

#### PIN Setup

- **Location**: `apps/admin/components/auth/pin-setup.tsx`
- **Features**:
  - 6-digit PIN entry (numeric keypad)
  - PIN confirmation
  - Strength indicator
  - Error handling

#### PIN Entry

- **Location**: `apps/admin/components/auth/pin-entry.tsx`
- **Features**:
  - 6-digit PIN input
  - Biometric fallback option
  - Attempts counter (max 5)
  - Auto-lock after failed attempts

### PIN Flow

```
First Login: Email/Password → Success →
→ Prompt "Set up PIN for quick login?" →
→ User enters PIN twice → PIN saved (encrypted)

Subsequent Login:
→ Show PIN entry screen →
→ User enters PIN → Verify → Success
→ OR "Use Biometric" button
```

### Security Features

- **Encrypted storage** - PIN hashed with PBKDF2-SHA256
- **Rate limiting** - Max 5 attempts before lockout
- **Auto-lock** - 15-minute lockout after failed attempts
- **Biometric fallback** - Can always use biometric
- **Device-bound** - PIN stored in device-encrypted storage

---

## API Endpoints

### SMS Ingestion

- **POST `/api/sms/ingest`**
  - Body:
    `{ messages: Array<{ sender, body, timestamp, amount?, reference? }> }`
  - Returns: `{ success: boolean, processed: number }`

### Device Authentication (QR Scanner)

- **POST `/api/device-auth/verify`**
  - Body: `{ session_id, signature, signed_message, device_id, challenge_info }`
  - Returns: `{ success: boolean, message?: string }`

- **GET `/api/device-auth/challenge`**
  - Returns: `{ ver, session_id, origin, nonce, exp, aud }`

### PIN Authentication

- **POST `/api/auth/pin/setup`**
  - Body: `{ pin_hash, salt, device_id }`
  - Returns: `{ success: boolean }`

- **POST `/api/auth/pin/verify`**
  - Body: `{ pin, device_id }`
  - Returns: `{ success: boolean, session_token?: string }`

---

## Authentication Flow

### First-Time Login

```
1. User opens app
2. Show login screen (email + password)
3. User enters credentials
4. POST /api/auth/login
5. Success → Show "Set up quick login" prompt
6. Options:
   - Set up 6-digit PIN
   - Enable biometric
   - Skip (email/password only)
7. If PIN: Show PIN setup screen
8. If Biometric: Trigger device enrollment
9. Navigate to dashboard
```

### Subsequent Logins

```
1. User opens app
2. Check for existing session:
   - If valid → Dashboard
   - If expired → Show auth options
3. Show Quick Login screen:
   - Enter 6-digit PIN button
   - Use Biometric button
   - Sign in with email/password (link)
4. User selects method
5. Verify → Success → Dashboard
```

---

## Testing Checklist

### SMS Ingestion

- [ ] Navigate to Settings → SMS Consent
- [ ] Grant SMS permissions
- [ ] Enable SMS ingestion
- [ ] Send test MoMo SMS
- [ ] Verify SMS captured in background
- [ ] Check Supabase allocations table
- [ ] Disable SMS ingestion
- [ ] Verify no more SMS captured

### QR Scanner

- [ ] Open web dashboard on computer
- [ ] Navigate to Device Login page
- [ ] QR code displayed and auto-refreshes
- [ ] Open mobile app → scan-login
- [ ] Grant camera permission
- [ ] Scan QR code
- [ ] Biometric prompt appears
- [ ] Authenticate with fingerprint/face
- [ ] Web dashboard shows success
- [ ] Test expired QR code
- [ ] Test invalid QR code

### PIN Authentication

- [ ] First login with email/password
- [ ] Prompt to set up PIN appears
- [ ] Set 6-digit PIN
- [ ] Confirm PIN
- [ ] PIN saved successfully
- [ ] Log out
- [ ] Reopen app
- [ ] PIN entry screen appears
- [ ] Enter correct PIN → Success
- [ ] Enter wrong PIN 3 times → Error shown
- [ ] Test "Use Biometric" fallback
- [ ] Test PIN change in settings
- [ ] Test PIN deletion

---

## Known Limitations

### SMS Ingestion

- **Android only** - iOS doesn't allow SMS access
- **Requires consent** - User must grant permissions
- **MoMo-specific** - Filters for MTN/Airtel
- **Format dependent** - Relies on consistent SMS format

### QR Scanner

- **Requires camera** - Device must have camera
- **Biometric required** - Device must support biometric
- **Network dependent** - Needs internet for verification
- **2-minute expiry** - Quick scanning required

### PIN Authentication

- **6 digits only** - Fixed length
- **Numeric only** - No alphanumeric
- **5-attempt limit** - Lockout after failures
- **Device-specific** - PIN doesn't sync across devices

---

## Files Modified/Created

### New Files

- `ANDROID_SMS_QR_PIN_IMPLEMENTATION.md` (this file)
- `apps/admin/components/auth/qr-scanner-page.tsx`
- `apps/admin/app/(main)/scan-login/page.tsx`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/PinAuthPlugin.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/PinStorageHelper.kt`
- `apps/admin/lib/native/pin-auth.ts`
- `apps/admin/components/auth/pin-setup.tsx`
- `apps/admin/components/auth/pin-entry.tsx`
- `apps/admin/components/auth/quick-login.tsx`

### Modified Files

- `apps/admin/package.json` (html5-qrcode added)
- `apps/admin/app/(auth)/login/page.tsx` (re-enabled, added PIN prompt)
- `pnpm-lock.yaml`

### Existing Files (Already Complete)

- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsIngestPlugin.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsReceiver.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/SmsSyncWorker.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/DeviceAuthPlugin.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/BiometricAuthHelper.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/ChallengeSigner.kt`
- `apps/admin/android/app/src/main/java/rw/ibimina/staff/plugins/auth/DeviceKeyManager.kt`
- `apps/admin/lib/native/sms-ingest.ts`
- `apps/admin/lib/native/device-auth.ts`
- `apps/admin/components/auth/qr-login.tsx`
- `apps/admin/app/settings/sms-consent/page.tsx`

---

## Deployment

### Build APK

```bash
cd apps/admin
pnpm build
npx cap sync android
cd android
./gradlew assembleRelease
```

### Install on Device

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Test on Device

1. Install APK
2. Open app
3. Test login flow
4. Test SMS consent
5. Test QR scanner
6. Test PIN setup
7. Test PIN login

---

## Summary

Complete mobile authentication system with:

- ✅ **SMS ingestion** for payment capture
- ✅ **QR scanner** for biometric web login
- ✅ **PIN authentication** for quick login
- ✅ **Biometric support** (fingerprint/face)
- ✅ **Session management**
- ✅ **Security best practices**

**Status**: Ready for testing and deployment  
**Date**: November 11, 2025
