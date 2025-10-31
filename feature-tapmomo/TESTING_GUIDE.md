# TapMoMo Library - Validation & Testing Guide

This document provides testing and validation procedures for the TapMoMo
library.

## Build Validation

### Gradle Build Test

Test building the library module:

```bash
cd apps/client/android
./gradlew :feature-tapmomo:assemble
```

Expected output:

- `BUILD SUCCESSFUL`
- AAR file generated in `feature-tapmomo/build/outputs/aar/`

### Dependency Check

Verify the module can be included in the host app:

```bash
./gradlew :app:dependencies | grep feature-tapmomo
```

Should show `project :feature-tapmomo` in dependency tree.

### Lint Check

```bash
./gradlew :feature-tapmomo:lint
```

Check for:

- No critical errors
- Resource prefix violations
- Manifest merge conflicts

### Unit Tests

```bash
./gradlew :feature-tapmomo:test
```

Tests included:

- `CryptoUtilsTest` - HMAC signing/verification
- `TimeUtilsTest` - TTL validation and countdown
- `UssdBuilderTest` - USSD code building and # encoding

All tests should pass.

## Manual Testing Checklist

### Prerequisites

- Two Android devices with NFC (API 26+)
- Active SIM cards (MTN or Airtel)
- NFC enabled in device settings

### Test Cases

#### TC1: NFC Availability Check

```kotlin
val available = TapMoMo.isNfcAvailable(context)
val enabled = TapMoMo.isNfcEnabled(context)
```

**Expected**: Returns correct NFC status

#### TC2: Library Initialization

```kotlin
TapMoMo.init(context, TapMoMoConfig(...))
```

**Expected**: No exceptions, config stored

#### TC3: Get Paid Screen Launch

```kotlin
TapMoMo.openGetPaid(
    context = context,
    amount = 2500,
    network = Network.MTN,
    merchantId = "123456"
)
```

**Expected**:

- Activity launches
- Form pre-filled with amount, merchant ID
- Network selector shows MTN selected

#### TC4: NFC Activation (Payee)

1. Launch Get Paid screen
2. Enter merchant ID and amount
3. Tap "Activate NFC"

**Expected**:

- Countdown timer starts
- Status shows "NFC Active"
- Screen stays on
- Timer counts down from 45 seconds

#### TC5: Pay Screen Launch

```kotlin
TapMoMo.openPay(context)
```

**Expected**:

- Activity launches
- Shows "Start Scanning" button
- NFC reader ready

#### TC6: NFC Reading (Payer)

1. Device A: Activate NFC in Get Paid
2. Device B: Start scanning in Pay screen
3. Tap devices back-to-back

**Expected**:

- Scanning indicator shows
- Payload read successfully
- Confirmation dialog appears with payment details
- Shows merchant ID, amount, network

#### TC7: SIM Picker (Dual-SIM)

Prerequisites: Device with 2 active SIM cards

**Expected**:

- Payment confirmation shows SIM picker
- Both SIMs listed with carrier names
- Can select either SIM

#### TC8: USSD Launch

1. Complete NFC read
2. Select SIM (if dual-SIM)
3. Confirm payment

**Expected**:

- USSD code launches
- Dialer opens with code
- Code format: `*182*8*1*{MERCHANT}*{AMOUNT}#`
- # symbol properly encoded

#### TC9: Security - TTL Expiration

1. Activate NFC on Device A
2. Wait for countdown to reach 0
3. Try to read from Device B

**Expected**:

- HCE service returns error
- "Payment expired" message shown

#### TC10: Security - Nonce Replay

1. Complete successful payment
2. Try to read same payload again (use saved data)

**Expected**:

- "Duplicate payment detected" error
- Payment rejected

#### TC11: Permission Requests

1. Fresh install
2. Launch Pay screen

**Expected**:

- Prompts for CALL_PHONE permission
- Prompts for READ_PHONE_STATE permission
- Clear explanation shown

#### TC12: Offline Operation

1. Disable internet
2. Complete NFC payment flow

**Expected**:

- NFC works without internet
- USSD launches successfully
- Transaction saved locally
- Supabase sync deferred

## Integration Testing

### Test in Host App

Add to `apps/client/android/app/build.gradle`:

```groovy
dependencies {
    implementation project(':feature-tapmomo')
}
```

Build the host app:

```bash
./gradlew :app:assembleDebug
```

Install and test:

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Capacitor Bridge Test

If integrating via Capacitor, test JavaScript bridge:

```javascript
const { TapMoMoPlugin } = Plugins;

// Test NFC check
const result = await TapMoMoPlugin.isNfcAvailable();
console.log("NFC:", result);

// Test payment launch
await TapMoMoPlugin.openGetPaid({
  amount: 1000,
  network: "MTN",
  merchantId: "123456",
});
```

## Backend Testing (Optional)

### Supabase Setup Test

1. Create test Supabase project
2. Run `backend/schema.sql`
3. Verify tables created:
   - `merchants`
   - `transactions`

4. Test RLS policies:

   ```sql
   -- Should fail (no auth)
   SELECT * FROM merchants;

   -- Should succeed after auth
   SET LOCAL jwt.claims.sub = '<user-uuid>';
   SELECT * FROM merchants;
   ```

### Edge Function Test

Deploy and test reconcile function:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/reconcile \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-uuid",
    "merchant_id": "merchant-uuid",
    "amount": 1000,
    "status": "settled"
  }'
```

Expected: `{"success": true, "transaction": {...}}`

## Performance Testing

### Memory Usage

Monitor memory during NFC operations:

```bash
adb shell dumpsys meminfo com.example.app | grep -A 10 TOTAL
```

Expected: < 50MB increase during NFC operations

### Battery Impact

Test with screen on (NFC active):

- HCE service: Minimal impact
- Reader mode: ~5-10% per hour

### Database Performance

Test with 1000+ transactions:

```kotlin
repeat(1000) {
    repository.insertTransaction(...)
}
val transactions = repository.getAllTransactions()
```

Expected: Query completes < 100ms

## Security Testing

### Signature Verification

Test with invalid signature:

```kotlin
val payload = PaymentPayload(
    ...,
    sig = "invalid-signature"
)

val result = validator.validate(payload, secret)
```

Expected: `ValidationResult.Invalid("Invalid payment signature")`

### TTL Validation

Test with expired timestamp:

```kotlin
val payload = PaymentPayload(
    ...,
    ts = System.currentTimeMillis() - 200_000 // 200 seconds ago
)

val result = validator.validate(payload)
```

Expected: `ValidationResult.Invalid("Payment expired")`

### Nonce Replay

Insert nonce, then try again:

```kotlin
repository.markNonceSeen("test-nonce")
val hasSeen = repository.hasSeenNonce("test-nonce")
```

Expected: `hasSeen == true`

## Regression Testing

After any code changes:

1. ✅ Run all unit tests
2. ✅ Build library AAR
3. ✅ Test NFC payee flow
4. ✅ Test NFC payer flow
5. ✅ Test USSD launch
6. ✅ Test permissions
7. ✅ Test dual-SIM picker
8. ✅ Verify ProGuard rules

## Known Limitations

1. **NFC Range**: ~4cm, requires good contact
2. **HCE Compatibility**: Some devices may not support HCE
3. **USSD Support**: Varies by carrier and Android version
4. **SIM Access**: Requires READ_PHONE_STATE permission
5. **Screen Lock**: HCE requires unlocked device

## Troubleshooting

### NFC Not Working

- Check `adb logcat | grep NFC`
- Verify HCE service in manifest
- Check device NFC settings
- Try different device position

### USSD Not Launching

- Check permission granted
- Test with manual USSD first
- Verify SIM card active
- Check Android version (API 26+)

### Build Errors

- Clean build: `./gradlew clean`
- Invalidate caches in Android Studio
- Check Kotlin version compatibility
- Verify KSP plugin version

### Signature Verification Fails

- Check secret key matches
- Verify message construction order
- Test with known-good signature
- Check Base64 encoding

## CI/CD Integration

Suggested CI steps:

```yaml
- name: Build library
  run: ./gradlew :feature-tapmomo:assembleRelease

- name: Run tests
  run: ./gradlew :feature-tapmomo:test

- name: Lint check
  run: ./gradlew :feature-tapmomo:lint

- name: Generate AAR
  run: ./gradlew :feature-tapmomo:bundleReleaseAar
```

## Documentation Verification

Checklist:

- ✅ README.md complete
- ✅ INTEGRATION_GUIDE.md with examples
- ✅ Backend README.md
- ✅ Inline KDoc comments
- ✅ Sample code snippets
- ✅ Error handling documented

## Pre-Release Checklist

Before marking as production-ready:

- [ ] All unit tests pass
- [ ] Manual testing completed on 2+ devices
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation reviewed
- [ ] ProGuard rules tested with R8
- [ ] Backend integration tested
- [ ] Sample app created
- [ ] API surface reviewed
- [ ] Version number set
- [ ] Changelog created

## Support

For issues found during testing:

1. Check this guide first
2. Review main README.md
3. Check logcat output
4. Open issue with details
