# TapMoMo - Your Next Steps (2 Hours to Production)

**Current Status:** ✅ Edge Function Deployed | ⚠️ Database Migration Pending

---

## ⚡ Quick Deploy (Choose Your Path)

### PATH A: Via Supabase Dashboard (2 minutes)

**Fastest way to get running:**

1. **Open:** https://supabase.com/dashboard/project/vacltfdslodqybxojytc/sql/new

2. **Copy-paste this entire SQL file:**
   `/Users/jeanbosco/workspace/ibimina/supabase/migrations/20260303000000_apply_tapmomo_conditional.sql`

3. **Click "Run"**

4. **Verify:**
   ```sql
   SELECT COUNT(*) FROM app.tapmomo_merchants;  -- Should work without error
   ```

✅ **Done!** Skip to "Create Your First Merchant" below.

---

### PATH B: Via Command Line (5 minutes)

**If you prefer CLI:**

```bash
cd /Users/jeanbosco/workspace/ibimina

# Get your database password from Supabase Dashboard:
# Settings → Database → Connection string

psql "postgresql://postgres:[YOUR-PASSWORD]@db.vacltfdslodqybxojytc.supabase.co:5432/postgres" \
  -f supabase/migrations/20260303000000_apply_tapmomo_conditional.sql

# Verify:
psql "postgresql://..." -c "SELECT COUNT(*) FROM app.tapmomo_merchants;"
```

✅ **Done!** Continue to "Create Your First Merchant" below.

---

## 🏪 Create Your First Merchant (30 seconds)

Run this in Supabase SQL Editor:

```sql
-- Create a test merchant
INSERT INTO app.tapmomo_merchants (
    sacco_id,
    user_id,
    merchant_code,
    display_name,
    network,
    secret_key
) VALUES (
    (SELECT id FROM app.saccos ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
    'DEMO_MERCHANT',
    'Demo Merchant - Test Store',
    'MTN',
    app.generate_merchant_secret()
) RETURNING
    merchant_code,
    display_name,
    network,
    encode(secret_key, 'base64') AS secret_key_base64;
```

**Save the output!** You'll need:

- `merchant_code`: For configuring the Android app
- `secret_key_base64`: For HMAC signing

---

## 📱 Test with Android App (1 hour)

### Build & Install

```bash
cd /Users/jeanbosco/workspace/ibimina/apps/admin/android

# Build release APK
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

### Test NFC Payment

**You need:** 2 Android devices with NFC

**Device A (Merchant):**

1. Open app → TapMoMo → "Get Paid"
2. Enter amount: 2500 RWF
3. Tap "Activate NFC"
4. Keep screen on and unlocked

**Device B (Customer):**

1. Open app → TapMoMo → "Pay"
2. Hold back-to-back with Device A
3. Wait 2-3 seconds
4. Confirm payment
5. USSD launches automatically (or dialer opens)

**Verify in Admin PWA:**

- Go to: http://localhost:3100/tapmomo/transactions
- See your transaction!

---

## 🌐 Access Admin PWA

```bash
cd /Users/jeanbosco/workspace/ibimina
pnpm --filter @ibimina/admin dev
```

**URLs:**

- Dashboard: http://localhost:3100/tapmomo
- Merchants: http://localhost:3100/tapmomo/merchants
- Transactions: http://localhost:3100/tapmomo/transactions

---

## 🔍 Verify Everything Works

Run this checklist in Supabase SQL Editor:

```sql
-- ✅ Tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'app' AND tablename LIKE 'tapmomo%';
-- Expected: 2 rows

-- ✅ Functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'app' AND routine_name LIKE '%tapmomo%';
-- Expected: 4 rows

-- ✅ Edge Function deployed
SELECT 1;  -- Then test:
-- curl -X POST https://vacltfdslodqybxojytc.supabase.co/functions/v1/tapmomo-reconcile
-- Expected: {"error":"Invalid status"} (proves it's alive)

-- ✅ Cron job scheduled
SELECT * FROM cron.job WHERE jobname = 'expire-tapmomo-transactions';
-- Expected: 1 row

-- ✅ RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'app' AND tablename LIKE 'tapmomo%';
-- Expected: Both = true

-- ✅ Test merchant exists
SELECT merchant_code, display_name, network FROM app.tapmomo_merchants;
-- Expected: At least 1 row (your DEMO_MERCHANT)
```

---

## 📊 Monitor Your First Transaction

### Watch in Real-Time

**Option 1: Admin PWA (Live Updates)**

```
Open: http://localhost:3100/tapmomo/transactions
Watch the table auto-refresh as transaction status changes
```

**Option 2: SQL (Manual Refresh)**

```sql
SELECT
  merchant_code,
  amount / 100.0 AS amount_rwf,
  network,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) AS seconds_ago
FROM app.tapmomo_transaction_summary
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Option 3: Supabase Dashboard (With Logs)**

```
Open: https://supabase.com/dashboard/project/vacltfdslodqybxojytc/editor
Table: app.tapmomo_transactions
Filter: created_at > today
Sort: created_at DESC
```

---

## 🎯 Production Deployment (30 minutes)

### Step 1: Build Production APK (10 min)

```bash
cd apps/admin/android

# Generate signing key (if you don't have one)
keytool -genkey -v -keystore ibimina-release.keystore \
  -alias ibimina -keyalg RSA -keysize 2048 -validity 10000

# Configure gradle (apps/admin/android/app/build.gradle.kts):
android {
  signingConfigs {
    create("release") {
      storeFile = file("../ibimina-release.keystore")
      storePassword = "YOUR_PASSWORD"
      keyAlias = "ibimina"
      keyPassword = "YOUR_PASSWORD"
    }
  }
  buildTypes {
    release {
      signingConfig = signingConfigs.getByName("release")
    }
  }
}

# Build signed APK
./gradlew assembleRelease

# APK location:
# apps/admin/android/app/build/outputs/apk/release/app-release.apk
```

### Step 2: Create Production Merchants (10 min)

```sql
-- For each real merchant, run:
INSERT INTO app.tapmomo_merchants (
    sacco_id,
    user_id,
    merchant_code,
    display_name,
    network,
    secret_key
) VALUES (
    'ACTUAL_SACCO_UUID',
    'STAFF_USER_UUID',
    'MERCHANT_CODE',  -- e.g., 'STORE_001'
    'Merchant Display Name',
    'MTN',  -- or 'Airtel'
    app.generate_merchant_secret()
) RETURNING
    merchant_code,
    encode(secret_key, 'base64') AS secret_key_base64;

-- Save each merchant's code and key securely!
```

### Step 3: Configure Monitoring (10 min)

**Set up alerts in your monitoring system:**

```sql
-- Alert: Failed transactions > 5%
CREATE OR REPLACE FUNCTION app.check_tapmomo_health()
RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  threshold NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'failed_rate_1h'::TEXT,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
    5.0,
    CASE
      WHEN COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) > 5
      THEN 'ALERT'
      ELSE 'OK'
    END
  FROM app.tapmomo_transactions
  WHERE created_at > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Run every 5 minutes:
SELECT cron.schedule(
  'tapmomo-health-check',
  '*/5 * * * *',
  $$
  SELECT * FROM app.check_tapmomo_health();
  $$
);
```

---

## 🆘 Troubleshooting Quick Fixes

### "NFC not working"

```bash
# Check if NFC is enabled on device
adb shell settings get secure nfc_enabled
# Should return: 1

# Check app has NFC permission
adb shell dumpsys package com.your.app.package | grep android.permission.NFC
# Should see: granted=true

# View NFC logs
adb logcat -s TapMoMo:* NfcService:*
```

### "USSD not launching"

```kotlin
// Add fallback intent in app:
val ussdCode = "*182*8*1*MERCHANT*AMOUNT#"
val encoded = ussdCode.replace("#", "%23")
val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$encoded"))
startActivity(intent)
```

### "Transaction stuck in 'initiated'"

```sql
-- Manually settle it:
UPDATE app.tapmomo_transactions
SET status = 'settled',
    settled_at = NOW(),
    payer_hint = '+250788123456'
WHERE id = 'TRANSACTION_UUID';

-- Or use Edge Function:
curl -X POST \
  https://vacltfdslodqybxojytc.supabase.co/functions/v1/tapmomo-reconcile \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"TRANSACTION_UUID","status":"settled","payer_hint":"+250788123456"}'
```

---

## 📞 Get Help

**Comprehensive Guides:**

- Full Deployment: `TAPMOMO_FINAL_DEPLOYMENT_STATUS.md`
- DB Migration: `TAPMOMO_DB_MIGRATION_QUICK_FIX.md`
- Implementation Details: `TAPMOMO_IMPLEMENTATION_COMPLETE.md`

**Quick Reference:**

- Edge Function Endpoint:
  `https://vacltfdslodqybxojytc.supabase.co/functions/v1/tapmomo-reconcile`
- Supabase Dashboard:
  `https://supabase.com/dashboard/project/vacltfdslodqybxojytc`
- GitHub Repo: `/Users/jeanbosco/workspace/ibimina`

**Common Files:**

- Database Schema:
  `supabase/migrations/20260303000000_apply_tapmomo_conditional.sql`
- Edge Function: `supabase/functions/tapmomo-reconcile/index.ts`
- Android App: `apps/admin/android/`
- Admin PWA: `apps/admin/app/tapmomo/`

---

## ✅ Success Checklist

- [ ] Database migration applied (tables created)
- [ ] Edge Function deployed ✅ (already done!)
- [ ] Test merchant created with secret key saved
- [ ] Android APK built and installed on test devices
- [ ] NFC payment tested successfully (tap-to-pay works)
- [ ] USSD launches or dialer opens with code
- [ ] Transaction appears in Admin PWA
- [ ] SMS reconciliation tested (optional but recommended)

**When all checked:** 🎉 **You're production-ready!** 🎉

---

**Time to Complete:**

- Fast Path (Dashboard): ~30 minutes
- Full Path (CLI + Testing): ~2 hours
- Production Ready: +30 minutes

**Start here:** Open Supabase Dashboard SQL Editor → Run migration file → Create
merchant → Test!

---

**Need Help?** Read the comprehensive guides mentioned above or contact the
development team.

**Good luck! 🚀**
