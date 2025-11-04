# TapMoMo NFC - Complete Deployment in 2 Hours

## Current Status

✅ Edge Function deployed  
⚠️ Database migration pending  
⚠️ Android build pending

---

## STEP 1: Apply Database Migration (15 min)

### Option A: Via Supabase Dashboard (Easiest)

```bash
# 1. Open SQL Editor
open https://supabase.com/dashboard/project/vacltfdslodqybxojytc/sql

# 2. Copy migration
cat supabase/migrations/20260301000000_tapmomo_system.sql | pbcopy

# 3. Paste into SQL Editor and click "RUN"

# 4. Record migration
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20260301000000');
```

### Option B: Via CLI (if network improves)

```bash
cd /Users/jeanbosco/workspace/ibimina
supabase db push
```

### Verify It Worked

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'app' AND table_name LIKE 'tapmomo%';

-- Should return:
-- tapmomo_merchants
-- tapmomo_transactions
```

---

## STEP 2: Create Test Merchant (5 min)

```sql
-- Get a SACCO ID (use any existing one)
SELECT id, name FROM app.saccos LIMIT 1;

-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Create merchant
INSERT INTO app.tapmomo_merchants (
  sacco_id,
  user_id,
  merchant_code,
  display_name,
  network,
  secret_key
) VALUES (
  'PASTE_SACCO_ID_HERE',
  'PASTE_USER_ID_HERE',
  'MERCHANT001',
  'Test Merchant - MTN',
  'MTN',
  app.generate_merchant_secret()
);

-- Get the merchant details (SAVE THIS!)
SELECT
  id,
  merchant_code,
  display_name,
  network,
  encode(secret_key, 'base64') as secret_key_base64
FROM app.tapmomo_merchants
WHERE merchant_code = 'MERCHANT001';
```

**⚠️ IMPORTANT:** Save the `secret_key_base64` - you'll need it in the Android
app!

---

## STEP 3: Test Edge Function (5 min)

```bash
# Get your anon key
ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env | cut -d'"' -f2)

# Test the reconcile function
curl -X POST \
  https://vacltfdslodqybxojytc.supabase.co/functions/v1/tapmomo-reconcile \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_code": "MERCHANT001",
    "nonce": "550e8400-e29b-41d4-a716-446655440000",
    "status": "settled",
    "payer_hint": "250788123456"
  }'

# Should fail with "transaction not found" - that's OK!
# It means the function is working.
```

---

## STEP 4: Fix Android Build Issues (30 min)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# 1. Update build.gradle (app level)
# Add this to android { } block:
cat >> app/build.gradle.kts << 'EOF'

android {
    configurations.all {
        resolutionStrategy {
            force("androidx.test:monitor:1.7.1")
            force("androidx.concurrent:concurrent-futures:1.1.0")
            force("androidx.tracing:tracing:1.1.0")
            force("androidx.activity:activity:1.9.2")
            force("org.jetbrains:annotations:23.0.0")
            force("androidx.lifecycle:lifecycle-common:2.6.2")
            force("androidx.arch.core:core-common:2.2.0")
            force("androidx.arch.core:core-runtime:2.2.0")
            force("androidx.startup:startup-runtime:1.1.1")
            force("org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:1.7.3")
        }
    }
}
EOF

# 2. Add Google's Maven repository
# In settings.gradle.kts:
cat >> settings.gradle.kts << 'EOF'
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
EOF

# 3. Clean and sync
./gradlew clean
./gradlew build
```

---

## STEP 5: Build Release APK (30 min)

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# 1. Build unsigned APK
./gradlew assembleRelease

# 2. Create keystore (if you don't have one)
keytool -genkey -v -keystore ibimina-release.jks \
  -alias ibimina -keyalg RSA -keysize 2048 -validity 10000

# 3. Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ibimina-release.jks \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  ibimina

# 4. Zipalign
~/Library/Android/sdk/build-tools/*/zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release.apk

# 5. Verify signature
~/Library/Android/sdk/build-tools/*/apksigner verify \
  app/build/outputs/apk/release/app-release.apk
```

**Output:** `app/build/outputs/apk/release/app-release.apk`

---

## STEP 6: Install APK on Test Device (10 min)

### Via USB (ADB)

```bash
# Enable USB debugging on your Android device

# Install APK
adb install app/build/outputs/apk/release/app-release.apk

# Launch app
adb shell am start -n com.ibimina.admin/.MainActivity
```

### Via Firebase App Distribution

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Distribute
firebase appdistribution:distribute \
  app/build/outputs/apk/release/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "testers" \
  --release-notes "TapMoMo NFC payment system - initial release"
```

---

## STEP 7: Configure Merchant Secret in App (5 min)

### In Android App Code

Edit `apps/admin/android/app/src/main/java/com/ibimina/admin/tapmomo/Config.kt`:

```kotlin
object TapMoMoConfig {
    // IMPORTANT: In production, fetch this from Supabase securely!
    // Never hardcode in source control!

    fun getMerchantSecret(merchantId: String): ByteArray? {
        // For now, get from secure storage or Supabase API
        // This is just for testing:
        return when (merchantId) {
            "MERCHANT001" -> Base64.decode("YOUR_BASE64_SECRET_HERE", Base64.NO_WRAP)
            else -> null
        }
    }
}
```

**⚠️ SECURITY NOTE:** In production, fetch merchant secrets from Supabase via
authenticated API call, not hardcoded!

---

## STEP 8: Test End-to-End (20 min)

### Test 1: Get Paid (Payee)

1. Open admin app on Device A
2. Navigate to "TapMoMo" → "Get Paid"
3. Select merchant: `MERCHANT001`
4. Enter amount: `2500` (25.00 RWF)
5. Tap "Activate NFC"
6. Keep screen on, device unlocked

### Test 2: Pay (Payer)

1. Open admin app on Device B (or iOS device)
2. Navigate to "TapMoMo" → "Pay"
3. Hold Device B near Device A's NFC coil
4. Should show payment details
5. Confirm payment
6. USSD should launch automatically: `*182*8*1*MERCHANT001*2500#`
7. Complete USSD transaction

### Test 3: Verify in Database

```sql
-- Check transaction was created
SELECT * FROM app.tapmomo_transactions
ORDER BY created_at DESC LIMIT 1;

-- Check status
SELECT
  t.id,
  t.ref,
  t.amount,
  t.status,
  t.network,
  m.merchant_code,
  m.display_name
FROM app.tapmomo_transactions t
JOIN app.tapmomo_merchants m ON t.merchant_id = m.id
ORDER BY t.created_at DESC;
```

---

## STEP 9: Staff Training (30 min)

### Get Paid Flow

1. Tell customer: "Please hold your phone near the terminal"
2. Tap "Get Paid" in app
3. Enter amount or select "Customer enters"
4. Tap "Activate NFC"
5. Keep device still and unlocked
6. Customer taps their phone
7. Customer completes USSD on their device
8. Verify payment in app (refreshes automatically)

### Pay Flow

1. Customer shows merchant their device (payee mode active)
2. Staff: "I'll scan your device"
3. Hold staff phone near customer device
4. Review payment details on screen
5. Confirm amount and merchant
6. Complete USSD (auto-launches)
7. Verify payment received

### Troubleshooting

- **No NFC detected:** Check device positioning (usually top edge or center
  back)
- **USSD doesn't launch:** Copy code and paste into dialer manually
- **Transaction not found:** Check merchant code matches
- **"Replay" error:** Nonce was used before - generate new payment request

---

## STEP 10: Enable Monitoring (20 min)

### Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/vacltfdslodqybxojytc/functions
2. Click "tapmomo-reconcile"
3. Enable "Logs" tab
4. Set up alerts for:
   - Error rate > 5%
   - Response time > 2s
   - 5xx errors

### Database Monitoring

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW app.tapmomo_monitoring AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (settled_at - initiated_at))) as avg_duration_seconds
FROM app.tapmomo_transactions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, status
ORDER BY hour DESC;

GRANT SELECT ON app.tapmomo_monitoring TO authenticated;
```

### Set Up Alerts

```sql
-- Alert for high failure rate
CREATE OR REPLACE FUNCTION app.check_tapmomo_failure_rate()
RETURNS void AS $$
DECLARE
  failure_rate NUMERIC;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100
  INTO failure_rate
  FROM app.tapmomo_transactions
  WHERE created_at > NOW() - INTERVAL '1 hour';

  IF failure_rate > 10 THEN
    -- Send alert (implement your notification system)
    RAISE WARNING 'TapMoMo failure rate: %% in last hour', failure_rate;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule check every 15 minutes
SELECT cron.schedule(
  'check-tapmomo-failures',
  '*/15 * * * *',
  'SELECT app.check_tapmomo_failure_rate();'
);
```

---

## ✅ Deployment Complete!

### Final Checklist

- [ ] Database migration applied
- [ ] Test merchant created
- [ ] Edge Function tested
- [ ] Android APK built and signed
- [ ] APK distributed to testers
- [ ] End-to-end test passed (Get Paid → Pay → USSD)
- [ ] Staff trained on both flows
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Production merchant accounts created

### Go-Live Checklist

- [ ] Remove test merchants
- [ ] Create real merchant accounts for each SACCO
- [ ] Distribute production APK to all staff
- [ ] Enable production logging
- [ ] Set up backup procedures
- [ ] Document incident response procedures
- [ ] Schedule post-launch review (1 week out)

---

## 🆘 Support

### Common Issues

**"Merchant not found"**

- Check merchant_code spelling
- Verify merchant is_active = true
- Check SACCO ID matches

**"HMAC verification failed"**

- Verify secret_key matches in app and database
- Check canonicalization (no extra spaces)
- Ensure timestamp within TTL (120 seconds)

**"Nonce replay detected"**

- Generate new payment request
- Don't reuse old QR codes/NFC payloads

**USSD doesn't work**

- Some carriers block sendUssdRequest - fallback to dialer
- Check SIM card is active
- Verify network code (MTN/Airtel)

---

**Total Time:** ~2 hours to complete all steps

**Ready to deploy!** 🚀
