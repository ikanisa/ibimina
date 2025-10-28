# Multi-Tenancy Implementation - Test Plan

## Pre-deployment Validation

### 1. Migration Syntax Check ✓

- [x] All SQL statements are syntactically correct
- [x] All DO blocks are properly closed (9 blocks verified)
- [x] All referenced functions exist in prior migrations
- [x] All DROP statements use IF EXISTS
- [x] All CREATE statements use IF NOT EXISTS for idempotency

### 2. Dependency Check ✓

- [x] `public.set_updated_at()` exists (migration: 20251009121500)
- [x] `app.is_admin()` exists (migration: 20251018010458)
- [x] `app.current_sacco()` exists (migration: 20251018010458)
- [x] `auth.uid()` is Supabase built-in function
- [x] `auth.jwt()` is Supabase built-in function

### 3. Backwards Compatibility ✓

- [x] RLS policies check both `org_id` (new) and `sacco_id` (legacy)
- [x] `org_id` columns are nullable
- [x] Existing tests use `sacco_id` without `org_id` - will still work
- [x] `app.user_profiles` table maintained alongside `org_memberships`

## Post-deployment Validation

### 1. Migration Success

```bash
# Check migration applied successfully
SELECT * FROM public.organizations LIMIT 1;
SELECT * FROM public.org_memberships LIMIT 1;

# Verify org_id columns added
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('saccos', 'ikimina', 'members', 'payments')
AND column_name = 'org_id';

# Verify new enum values
SELECT unnest(enum_range(NULL::public.app_role));
```

### 2. Load Seed Data

```bash
# Execute seed file
psql -U postgres -d dbname -f supabase/seed/seed_multitenancy.sql

# Expected output:
# - 4 organizations created (1 district, 2 SACCOs, 1 MFI)
# - 2 SACCO records created
# - 3 groups created
# - 8 members created
# - 7 test users created
# - 6 organization memberships created
```

### 3. Run RLS Tests

```bash
# Execute RLS test file
psql -U postgres -d dbname -f supabase/tests/rls/multitenancy_isolation.test.sql

# Expected: All 7 tests pass
# Test 1: ✓ System Admin sees all data
# Test 2: ✓ District Manager sees all child orgs
# Test 3: ✓ Alpha staff sees only Alpha (no Beta data)
# Test 4: ✓ Beta manager sees only Beta (no Alpha data)
# Test 5: ✓ MFI staff doesn't see SACCO data
# Test 6: ✓ Cross-tenant write blocked
# Test 7: ✓ Payment isolation works
```

### 4. Existing Tests Regression

```bash
# Run existing RLS tests to ensure no breakage
psql -U postgres -d dbname -f supabase/tests/rls/sacco_staff_access.test.sql
psql -U postgres -d dbname -f supabase/tests/rls/payments_access.test.sql
psql -U postgres -d dbname -f supabase/tests/rls/recon_exceptions_access.test.sql
psql -U postgres -d dbname -f supabase/tests/rls/trusted_devices_access.test.sql
psql -U postgres -d dbname -f supabase/tests/rls/ops_tables_access.test.sql

# Expected: All existing tests still pass (backwards compatibility)
```

### 5. Manual Verification

#### Test System Admin Access

```sql
-- As admin user (70000000-0000-0000-0000-000000000001)
SELECT COUNT(*) FROM public.organizations; -- Should see 4
SELECT COUNT(*) FROM app.members; -- Should see 8
```

#### Test District Manager Access

```sql
-- As district manager (70000000-0000-0000-0000-000000000002)
SELECT COUNT(*) FROM app.saccos; -- Should see 2 (both SACCOs in district)
SELECT COUNT(*) FROM app.members; -- Should see 8 (all members in district)
```

#### Test SACCO Staff Isolation

```sql
-- As Alpha staff (70000000-0000-0000-0000-000000000004)
SELECT COUNT(*) FROM app.members WHERE org_id = '20000000-0000-0000-0000-000000000001'; -- Should see 5 (Alpha only)
SELECT COUNT(*) FROM app.members WHERE org_id = '20000000-0000-0000-0000-000000000002'; -- Should see 0 (Beta blocked)
```

#### Test Cross-tenant Write Prevention

```sql
-- As Alpha staff, try to insert Beta member
INSERT INTO app.members (ikimina_id, sacco_id, org_id, member_code, full_name, msisdn)
VALUES (
  '50000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  'HACK-001',
  'Unauthorized',
  '250700000000'
);
-- Expected: INSERT fails due to RLS policy
```

## Security Verification

### 1. No Cross-tenant Data Leakage

- [ ] Alpha staff cannot see Beta members
- [ ] Beta staff cannot see Alpha members
- [ ] MFI staff cannot see SACCO members
- [ ] No org can write to another org's data

### 2. Hierarchical Access Works

- [ ] District manager sees all SACCOs in district
- [ ] District manager sees all MFIs in district
- [ ] District manager can access child org data

### 3. Admin Bypass Works

- [ ] System admin sees all organizations
- [ ] System admin sees all members
- [ ] System admin can modify any data

## Rollback Plan

If issues are detected:

```sql
-- Drop new policies
DROP POLICY IF EXISTS sacco_select_multitenancy ON app.saccos;
DROP POLICY IF EXISTS sacco_modify_multitenancy ON app.saccos;
DROP POLICY IF EXISTS ikimina_select_multitenancy ON app.ikimina;
DROP POLICY IF EXISTS ikimina_modify_multitenancy ON app.ikimina;
DROP POLICY IF EXISTS members_select_multitenancy ON app.members;
DROP POLICY IF EXISTS members_modify_multitenancy ON app.members;
DROP POLICY IF EXISTS payments_select_multitenancy ON app.payments;
DROP POLICY IF EXISTS payments_insert_multitenancy ON app.payments;
DROP POLICY IF EXISTS payments_update_multitenancy ON app.payments;

-- Recreate old policies (from previous migrations)
CREATE POLICY sacco_select_staff ON app.saccos
  FOR SELECT USING (id = app.current_sacco());

CREATE POLICY sacco_select_admin ON app.saccos
  FOR SELECT USING (app.is_admin());

-- ... (restore other policies)

-- Drop new tables
DROP TABLE IF EXISTS public.org_memberships;
DROP TABLE IF EXISTS public.organizations;

-- Note: org_id columns can remain (nullable, no harm)
```

## Success Criteria

✅ All migrations apply without errors ✅ Seed data loads successfully ✅ All 7
new RLS tests pass ✅ All existing RLS tests still pass ✅ No cross-tenant data
leakage detected ✅ District manager can access child orgs ✅ System admin has
full access ✅ Backwards compatibility maintained

## Timeline

1. **Pre-merge**: Code review and syntax validation ✓
2. **Merge**: PR merged to main
3. **CI/CD**: Automatic deployment via GitHub Actions
4. **Validation**: Run test plan in staging environment
5. **Production**: Deploy to production after staging validation
