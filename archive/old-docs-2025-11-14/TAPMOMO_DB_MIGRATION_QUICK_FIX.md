# TapMoMo Database Migration - Quick Fix Guide

## Problem

The TapMoMo database schema cannot be applied via `supabase db push` because a
pre-existing migration (`20251027200000_staff_management.sql`) has an error:

```
ERROR: ALTER action ADD COLUMN cannot be performed on relation "users"
This operation is not supported for views.
```

## Solution: Apply TapMoMo Schema Directly

### Option 1: Via Supabase Dashboard (Recommended - 2 minutes)

1. **Open SQL Editor:**
   https://supabase.com/dashboard/project/vacltfdslodqybxojytc/sql/new

2. **Copy & Paste** the contents of:

   ```
   supabase/migrations/20260303000000_apply_tapmomo_conditional.sql
   ```

3. **Click "Run"**

4. **Verify Success:**

   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'app'
   AND tablename LIKE 'tapmomo%';
   ```

   Should return:

   ```
   tapmomo_merchants
   tapmomo_transactions
   ```

---

### Option 2: Via psql Command Line (5 minutes)

1. **Get connection string from Supabase Dashboard:**
   - Go to:
     https://supabase.com/dashboard/project/vacltfdslodqybxojytc/settings/database
   - Copy "Connection string" (transaction mode)
   - Replace `[YOUR-PASSWORD]` with your database password

2. **Apply migration:**

   ```bash
   cd /Users/jeanbosco/workspace/ibimina

   psql "postgresql://postgres.[YOUR-PASSWORD]@db.vacltfdslodqybxojytc.supabase.co:5432/postgres" \
     -f supabase/migrations/20260303000000_apply_tapmomo_conditional.sql
   ```

3. **Verify:**
   ```bash
   psql "postgresql://..." -c "\dt app.tapmomo*"
   ```

---

### Option 3: Fix the Broken Migration (10 minutes)

This fixes the root cause so all future migrations work properly.

1. **Edit the broken migration:**

   ```bash
   code supabase/migrations/20251027200000_staff_management.sql
   ```

2. **Find the problematic section** (around line 10-20):

   ```sql
   ALTER TABLE public.users ADD COLUMN account_status ...
   ```

3. **Change `public.users` to the actual table** (likely `auth.users` or wrapped
   in a check):

   ```sql
   -- Before:
   ALTER TABLE public.users ADD COLUMN account_status ...

   -- After (if public.users is a view over auth.users):
   -- Skip this alteration, or apply to underlying table:
   -- ALTER TABLE auth.users ADD COLUMN account_status ...
   -- OR just comment out if not needed:
   -- Commented out: ALTER TABLE public.users ...
   ```

4. **Apply all migrations:**
   ```bash
   supabase db push --include-all
   ```

---

## Verification Checklist

After applying the migration, verify everything is set up:

```sql
-- 1. Tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'app' AND tablename LIKE 'tapmomo%';
-- Expected: tapmomo_merchants, tapmomo_transactions

-- 2. Functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'app' AND routine_name LIKE '%tapmomo%';
-- Expected: expire_tapmomo_transactions, generate_merchant_secret,
--           create_tapmomo_transaction, update_tapmomo_updated_at

-- 3. View exists
SELECT table_name FROM information_schema.views
WHERE table_schema = 'app' AND table_name LIKE 'tapmomo%';
-- Expected: tapmomo_transaction_summary

-- 4. Indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'app' AND tablename LIKE 'tapmomo%';
-- Expected: Multiple indexes on merchants and transactions

-- 5. RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'app' AND tablename LIKE 'tapmomo%';
-- Expected: Both tables with rowsecurity = true

-- 6. Cron job scheduled
SELECT jobname, schedule FROM cron.job
WHERE jobname = 'expire-tapmomo-transactions';
-- Expected: 1 row, schedule = '*/5 * * * *'
```

---

## Test with Sample Data

After verification, create a test merchant:

```sql
-- Get a SACCO ID
SELECT id, name FROM app.saccos LIMIT 1;

-- Get a staff user ID
SELECT id, email FROM auth.users LIMIT 1;

-- Create test merchant (replace UUIDs with actual values from above)
INSERT INTO app.tapmomo_merchants (
    sacco_id,
    user_id,
    merchant_code,
    display_name,
    network,
    secret_key,
    is_active
) VALUES (
    'YOUR_SACCO_ID_HERE',
    'YOUR_USER_ID_HERE',
    'TEST_MERCHANT_001',
    'Test Merchant for Development',
    'MTN',
    app.generate_merchant_secret(),
    true
) RETURNING
    id,
    merchant_code,
    display_name,
    encode(secret_key, 'base64') AS secret_key_base64;
```

**Save the returned values** - you'll need:

- `merchant_code` for the Android app config
- `secret_key_base64` for HMAC signing

---

## Common Errors

### Error: "schema app does not exist"

**Solution:** The `app` schema hasn't been created yet. Check if earlier
migrations created it, or create manually:

```sql
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;
```

### Error: "relation app.saccos does not exist"

**Solution:** The TapMoMo schema depends on the SACCO system being set up first.
Ensure these tables exist:

- `app.saccos`
- `app.staff_profiles`
- `app.payments`

### Error: "extension pg_cron is not available"

**Solution:** pg_cron must be enabled in Supabase:

1. Go to:
   https://supabase.com/dashboard/project/vacltfdslodqybxojytc/database/extensions
2. Search for "pg_cron"
3. Click "Enable"
4. Re-run the migration

---

## Next Steps After Migration

1. **Create first merchant** (see "Test with Sample Data" above)

2. **Configure Android app** with merchant code and secret key

3. **Test NFC payment flow:**
   - Build and install Android APK
   - Test "Get Paid" (HCE payee)
   - Test "Pay" (NFC reader)
   - Verify transaction created in database

4. **Enable SMS reconciliation** (if not already done)

5. **Train staff** on using the mobile app

---

## Support

**Stuck?** Check:

1. Supabase Dashboard > Logs:
   https://supabase.com/dashboard/project/vacltfdslodqybxojytc/logs
2. Database logs in Dashboard > Database > Logs
3. Full deployment guide: `TAPMOMO_FINAL_DEPLOYMENT_STATUS.md`

**Still stuck?** Contact dev@yourdomain.com with:

- Error message
- SQL you tried to run
- Screenshot of Supabase logs
