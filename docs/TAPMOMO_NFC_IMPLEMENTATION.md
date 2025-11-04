# TapMoMo NFC→USSD Integration Guide

## Overview

TapMoMo is a contactless NFC-based payment system that enables staff to accept
mobile money payments by simply tapping phones together. The system combines:

- **Android HCE (Host Card Emulation)**: Staff device acts as an NFC "card"
  transmitting payment details
- **NFC Reader Mode**: Payer device reads payment details via NFC
- **Automatic USSD**: Payer device automatically launches mobile money USSD code
- **Security**: HMAC-SHA256 signatures, timestamp validation, and nonce replay
  protection

## Architecture

```
┌─────────────────┐          ┌─────────────────┐
│   Staff Device  │   NFC    │  Payer Device   │
│   (Payee/HCE)   │◄────────►│   (Reader)      │
│                 │          │                 │
│  Arm Payment    │          │  Scan Payment   │
│  Details        │          │  Details        │
└────────┬────────┘          └────────┬────────┘
         │                            │
         │                            │
         ▼                            ▼
  ┌──────────────────────────────────────────┐
  │         Supabase Backend                  │
  │  - Merchant Registry                      │
  │  - Transaction Tracking                   │
  │  - Reconciliation API                     │
  └──────────────────────────────────────────┘
```

## Payload Format

### JSON Structure

```json
{
  "ver": 1,
  "network": "MTN",
  "merchantId": "123456",
  "currency": "RWF",
  "amount": 2500,
  "ref": "INV-2025-1101",
  "ts": 1730419200000,
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "sig": "base64_hmac_sha256_signature"
}
```

### Security Model

1. **Timestamp Validation**
   - TTL: 120 seconds (configurable)
   - Future skew allowed: 60 seconds
   - Rejects expired or future-dated payloads

2. **Nonce Replay Protection**
   - Each nonce is single-use
   - Cached for 10 minutes in Room database
   - Duplicate nonces rejected immediately

3. **HMAC Signature**
   - Algorithm: HMAC-SHA256
   - Canonical form: Minified JSON without `sig` field
   - Field order matters for canonicalization
   - Key: Per-merchant secret from Supabase

### Canonical Form for HMAC

```
{"ver":1,"network":"MTN","merchantId":"123456","currency":"RWF","amount":2500,"ref":"INV-2025-1101","ts":1730419200000,"nonce":"550e8400-e29b-41d4-a716-446655440000"}
```

**Rules:**

- No spaces, no newlines
- Exact field order: `ver`, `network`, `merchantId`, `currency`, `amount`, `ref`
  (if present), `ts`, `nonce`
- Omit `ref` field entirely if null/empty
- No trailing commas

## Android Implementation

### Components

#### 1. PayeeCardService (HCE)

Located:
`apps/admin/android/app/src/main/java/rw/ibimina/staff/tapmomo/nfc/PayeeCardService.kt`

Emulates an NFC Type-4 card with proprietary AID `F0494249494D494E41` ("IBIMINA"
in hex).

**Usage:**

```kotlin
// Arm payee mode for 60 seconds
val payload = Payload(...)
val json = JSONObject().apply {
    put("ver", payload.ver)
    put("network", payload.network)
    // ... other fields
}.toString()

PayeeCardService.ActivePayload.arm(json.toByteArray(Charsets.UTF_8), ttlMs = 60_000)
```

#### 2. Reader (NFC Reader Mode)

Located:
`apps/admin/android/app/src/main/java/rw/ibimina/staff/tapmomo/nfc/Reader.kt`

Reads NFC Type-4 cards using IsoDep and SELECT APDU command.

**Usage:**

```kotlin
val reader = Reader(activity,
    onJson = { json -> handlePayload(json) },
    onError = { error -> showError(error) }
)
reader.enable() // Start scanning
// ... user taps device
reader.disable() // Stop scanning
```

#### 3. Verifier

Located:
`apps/admin/android/app/src/main/java/rw/ibimina/staff/tapmomo/verify/Verifier.kt`

Validates payloads: timestamp, nonce, and HMAC signature.

**Usage:**

```kotlin
val verifier = Verifier(context)
val payload = verifier.parse(jsonString)
val result = verifier.validate(payload, merchantKey)

if (result.isSuccess) {
    // Proceed with payment
} else {
    // Show error: result.exceptionOrNull()?.message
}
```

#### 4. USSD Launcher

Located:
`apps/admin/android/app/src/main/java/rw/ibimina/staff/tapmomo/core/Ussd.kt`

Automatically launches mobile money USSD codes.

**Usage:**

```kotlin
val ussdCode = Ussd.build("MTN", "123456", 2500)
// Result: *182*8*1*123456*2500#

Ussd.launch(context, ussdCode, subscriptionId = null)
// Attempts TelephonyManager.sendUssdRequest (API 26+)
// Falls back to ACTION_DIAL if permission denied
```

**Dual-SIM Support:**

```kotlin
val subs = Ussd.activeSubscriptions(context)
// User selects subscription
Ussd.launch(context, ussdCode, subscriptionId = subs[0].subscriptionId)
```

### Permissions Required

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-feature android:name="android.hardware.nfc.hce" android:required="false" />
```

### Gradle Dependencies

```gradle
// app/build.gradle
dependencies {
    implementation "androidx.room:room-runtime:2.6.1"
    implementation "androidx.room:room-ktx:2.6.1"
    kapt "androidx.room:room-compiler:2.6.1"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"
}
```

## TypeScript/Capacitor Integration

### Plugin Interface

Located: `apps/admin/lib/capacitor/tapmomo.ts`

```typescript
import TapMoMo from "@/lib/capacitor/tapmomo";

// Check NFC availability
const { available, enabled, hceSupported } = await TapMoMo.checkNfcAvailable();

// Arm payee mode
const { success, nonce, expiresAt } = await TapMoMo.armPayee({
  network: "MTN",
  merchantId: "123456",
  amount: 2500,
  merchantKey: "secret-key",
  ttlSeconds: 60,
});

// Start reader mode
await TapMoMo.startReader();

// Listen for scanned payments
await TapMoMo.addListener("payloadReceived", (data) => {
  console.log("Payment received:", data);
  // { network, merchantId, amount, currency, ref, nonce }
});

await TapMoMo.addListener("readerError", (data) => {
  console.error("Reader error:", data.error);
});

// Launch USSD
await TapMoMo.launchUssd({
  network: "MTN",
  merchantId: "123456",
  amount: 2500,
});

// Stop reader
await TapMoMo.stopReader();

// Disarm payee
await TapMoMo.disarmPayee();
```

## Supabase Backend

### Database Schema

**Tables:**

- `tapmomo_merchants`: Registered merchants with HMAC secrets
- `tapmomo_transactions`: Payment transaction records

**Key Fields:**

- `merchant_code`: Unique identifier for each merchant (e.g., "123456")
- `secret_key`: Base64-encoded HMAC secret
- `nonce`: UUID for replay protection
- `status`: `initiated` → `pending` → `settled` / `failed`

### Edge Function: tapmomo-reconcile

**Endpoint:** `https://your-project.supabase.co/functions/v1/tapmomo-reconcile`

**Purpose:** Update transaction status when payment is confirmed

**Request:**

```json
{
  "merchant_code": "123456",
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "status": "settled",
  "payer_hint": "+250788123456"
}
```

**Response:**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "settled",
    "settled_at": "2025-11-03T15:00:00Z",
    ...
  }
}
```

### RLS Policies

- Users can only view/manage their own merchants
- Users can only view transactions for their merchants
- Service role can reconcile any transaction

## User Flows

### Flow 1: Staff Receives Payment (HCE Mode)

1. Staff opens app → TapMoMo → "Receive Payment"
2. Staff enters amount (e.g., 2500 RWF) or leaves empty for payer to enter
3. Staff taps "Activate NFC" → HCE armed for 60 seconds
4. Payer opens their app → "Pay with NFC"
5. Payer taps phone on staff's phone (back-to-back)
6. Payer's phone reads payment details via NFC
7. Payer confirms amount and SIM card
8. System automatically launches `*182*8*1*123456*2500#`
9. Payer enters PIN to complete payment
10. Transaction appears in both staff and payer apps

### Flow 2: Staff Scans Customer's Payment Code

1. Customer opens their payment app → generates NFC payment code
2. Staff opens app → TapMoMo → "Scan Payment"
3. Staff taps phone on customer's phone
4. Staff's phone verifies HMAC, timestamp, nonce
5. Staff confirms payment details
6. Transaction recorded in Supabase

## Testing

### Unit Tests

**Android:**

```kotlin
// CryptoTest.kt
class CryptoTest {
    @Test
    fun testCanonicalAndHmac() {
        val payload = Payload(...)
        val canon = Canonical.canonicalWithoutSig(payload)
        val sig = Hmac.sha256B64(key, canon)
        assertTrue(sig.isNotBlank())
    }
}
```

### Integration Tests

1. **HCE Activation Test**
   - Arm payee mode
   - Verify ActivePayload.isActive() returns true
   - Wait 60+ seconds
   - Verify isActive() returns false

2. **NFC Read Test**
   - Use two Android devices
   - Arm payee on device A
   - Scan with device B
   - Verify JSON payload matches

3. **Signature Verification Test**
   - Create payload with correct signature
   - Verify validation passes
   - Tamper with amount field
   - Verify validation fails

4. **Replay Protection Test**
   - Scan same payload twice within 10 minutes
   - Verify second scan is rejected

5. **USSD Launch Test**
   - Call launchUssd() with real SIM
   - On API 26+: verify sendUssdRequest called
   - On API < 26: verify ACTION_DIAL opens dialer

## Troubleshooting

### NFC Not Working

**Issue:** NFC tag not detected

**Solutions:**

- Ensure NFC enabled in phone settings
- Hold phones back-to-back (where NFC coil is)
- Keep phones steady for 1-2 seconds
- Try different positions/angles
- Some phone cases block NFC (remove case)

### HCE Not Activating

**Issue:** Payee mode doesn't activate

**Solutions:**

- Check `android.hardware.nfc.hce` feature exists
- Verify `BIND_NFC_SERVICE` permission in manifest
- Check logs for HCE service errors
- Ensure screen unlocked during NFC tap
- Restart app and try again

### USSD Doesn't Launch

**Issue:** USSD code doesn't dial automatically

**Solutions:**

- Grant `CALL_PHONE` permission
- On Dual-SIM: select correct SIM explicitly
- Some carriers block programmatic USSD (fallback to ACTION_DIAL)
- Test on real device (not emulator)
- Check carrier supports \*182# USSD code

### Signature Verification Fails

**Issue:** "Invalid signature" error

**Solutions:**

- Ensure merchant key matches in both devices
- Check clock synchronization (NTP)
- Verify canonical form exactly matches spec
- Check for extra spaces/newlines in JSON
- Validate field order in canonical form

### Nonce Replay Detected

**Issue:** "Duplicate payment request" error

**Solutions:**

- This is expected for replay protection
- Generate new nonce for each payment request
- Don't reuse same QR code/NFC payload
- Clear Room database if testing

## Network-Specific USSD Codes

### MTN Rwanda

```
*182*8*1*[merchant]*[amount]#
*182*8*1#  (user enters merchant + amount)
```

### Airtel Rwanda

```
*182*8*1*[merchant]*[amount]#
*182*8*1#  (user enters merchant + amount)
```

### Future Networks

Add to `Ussd.build()` function with network-specific codes.

## Security Best Practices

1. **Never log merchant secrets** in production
2. **Rotate merchant keys** periodically (every 90 days)
3. **Use TLS** for all Supabase connections
4. **Implement rate limiting** on armPayee (max 10 per minute)
5. **Monitor for anomalies**: sudden spike in failed validations
6. **Store secrets in Android Keystore** (not plain SharedPreferences)
7. **Validate amounts** match expected ranges (e.g., 100-1,000,000 RWF)
8. **Log all transactions** for audit trail

## Performance Optimization

1. **HCE Timeout**: 60 seconds balances UX and security
2. **Nonce Cleanup**: Room database auto-cleans nonces older than 10 minutes
3. **Payload Size**: Keep under 256 bytes for fast NFC read
4. **Background Sync**: Use WorkManager if reconciliation fails

## Future Enhancements

- [ ] QR code fallback if NFC unavailable
- [ ] Bluetooth LE as secondary transport
- [ ] Multi-currency support beyond RWF
- [ ] Partial payments and refunds
- [ ] Receipt generation and email delivery
- [ ] Analytics dashboard for merchants
- [ ] Push notifications for payment status
- [ ] iOS NFC reader support (CoreNFC)

## Reference

- **AID**: `F0494249494D494E41` (Proprietary, "IBIMINA" in hex)
- **TTL**: 120 seconds
- **Nonce Cache**: 10 minutes
- **HMAC**: SHA-256
- **Encoding**: UTF-8
- **JSON**: Minified, no spaces

---

**Last Updated:** 2025-11-03  
**Version:** 1.0.0  
**Platform:** Android 8.0+ (API 26+)
