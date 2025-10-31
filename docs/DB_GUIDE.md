# Database Guide and Procedures

**Version**: 1.0  
**Last Updated**: 2025-10-29

This document provides guidelines for database management, migrations, and
procedures in the ibimina project.

## 📋 Overview

The project uses **PostgreSQL** via **Supabase** with the following components:

- Row Level Security (RLS) for data access control
- Database migrations for schema changes
- Edge Functions for serverless logic
- pgTAP for database testing

## 🗄️ Database Architecture

### Database Types

The project uses two databases:

1. **Supabase PostgreSQL** (Primary)
   - Location: Supabase Cloud
   - Purpose: Main application database
   - Access: Via Supabase client libraries
   - Security: Row Level Security (RLS) enabled

2. **Agent-Core DB** (Optional)
   - Purpose: Separate database for agent/worker services
   - Management: Prisma ORM
   - Migrations: Prisma migrations

### Schema Organization

```
public schema
├── Tables
│   ├── User-facing tables (RLS enabled)
│   ├── Admin tables (RLS enabled)
│   └── System tables
├── Views
│   ├── Materialized views (analytics)
│   └── Regular views
├── Functions
│   ├── RPC functions (callable from client)
│   └── Internal functions
├── Triggers
│   └── Automated actions
└── Policies
    └── RLS policies
```

## 🔄 Database Migrations

### Migration Standards (MANDATORY)

All migrations must follow these rules:

#### 1. Use Explicit Transactions

**Status**: MANDATORY

```sql
BEGIN;

-- Your migration statements here

COMMIT;
```

**Why**:

- Ensures atomicity (all-or-nothing)
- Allows rollback on errors
- Prevents partial migrations

**Enforcement**: CI validates migration format

#### 2. Migration Naming Convention

Format: `YYYYMMDDHHMMSS_descriptive_name.sql`

Examples:

```
20251029120000_add_user_preferences.sql
20251029120100_create_transactions_index.sql
20251029120200_update_rls_policies.sql
```

#### 3. Include Rollback Instructions

Always include rollback procedure in comments:

```sql
-- Migration: Add user preferences table
-- Rollback: DROP TABLE IF EXISTS user_preferences CASCADE;

BEGIN;

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

COMMIT;
```

#### 4. Idempotent Migrations

Migrations should be safe to run multiple times:

```sql
-- ✅ Good: Safe to run multiple times
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON my_table(column);
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_column TEXT;

-- ❌ Bad: Fails on second run
CREATE TABLE my_table (...);
CREATE INDEX idx_name ON my_table(column);
ALTER TABLE my_table ADD COLUMN new_column TEXT;
```

#### 5. Enable RLS on User-Facing Tables

```sql
BEGIN;

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MANDATORY: Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Define policies
CREATE POLICY "Users can view their own membership"
  ON members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships"
  ON members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

COMMIT;
```

### Migration Workflow

#### 1. Local Development

```bash
# Start local Supabase
supabase start

# Create new migration
supabase migration new descriptive_name

# Edit the migration file in supabase/migrations/

# Apply migration locally
supabase migration up

# Test migration
pnpm run test:rls

# Generate updated schema
supabase db dump -f supabase/latest_schema.sql

# Commit both migration and schema
git add supabase/migrations/
git add supabase/latest_schema.sql
git commit -m "feat(db): add user preferences table"
```

#### 2. Testing Migrations

Always test migrations before committing:

```bash
# Test migration can be applied
supabase migration up

# Test migration can be rolled back
supabase migration down

# Test RLS policies work correctly
pnpm run test:rls

# Test from clean state
supabase db reset
```

#### 3. Production Deployment

```bash
# Link to production project
supabase link --project-ref $SUPABASE_PROJECT_REF

# Review pending migrations
supabase migration list

# Apply migrations to production
supabase migration up --linked

# Verify schema matches
supabase db diff
```

**Or use CI/CD**:

- Migrations deploy automatically via GitHub Actions
- Workflow: `.github/workflows/supabase-deploy.yml`

### Schema Verification

#### Automated Schema Drift Detection

**Overview**: The `scripts/verify-schema.sh` script ensures your local
migrations stay in sync with remote databases.

**What it does**:

1. Builds a local schema snapshot from migration files
2. Pulls the remote schema from Supabase (no data)
3. Compares normalized SQL and fails if drift detected
4. Optionally refreshes `supabase/schema.sql` for version control
5. Dry-runs migrations to ensure they apply cleanly

**One-time setup** (local):

```bash
# 1) Install/update Supabase CLI
brew install supabase/tap/supabase || brew upgrade supabase

# 2) Link your project (once per environment)
supabase link --project-ref <YOUR_SUPABASE_REF>

# 3) Ensure standard paths exist
mkdir -p supabase/migrations
# supabase/config.toml should point to these defaults
```

**Running the verification**:

```bash
# Run locally
ENV_NAME=local scripts/verify-schema.sh

# Run for staging
ENV_NAME=staging PROJECT_REF=your-staging-ref scripts/verify-schema.sh

# Run for production
ENV_NAME=production PROJECT_REF=your-prod-ref scripts/verify-schema.sh
```

**Exit codes**:

- `0` - Success: No drift, migrations apply cleanly
- `1` - Supabase CLI not found or project not linked
- `2` - Schema drift detected between local and remote
- `3` - schema.sql was stale (CI only)

**Common failures and fixes**:

| Issue                       | Solution                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| "Schema drift detected"     | Run locally to see diff. If remote is ahead, create a corrective migration. If local is ahead, apply migrations to remote first. |
| "schema.sql was stale" (CI) | Run guard locally to refresh `supabase/schema.sql`, commit, and push.                                                            |
| Dry-run fails               | Fix the offending migration (bad dependency order, missing table reference, etc.), regenerate, and rerun.                        |

#### Pre-commit Hook (Optional)

Enable automatic schema verification before each commit:

```bash
# Enable git hooks
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

The pre-commit hook runs `scripts/verify-schema.sh` and automatically stages
`supabase/schema.sql` if updated.

#### GitHub Actions Integration

The `db-guard.yml` workflow runs on all PRs to `main`:

- Installs Supabase CLI
- Runs `scripts/verify-schema.sh`
- Fails the build if schema drift is detected
- Ensures schema.sql is up-to-date

**Workflow location**: `.github/workflows/db-guard.yml`

To require this check before merging, add it as a required status check in your
repository settings.

#### Keeping latest_schema.sql Updated

**Requirement**: Update `supabase/schema.sql` after every migration

The verification script automatically updates this file when run locally. You
can also generate it manually:

```bash
# Generate latest schema dump
supabase db dump -f supabase/schema.sql

# Review changes
git diff supabase/schema.sql

# Commit with migration
git add supabase/schema.sql
```

**Why**:

- Documents current schema state
- Enables schema comparison
- CI can detect drift
- Helps with debugging
- Code reviews can see the full schema impact

#### Schema Validation in CI

Multiple scripts work together to ensure schema quality:

1. **`scripts/verify-schema.sh`**: Detects drift, updates schema.sql
2. **`validate-production-readiness.sh`**: Checks migration format, RLS enabled
3. **`.github/workflows/db-guard.yml`**: Runs verification in CI
4. **`.github/workflows/supabase-deploy.yml`**: Applies migrations to
   environments

## 🔒 Row Level Security (RLS)

### RLS Standards (MANDATORY)

#### 1. Enable RLS on All User Tables

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Exceptions**: Only system/admin tables can skip RLS (document why)

#### 2. Define Explicit Policies

Never rely on implicit access. Define policies for:

- SELECT (viewing data)
- INSERT (creating data)
- UPDATE (modifying data)
- DELETE (removing data)

```sql
-- Read access
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (/* condition */);

-- Write access
CREATE POLICY "policy_name"
  ON table_name
  FOR INSERT
  WITH CHECK (/* condition */);

-- Update access
CREATE POLICY "policy_name"
  ON table_name
  FOR UPDATE
  USING (/* check before update */)
  WITH CHECK (/* check after update */);

-- Delete access
CREATE POLICY "policy_name"
  ON table_name
  FOR DELETE
  USING (/* condition */);
```

#### 3. Common Policy Patterns

**User sees own data**:

```sql
CREATE POLICY "users_own_data"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Organization members see org data**:

```sql
CREATE POLICY "org_members_see_org_data"
  ON table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = table_name.org_id
        AND org_members.user_id = auth.uid()
    )
  );
```

**Admins see everything**:

```sql
CREATE POLICY "admins_full_access"
  ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
```

**Public read, authenticated write**:

```sql
CREATE POLICY "public_read"
  ON table_name
  FOR SELECT
  USING (true);

CREATE POLICY "authenticated_write"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

#### 4. Test RLS Policies

**Required**: Test all RLS policies before production

```bash
# Run RLS test suite
pnpm run test:rls
```

Test files: `supabase/tests/*.sql`

Example test:

```sql
-- Test that users can only see their own data
BEGIN;
  -- Setup test data
  INSERT INTO members (user_id, name) VALUES
    ('user1-uuid', 'User 1'),
    ('user2-uuid', 'User 2');

  -- Test as user1
  SET request.jwt.claims = '{"sub": "user1-uuid"}';
  SELECT ok(
    (SELECT COUNT(*) FROM members) = 1,
    'User 1 can only see their own membership'
  );

  -- Test as user2
  SET request.jwt.claims = '{"sub": "user2-uuid"}';
  SELECT ok(
    (SELECT COUNT(*) FROM members) = 1,
    'User 2 can only see their own membership'
  );
ROLLBACK;
```

### RLS Bypass (Service Role)

**Warning**: Service role key bypasses ALL RLS policies

**Allowed uses**:

- Admin dashboard (backend)
- Background jobs
- Data migrations
- Analytics

**Forbidden uses**:

- Client-side code (never!)
- User-facing APIs without validation
- Untrusted contexts

## 📊 Database Functions and Procedures

### Creating RPC Functions

RPC (Remote Procedure Call) functions can be called from client code.

```sql
-- Create RPC function
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_transactions INT,
  total_amount NUMERIC
) AS $$
BEGIN
  -- Enforce RLS even in function
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_transactions,
    SUM(amount) as total_amount
  FROM transactions
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
```

**Security Considerations**:

- Use `SECURITY DEFINER` carefully (runs as owner)
- Validate inputs
- Check permissions manually if using SECURITY DEFINER
- Prefer `SECURITY INVOKER` (runs as caller)

## 🔍 Indexes and Performance

### Creating Indexes

```sql
-- Standard index
CREATE INDEX idx_table_column ON table_name(column_name);

-- Unique index
CREATE UNIQUE INDEX idx_table_unique ON table_name(column1, column2);

-- Partial index (conditional)
CREATE INDEX idx_table_active ON table_name(column)
WHERE status = 'active';

-- Trigram index (for text search)
CREATE INDEX idx_table_name_trgm ON table_name
USING gin(name gin_trgm_ops);
```

### Index Guidelines

1. **Index foreign keys**: Always index columns used in JOINs
2. **Index WHERE clauses**: Index columns frequently filtered
3. **Composite indexes**: Order matters (most selective first)
4. **Monitor usage**: Drop unused indexes

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## 🔄 Triggers

### Creating Triggers

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Common Trigger Uses

1. **Auto-update timestamps**
2. **Audit logging**
3. **Data validation**
4. **Cascade operations**
5. **Maintain aggregates**

## 📦 Data Types

### Recommended Types

| Use Case    | Type         | Example                                               |
| ----------- | ------------ | ----------------------------------------------------- |
| Primary Key | UUID         | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`       |
| Foreign Key | UUID         | `user_id UUID REFERENCES auth.users(id)`              |
| Timestamps  | TIMESTAMPTZ  | `created_at TIMESTAMPTZ DEFAULT NOW()`                |
| Money       | NUMERIC      | `amount NUMERIC(10,2)`                                |
| Text        | TEXT         | `name TEXT NOT NULL`                                  |
| JSON        | JSONB        | `metadata JSONB DEFAULT '{}'::jsonb`                  |
| Boolean     | BOOLEAN      | `is_active BOOLEAN DEFAULT true`                      |
| Enum        | TEXT + CHECK | `status TEXT CHECK (status IN ('pending', 'active'))` |

### UUID vs Serial

**Prefer UUID**:

- ✅ No sequence conflicts in distributed systems
- ✅ Non-sequential (security)
- ✅ Globally unique
- ✅ Can generate client-side

**Use Serial only if**:

- Sequential IDs required
- Legacy compatibility
- Extreme performance needs (rare)

## 🧪 Database Testing

### Test Structure

```
supabase/tests/
├── rls/
│   ├── members.test.sql
│   ├── transactions.test.sql
│   └── ...
└── functions/
    ├── calculate_balance.test.sql
    └── ...
```

### Writing Tests

```sql
-- supabase/tests/rls/members.test.sql
BEGIN;

-- Load pgTAP
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test plan
SELECT plan(5);

-- Test 1: Table exists
SELECT has_table('public', 'members', 'members table should exist');

-- Test 2: RLS enabled
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'members'),
  'RLS should be enabled on members table'
);

-- Test 3: Policies exist
SELECT policies_are(
  'public', 'members',
  ARRAY['users_own_data', 'admins_full_access'],
  'Expected RLS policies should exist'
);

-- Test 4: User sees own data only
-- Setup test users
SET request.jwt.claims = '{"sub": "user1"}';
-- Insert test data and verify

-- Test 5: Admin sees all data
SET request.jwt.claims = '{"sub": "admin1", "role": "admin"}';
-- Verify admin access

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
```

### Running Tests

```bash
# Run all database tests
pnpm run test:rls

# Run specific test file
psql $DATABASE_URL -f supabase/tests/rls/members.test.sql
```

## 🔄 Prisma (Agent-Core DB)

If using Prisma for Agent-Core DB:

```bash
# Generate Prisma client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name migration_name

# Apply migrations
pnpm prisma migrate deploy

# Reset database (dev only)
pnpm prisma migrate reset
```

## 📊 Monitoring and Maintenance

### Query Performance

```sql
-- Slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Table Sizes

```sql
-- Largest tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum and Analyze

```sql
-- Manual vacuum
VACUUM ANALYZE table_name;

-- Check last vacuum/analyze
SELECT
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables;
```

## 🚨 Common Issues

### Issue: Migration Fails to Apply

**Symptoms**:

```
ERROR: relation "table_name" already exists
```

**Solutions**:

1. Make migrations idempotent (use `IF NOT EXISTS`)
2. Check migration order
3. Verify database state before migration

### Issue: RLS Blocks Expected Access

**Symptoms**:

```
Error: new row violates row-level security policy
```

**Solutions**:

1. Review RLS policies: `\d+ table_name` in psql
2. Check user context: `SELECT auth.uid()`
3. Verify user roles and permissions
4. Test policies with `pnpm run test:rls`

### Issue: Slow Queries

**Symptoms**: Queries taking > 1 second

**Solutions**:

1. Add indexes on filtered columns
2. Use EXPLAIN ANALYZE to find bottlenecks
3. Optimize JOIN conditions
4. Consider materialized views for analytics

## 📋 Daily Operational Habits

Follow these practices to maintain database integrity:

### 1. Never Hand-Edit Production

❌ **Never**:

- Make manual changes directly in production database
- Run ad-hoc SQL in production without proper migration
- Skip the migration process "just this once"

✅ **Always**:

- Create a migration for every schema change
- Test migrations locally first
- Apply via CI/CD or `supabase migration up --linked`

### 2. Every DB Change = Migration

All schema changes must go through migrations:

```bash
# Create migration
supabase migration new descriptive_name

# Edit migration file
# Apply locally
supabase migration up

# Test
pnpm run test:rls

# Commit
git add supabase/migrations/
git commit -m "feat(db): descriptive change"
```

### 3. Run Guard Scripts

Run verification before committing:

```bash
# Before commit
ENV_NAME=local scripts/verify-schema.sh

# Or use pre-commit hook (automatic)
git config core.hooksPath .githooks
```

### 4. Monitor CI/CD

- ✅ Ensure `db-guard.yml` passes on all PRs
- ✅ Review schema.sql changes in PRs
- ✅ Check `supabase-deploy.yml` succeeds on merge

### 5. Regular Maintenance

```bash
# Weekly: Check migration status
supabase migration list

# Weekly: Verify no drift
ENV_NAME=staging scripts/verify-schema.sh

# Monthly: Review unused indexes
# Monthly: Check slow queries
```

## 🔗 Related Documentation

- [Ground Rules](GROUND_RULES.md) - Database standards enforcement
- [CI Workflows](CI_WORKFLOWS.md) - Migration CI/CD
- [Troubleshooting](TROUBLESHOOTING.md) - Database troubleshooting

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [pgTAP Testing Framework](https://pgtap.org/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

**Last Updated**: 2025-10-30  
**Maintainers**: Database Team
