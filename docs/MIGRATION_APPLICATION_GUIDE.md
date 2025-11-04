# Database Migration Application Guide

This guide explains how to apply pending database migrations to your Supabase instance.

## Overview

**Current State:**
- Over 100 SQL migration files in `supabase/migrations/`
- Some migrations may not be applied to your database yet
- One known problematic migration: `20251027200000_staff_management.sql`

## Quick Fix: Apply All Migrations

### Option 1: Using Supabase CLI (Recommended)

This is the safest and most reliable method.

```bash
# Ensure you're in the repository root
cd /home/runner/work/ibimina/ibimina

# Check which migrations are pending
supabase migration list

# Apply all pending migrations
supabase db push

# Verify all migrations applied
supabase migration list
```

**Expected Output:**
```
Applied 20250101000000_initial_schema.sql
Applied 20250115000000_auth_enhancements.sql
...
Applied 20260401000100_fix_increment_metric_function_name.sql

✅ All migrations applied successfully
```

### Option 2: Apply Specific Migration via Dashboard

If `supabase db push` fails due to a specific migration error, you can apply individual migrations:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   - Replace `YOUR_PROJECT_ID` with your actual project reference

2. **Copy Migration Contents:**
   ```bash
   # View the migration file
   cat supabase/migrations/20260303000000_apply_tapmomo_conditional.sql
   ```

3. **Paste into SQL Editor and Execute**

4. **Verify:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   ORDER BY version DESC
   LIMIT 10;
   ```

### Option 3: Using psql Command Line

If you prefer command-line database access:

```bash
# Get connection string from Supabase Dashboard
# Settings > Database > Connection string (Transaction mode)

# Apply a specific migration
psql "your-connection-string" \
  -f supabase/migrations/20260303000000_apply_tapmomo_conditional.sql

# Or apply all migrations in order
for migration in supabase/migrations/*.sql; do
  if [[ -f "$migration" ]]; then
    echo "Applying $migration..."
    psql "your-connection-string" -f "$migration" || {
      echo "Failed to apply $migration"
      exit 1
    }
  fi
done
```

## Known Issue: Staff Management Migration Error

**Problem:**
Migration `20251027200000_staff_management.sql` may fail with:
```
ERROR: ALTER action ADD COLUMN cannot be performed on relation "users"
This operation is not supported for views.
```

**Root Cause:**
The migration tries to alter `public.users` which is a VIEW over `auth.users`, not a table.

**Solution:**

1. **Check if the issue exists:**
   ```sql
   -- In Supabase SQL Editor or psql
   SELECT table_type 
   FROM information_schema.tables 
   WHERE table_name = 'users' AND table_schema = 'public';
   
   -- If result is 'VIEW', the issue exists
   ```

2. **Fix the migration (if needed):**
   
   **Option A:** Skip the problematic ALTER statements
   ```sql
   -- Comment out or remove lines that try to ALTER public.users
   -- ALTER TABLE public.users ADD COLUMN account_status ...
   ```

   **Option B:** Apply to the underlying table
   ```sql
   -- Change public.users to auth.users
   ALTER TABLE auth.users ADD COLUMN account_status text;
   ```

3. **Re-apply the fixed migration**

## TapMoMo Migrations

The TapMoMo feature requires specific migrations to be applied. See [../TAPMOMO_DB_MIGRATION_QUICK_FIX.md](../TAPMOMO_DB_MIGRATION_QUICK_FIX.md) for detailed instructions.

**Key TapMoMo Migrations:**
- `20260301000000_tapmomo_system.sql` - Core TapMoMo tables and functions
- `20260303000000_apply_tapmomo_conditional.sql` - Conditional application logic

For detailed TapMoMo migration instructions, see [../TAPMOMO_DB_MIGRATION_QUICK_FIX.md](../TAPMOMO_DB_MIGRATION_QUICK_FIX.md)

**Verify TapMoMo Schema:**
```sql
-- Check TapMoMo tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'app' AND tablename LIKE 'tapmomo%';

-- Expected results:
-- tapmomo_merchants
-- tapmomo_transactions

-- Check TapMoMo functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'app' AND routine_name LIKE '%tapmomo%';

-- Check cron job for transaction expiration
SELECT jobname, schedule FROM cron.job
WHERE jobname = 'expire-tapmomo-transactions';
```

## Migration Verification Checklist

After applying migrations, verify your database state:

### 1. Check Migration Status
```sql
SELECT version, name 
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```

### 2. Verify Core Tables
```sql
-- Check app schema tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'app'
ORDER BY tablename;

-- Should include:
-- allocations, countries, country_config, groups, group_members,
-- organizations, saccos, staff_profiles, tapmomo_merchants, 
-- tapmomo_transactions, tickets, uploads, etc.
```

### 3. Verify RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies
WHERE schemaname = 'app'
ORDER BY tablename, policyname;

-- Each table should have RLS policies for SELECT, INSERT, UPDATE, DELETE
```

### 4. Verify Edge Functions
```bash
# List deployed functions
supabase functions list

# Should include:
# - sms-reconcile
# - tapmomo-reconcile  
# - send-whatsapp-otp
# - verify-whatsapp-otp
# - qr-auth-init
# - qr-auth-verify
# ... and others
```

### 5. Test Database Access
```sql
-- Test a simple query against a core table
SELECT id, name FROM app.saccos LIMIT 5;

-- Test RLS works (should return only authorized data)
SELECT COUNT(*) FROM app.allocations;
```

## Troubleshooting

### "Migration X already applied"
This is safe to ignore - the migration was already run previously.

### "Schema 'app' does not exist"
The app schema hasn't been created yet. Check if earlier migrations created it:
```sql
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;
```

### "Extension 'pg_cron' is not available"
Enable the pg_cron extension in Supabase:
1. Go to: Database > Extensions in Supabase Dashboard
2. Search for "pg_cron"
3. Click "Enable"
4. Re-run the migration

### "Relation X does not exist"
A migration depends on a table from an earlier migration that hasn't been applied. Apply migrations in chronological order:
```bash
# Migrations are named with timestamps - apply in order
ls -1 supabase/migrations/*.sql | sort
```

### "Function X already exists"
The migration tried to create a function that already exists. Either:
- The migration was partially applied before
- Use `CREATE OR REPLACE FUNCTION` instead of `CREATE FUNCTION`

### Build fails with migration errors
If you're running `pnpm test:rls` or CI/CD pipelines and they fail due to migrations:

1. Ensure local Supabase is running:
   ```bash
   supabase start
   supabase status
   ```

2. Reset the local database:
   ```bash
   supabase db reset
   ```

3. This will apply all migrations fresh to the local database

## Automation

For CI/CD pipelines, migrations should be applied automatically:

```yaml
# Example GitHub Actions workflow
- name: Apply Supabase Migrations
  run: |
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    supabase db push
```

## Best Practices

1. **Always backup before applying migrations** (Supabase does this automatically)
2. **Test migrations in development first** before applying to production
3. **Apply migrations in chronological order** (timestamp in filename)
4. **Never modify existing migration files** - create new ones for changes
5. **Review migration contents** before applying to understand the changes
6. **Verify after each migration** to catch issues early

## Reference Documents

- [../TAPMOMO_DB_MIGRATION_QUICK_FIX.md](../TAPMOMO_DB_MIGRATION_QUICK_FIX.md) - TapMoMo-specific migration guide
- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Database Guide](./DB_GUIDE.md) - General database procedures

## Need Help?

If you encounter persistent migration issues:

1. Check Supabase Dashboard > Logs for error details
2. Review the migration file causing the issue
3. Consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Check if the issue is documented in [PRE_EXISTING_BUILD_ISSUES.md](../PRE_EXISTING_BUILD_ISSUES.md)

## Quick Reference

```bash
# List pending migrations
supabase migration list

# Apply all pending migrations
supabase db push

# Create a new migration
supabase migration new migration_name

# Reset local database (applies all migrations fresh)
supabase db reset

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```
