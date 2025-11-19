# Multi-Tenancy Implementation

This directory contains the implementation of multi-tenant organizations with
Row-Level Security (RLS).

## Files

### Migration: `20251110100000_multitenancy.sql`

Implements the core multi-tenancy infrastructure:

- **Organizations table**: Hierarchical structure (District → SACCO/MFI)
- **Organization memberships**: User roles within organizations
- **Extended role enum**: Added DISTRICT_MANAGER, MFI_MANAGER, MFI_STAFF
- **org_id columns**: Added to all tenant tables (saccos, ikimina, members,
  payments, etc.)
- **RLS policies**: Updated to enforce tenant isolation
- **Helper functions**:
  - `is_platform_admin()`: Check if user is system admin
  - `user_org_ids()`: Get user's organization memberships
  - `user_accessible_org_ids()`: Get orgs accessible via hierarchy (for district
    managers)
  - `user_can_access_org(uuid)`: Check access to specific org

### Seed Data: `seed_multitenancy.sql`

Test data for development and testing:

- 1 District: Gasabo
- 2 SACCOs: Alpha, Beta (children of Gasabo)
- 1 MFI: Capital (child of Gasabo)
- 3 Ikimina: 2 in Alpha, 1 in Beta (app schema)
- 3 Digital groups + 8 digital group members (public schema) for Atlas
  experiences
- 8 Members: 5 in Alpha, 3 in Beta (app schema)
- TapMoMo merchants + 3 sample transactions to validate mobile money flows
- 3 loan products + 3 loan applications (approved, declined, under review
  states)
- 11 Test users (platform staff, client members, merchant operator)

Test credentials (password: `password123`):

- `seed.admin@test.ibimina.rw` (SYSTEM_ADMIN)
- `seed.district@test.ibimina.rw` (DISTRICT_MANAGER - sees all in Gasabo)
- `seed.sacco.alpha.manager@test.ibimina.rw` (SACCO_MANAGER - Alpha only)
- `seed.sacco.alpha.staff@test.ibimina.rw` (SACCO_STAFF - Alpha only)
- `seed.sacco.beta.manager@test.ibimina.rw` (SACCO_MANAGER - Beta only)
- `seed.mfi.manager@test.ibimina.rw` (MFI_MANAGER)
- `seed.mfi.staff@test.ibimina.rw` (MFI_STAFF)
- `seed.client.alpha.one@test.ibimina.rw` (MEMBER - Alpha groups)
- `seed.client.alpha.two@test.ibimina.rw` (MEMBER - Alpha groups)
- `seed.client.beta.one@test.ibimina.rw` (MEMBER - Beta groups)
- `seed.merchant.tapmomo@test.ibimina.rw` (MERCHANT - TapMoMo owner)

### Tests: `tests/rls/multitenancy_isolation.test.sql`

Comprehensive RLS tests ensuring:

1. System Admin sees all data
2. District Manager sees all child organizations (SACCOs, MFI)
3. SACCO staff sees only their SACCO data (no cross-tenant leakage)
4. Cross-tenant writes are blocked
5. Payment data is properly isolated

## Architecture

### Hierarchy

```
District (e.g., Gasabo)
├── SACCO Alpha (org_id: 20000...)
│   ├── Group 1
│   │   └── Members (Alice, Bob, Claire)
│   └── Group 2
│       └── Members (David, Eva)
├── SACCO Beta (org_id: 20000...)
│   └── Group 1
│       └── Members (Frank, Grace, Henry)
└── MFI Capital (org_id: 30000...)
```

### Access Control

- **SYSTEM_ADMIN**: Bypass - sees all data
- **DISTRICT_MANAGER**: Sees all organizations within their district (recursive)
- **SACCO_MANAGER/STAFF**: Sees only their SACCO's data
- **MFI_MANAGER/STAFF**: Sees only their MFI's data

### RLS Implementation

All tenant tables check:

1. Is user a platform admin? (bypass)
2. Does row's `org_id` match user's accessible orgs?
3. Fallback to legacy `sacco_id` checks for backwards compatibility

## Usage

### Running Migration

```bash
supabase migration up --linked
```

### Loading Seed Data

```bash
psql -U postgres -d your_db -f supabase/seed/seed_multitenancy.sql
```

### Running Tests

```bash
psql -U postgres -d your_db -f supabase/tests/rls/multitenancy_isolation.test.sql
```

## Backwards Compatibility

The migration maintains backwards compatibility:

- Existing SACCOs without `org_id` still work via legacy `sacco_id` checks
- `app.user_profiles` table still supported alongside `org_memberships`
- `app.current_sacco()` helper function still functional

## Security Notes

- All policies use SECURITY DEFINER functions to prevent privilege escalation
- Recursive hierarchy queries are optimized with indexes
- Cross-tenant leakage is prevented at the RLS layer
- Tests verify no data leakage between tenants
