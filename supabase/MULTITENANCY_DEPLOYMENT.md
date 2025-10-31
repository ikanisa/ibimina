# Multi-Tenancy Deployment Guide

This guide explains how to deploy and verify the multi-tenancy implementation.

## Overview

The multi-tenancy feature introduces a hierarchical organization structure with
Row-Level Security (RLS) to ensure proper data isolation between organizations.

### Architecture

```
District (e.g., Gasabo)
├── SACCO Alpha
│   ├── Group 1 (3 members)
│   └── Group 2 (2 members)
├── SACCO Beta
│   └── Group 1 (3 members)
└── MFI Capital
```

### Access Control Model

1. **SYSTEM_ADMIN**: Full access to all organizations and data (bypass RLS)
2. **DISTRICT_MANAGER**: Access to district and all child organizations
   (SACCOs/MFIs)
3. **SACCO_MANAGER/STAFF**: Access only to their specific SACCO's data
4. **MFI_MANAGER/STAFF**: Access only to their specific MFI's data

## Files

### 1. Migration: `supabase/migrations/20251110100000_multitenancy.sql`

Creates the core multi-tenancy infrastructure:

- `organizations` table with hierarchical structure
- `org_memberships` table for user-organization relationships
- `org_id` columns on all tenant tables
- RLS policies enforcing tenant isolation
- Helper functions for access control

### 2. Seed Data: `supabase/seed/seed_multitenancy.sql`

Provides test data for development and QA:

- 1 District: Gasabo
- 2 SACCOs: Alpha (5 members), Beta (3 members)
- 1 MFI: Capital
- 7 test users with different roles

### 3. RLS Tests: `supabase/tests/rls/multitenancy_isolation.test.sql`

Comprehensive tests verifying:

- System admin has full access
- District manager sees all child organizations
- SACCO staff cannot see other SACCO's data
- Cross-tenant writes are blocked
- Payment data is properly isolated

## Deployment Steps

### Step 1: Apply Migration

Apply the migration to create the multi-tenancy tables and RLS policies:

```bash
# Via Supabase CLI
supabase db push

# Or via SQL console
# Copy and paste the contents of supabase/migrations/20251110100000_multitenancy.sql
```

### Step 2: Load Seed Data (Optional)

For development and testing environments, load the seed data:

```bash
# Via psql
psql -d your_database_url -f supabase/seed/seed_multitenancy.sql

# Or via Supabase SQL Editor
# Copy and paste the contents of supabase/seed/seed_multitenancy.sql
```

Expected output:

```
Multi-tenancy Seed Data Summary
========================================
Organizations created: 4
  - 1 District (Gasabo)
  - 2 SACCOs (Alpha, Beta)
  - 1 MFI (Capital)
SACCO records created: 2
Groups (Ikimina) created: 3
Members created: 8
Test users created: 7
Organization memberships: 6
========================================
```

### Step 3: Run RLS Tests

Verify the RLS policies work correctly:

```bash
# Via test script
cd apps/admin
./scripts/test-rls.sh

# Or run individual test
psql -d your_database_url -f supabase/tests/rls/multitenancy_isolation.test.sql
```

Expected output:

```
==================== Running Multi-Tenancy RLS Tests ====================
Test 1: System Admin Access ✓
Test 2: District Manager Access ✓
Test 3: SACCO Alpha Staff (no cross-tenant leakage) ✓
Test 4: SACCO Beta Manager (no cross-tenant leakage) ✓
Test 5: MFI Staff (no SACCO data access) ✓
Test 6: Cross-tenant write prevention ✓
Test 7: Payment data isolation ✓
==================== All Multi-Tenancy RLS Tests Passed ✓ ====================
```

## Test User Credentials

All test users have password: `password123`

| Email                                    | Role             | Access Scope                |
| ---------------------------------------- | ---------------- | --------------------------- |
| seed.admin@test.ibimina.rw               | SYSTEM_ADMIN     | All data                    |
| seed.district@test.ibimina.rw            | DISTRICT_MANAGER | All orgs in Gasabo district |
| seed.sacco.alpha.manager@test.ibimina.rw | SACCO_MANAGER    | SACCO Alpha only            |
| seed.sacco.alpha.staff@test.ibimina.rw   | SACCO_STAFF      | SACCO Alpha only            |
| seed.sacco.beta.manager@test.ibimina.rw  | SACCO_MANAGER    | SACCO Beta only             |
| seed.mfi.manager@test.ibimina.rw         | MFI_MANAGER      | MFI Capital only            |
| seed.mfi.staff@test.ibimina.rw           | MFI_STAFF        | MFI Capital only            |

## Manual Verification

### Verify System Admin Access

Login as `seed.admin@test.ibimina.rw` and verify:

- Can see all 4 organizations
- Can see all 8 members
- Can see both SACCO Alpha and Beta data

### Verify District Manager Access

Login as `seed.district@test.ibimina.rw` and verify:

- Can see both SACCO Alpha and Beta
- Can see all 8 members (5 from Alpha, 3 from Beta)
- Can see MFI Capital

### Verify SACCO Staff Isolation

Login as `seed.sacco.alpha.staff@test.ibimina.rw` and verify:

- Can see only SACCO Alpha (1 SACCO)
- Can see only 5 members (from Alpha)
- **Cannot** see any Beta members (critical: no cross-tenant leakage)
- **Cannot** insert members into Beta

Login as `seed.sacco.beta.manager@test.ibimina.rw` and verify:

- Can see only SACCO Beta (1 SACCO)
- Can see only 3 members (from Beta)
- **Cannot** see any Alpha members (critical: no cross-tenant leakage)

### Verify MFI Isolation

Login as `seed.mfi.staff@test.ibimina.rw` and verify:

- **Cannot** see any SACCO members
- Only has access to MFI-specific data

## Production Deployment

### Pre-deployment Checklist

- [ ] Review migration SQL for any environment-specific adjustments
- [ ] Backup database before applying migration
- [ ] Test migration in staging environment first
- [ ] Verify all existing RLS tests still pass (backwards compatibility)

### Deployment Process

1. **Apply migration during maintenance window**

   ```bash
   supabase db push --linked
   ```

2. **Verify migration success**

   ```sql
   SELECT COUNT(*) FROM public.organizations; -- Should not error
   SELECT COUNT(*) FROM public.org_memberships; -- Should not error
   ```

3. **Do NOT load seed data in production**
   - Seed data is for development/testing only
   - Production organizations should be created through the application

4. **Run RLS tests to verify**
   ```bash
   ./apps/admin/scripts/test-rls.sh
   ```

### Rollback Plan

If issues are detected, rollback procedures are documented in:
`supabase/TEST_PLAN_MULTITENANCY.md` (Section: Rollback Plan)

## Backwards Compatibility

The implementation maintains full backwards compatibility:

- ✅ Existing SACCOs without `org_id` continue to work
- ✅ Legacy `sacco_id` checks remain functional
- ✅ `app.user_profiles` table still supported
- ✅ All existing RLS tests continue to pass

## Security Notes

- All policies use `SECURITY DEFINER` functions to prevent privilege escalation
- Recursive hierarchy queries are optimized with proper indexes
- Cross-tenant data leakage is prevented at the RLS layer
- Tests verify no data leakage between tenants

## Support

For issues or questions:

1. Review `supabase/README_MULTITENANCY.md` for architecture details
2. Check `supabase/TEST_PLAN_MULTITENANCY.md` for testing procedures
3. Examine RLS test output for specific access issues
