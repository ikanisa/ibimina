# TapMoMo Quick Start Guide

## Setup (5 minutes)

### 1. Apply Database Migration

```bash
cd /Users/jeanbosco/workspace/ibimina

# Apply migration
supabase db push

# Or via SQL editor in Supabase dashboard
# Copy contents of: supabase/migrations/*_tapmomo_schema.sql
```

### 2. Deploy Edge Function

```bash
# Deploy reconciliation function
supabase functions deploy tapmomo-reconcile

# Test function
curl -X POST "https://your-project.supabase.co/functions/v1/tapmomo-reconcile" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_code": "123456",
    "nonce": "test-nonce-uuid",
    "status": "settled"
  }'
```

### 3. Create Test Merchant

```sql
-- In Supabase SQL Editor
INSERT INTO public.tapmomo_merchants (user_id, display_name, network, merchant_code, secret_key)
VALUES (
    'YOUR_USER_ID',  -- Replace with your auth.users.id
    'Test Merchant',
    'MTN',
    '123456',
    encode(gen_random_bytes(32), 'base64')  -- Auto-generates secret
);

-- Get the secret key
SELECT merchant_code, secret_key FROM public.tapmomo_merchants;
```

### 4. Build Android App

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin

# Sync Capacitor
pnpm exec cap sync android

# Open in Android Studio
pnpm exec cap open android

# Or build APK from command line
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Test Flow (2 devices required)

### Device A (Staff - Payee)

1. Open Ibimina Staff App
2. Navigate to TapMoMo → Receive Payment
3. Enter amount: `2500 RWF`
4. Select network: `MTN`
5. Tap **"Activate NFC"**
6. Keep screen on and unlocked
7. Phone vibrates when armed

### Device B (Customer - Payer)

1. Open Ibimina App (any app with TapMoMo reader)
2. Navigate to TapMoMo → Pay
3. Tap **"Scan Payment"**
4. Hold phone back-to-back with Device A
5. Wait for beep/vibration
6. Confirm payment details
7. Select SIM (if dual-SIM)
8. USSD automatically launches: `*182*8*1*123456*2500#`
9. Enter PIN to complete

## Manual Testing Checklist

- [ ] NFC available check passes
- [ ] HCE activation succeeds
- [ ] NFC read completes in < 2 seconds
- [ ] JSON payload validates (HMAC, timestamp, nonce)
- [ ] USSD launches automatically (API 26+)
- [ ] Dialer opens with code (API < 26)
- [ ] Replay protection blocks second scan
- [ ] Transaction appears in Supabase
- [ ] Expired payload (>2 min) rejected
- [ ] Future timestamp rejected
- [ ] Tampered signature rejected

## Troubleshooting

### "NFC not available"

- Ensure device has NFC hardware
- Enable NFC in Settings → Connections → NFC
- Some emulators don't support NFC (use real device)

### "Failed to read payment data"

- Hold phones closer
- Try different back-to-back positions
- Remove phone cases
- Ensure payee mode is active (60s window)
- Check logs: `adb logcat | grep TapMoMo`

### "USSD launch failed"

- Grant CALL_PHONE permission
- Test with real SIM card (not emulator)
- Some carriers block programmatic USSD
- Fallback to ACTION_DIAL should work

### "Invalid signature"

- Verify merchant key matches
- Check clock synchronization
- Ensure canonical form exactly matches spec
- View logs for expected vs actual signature

## Quick Code Snippets

### TypeScript: Receive Payment

```typescript
import TapMoMo from "@/lib/capacitor/tapmomo";

async function receivePayment(amount: number) {
  const { available, enabled } = await TapMoMo.checkNfcAvailable();

  if (!available || !enabled) {
    alert("NFC not available. Please enable NFC in settings.");
    return;
  }

  const { success, nonce } = await TapMoMo.armPayee({
    network: "MTN",
    merchantId: "123456",
    amount: amount,
    merchantKey: "your-secret-key", // Fetch from Supabase securely
    ttlSeconds: 60,
  });

  if (success) {
    console.log("NFC armed for 60 seconds. Nonce:", nonce);
    // Show UI: "Hold customer's phone near your phone"
  }
}
```

### TypeScript: Pay via NFC

```typescript
import TapMoMo from "@/lib/capacitor/tapmomo";

async function payViaNFC() {
  // Start scanning
  await TapMoMo.startReader();
  console.log("Hold near merchant device...");

  // Listen for scanned payment
  await TapMoMo.addListener("payloadReceived", async (data) => {
    console.log("Payment scanned:", data);

    // Confirm with user
    const confirmed = confirm(
      `Pay ${data.amount} ${data.currency} to ${data.merchantId}?`
    );

    if (confirmed) {
      // Get SIM cards
      const { subscriptions } = await TapMoMo.getActiveSubscriptions();
      const simId = subscriptions[0]?.subscriptionId;

      // Launch USSD
      await TapMoMo.launchUssd({
        network: data.network,
        merchantId: data.merchantId,
        amount: data.amount,
        subscriptionId: simId,
      });
    }

    await TapMoMo.stopReader();
  });

  await TapMoMo.addListener("readerError", (error) => {
    console.error("Read error:", error.error);
    alert(error.error);
  });
}
```

### Kotlin: Direct Usage

```kotlin
// Arm payee
val payload = Payload(
    ver = 1,
    network = "MTN",
    merchantId = "123456",
    currency = "RWF",
    amount = 2500,
    ref = null,
    ts = System.currentTimeMillis(),
    nonce = UUID.randomUUID().toString(),
    sig = ""
)

val json = JSONObject().apply {
    put("ver", payload.ver)
    put("network", payload.network)
    put("merchantId", payload.merchantId)
    put("currency", payload.currency)
    put("amount", payload.amount)
    put("ts", payload.ts)
    put("nonce", payload.nonce)
    // Sign payload
    val key = "your-secret-key".toByteArray()
    val canon = Canonical.canonicalWithoutSig(payload)
    val sig = Hmac.sha256B64(key, canon)
    put("sig", sig)
}.toString()

PayeeCardService.ActivePayload.arm(json.toByteArray(Charsets.UTF_8), ttlMs = 60_000)

// Read NFC
val reader = Reader(activity, onJson = { json ->
    val verifier = Verifier(context)
    val payload = verifier.parse(json)

    lifecycleScope.launch {
        val result = verifier.validate(payload, merchantKey)
        if (result.isSuccess) {
            // Launch USSD
            val ussdCode = Ussd.build(payload.network, payload.merchantId, payload.amount)
            Ussd.launch(context, ussdCode, null)
        } else {
            Toast.makeText(context, result.exceptionOrNull()?.message, Toast.LENGTH_LONG).show()
        }
    }
}, onError = { error ->
    Toast.makeText(context, error, Toast.LENGTH_LONG).show()
})

reader.enable()
```

## Next Steps

1. **Integrate into your app UI**
   - Add TapMoMo screens to navigation
   - Design payment confirmation dialogs
   - Add transaction history view

2. **Implement merchant key management**
   - Fetch keys securely from Supabase
   - Cache in Android Keystore
   - Rotate keys periodically

3. **Add reconciliation**
   - Listen for SMS confirmations
   - Call tapmomo-reconcile Edge Function
   - Update transaction status in real-time

4. **Enable notifications**
   - Push notifications for payment received
   - Local notifications for failed transactions
   - Badge counts for pending reconciliations

5. **Analytics**
   - Track successful payments
   - Monitor failure rates
   - Identify common error patterns

---

**Need Help?**

- Check logs: `adb logcat | grep -E "TapMoMo|NFC"`
- Review docs: `/docs/TAPMOMO_NFC_IMPLEMENTATION.md`
- Test with two physical devices (emulators don't support NFC)
