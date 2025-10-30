# Schema Verification Guard

## Overview

This directory contains a schema verification guard system to prevent database
drift between local migrations and remote Supabase databases. The system ensures
that your database schema stays in sync across development, staging, and
production environments.

## Why This Matters

When running multiple services against one PostgreSQL database, schema drift can
cause:

- Runtime errors from missing tables or columns
- Out-of-order migrations causing deployment failures
- Manual database edits that aren't captured in migrations
- Difficult rollbacks and debugging sessions

The schema verification guard catches these problems early with:

- Pre-commit hooks (local)
- Automated PR checks (CI/CD)
- Pre-deployment validation

## Components

### 1. Verification Script (`scripts/verify-schema.sh`)

The main verification script that:

- Builds a local schema snapshot from migration files
- Pulls the remote schema from Supabase (without data)
- Compares normalized SQL and fails if drift is detected
- Optionally refreshes `supabase/schema.sql` for version control
- Dry-runs migrations to ensure they apply cleanly

**Exit codes:**

- `0` - Success: No drift, migrations apply cleanly
- `1` - Supabase CLI not found or project not linked
- `2` - Schema drift detected between local and remote
- `3` - schema.sql was stale (CI only)

### 2. Pre-commit Hook (`.githooks/pre-commit`)

Optional pre-commit hook that:

- Runs `scripts/verify-schema.sh` before each commit
- Automatically stages `supabase/schema.sql` if updated
- Prevents commits when schema drift is detected

### 3. GitHub Actions Workflow (`.github/workflows/db-guard.yml`)

CI/CD workflow that:

- Runs on all pull requests to `main`
- Installs Supabase CLI
- Runs schema verification
- Fails the build if drift is detected
- Ensures `supabase/schema.sql` is up-to-date

## Setup

### One-time Local Setup

```bash
# 1) Install/update Supabase CLI
brew install supabase/tap/supabase || brew upgrade supabase

# 2) Link your project (once per environment)
supabase link --project-ref <YOUR_SUPABASE_REF>

# 3) Ensure standard paths exist
mkdir -p supabase/migrations
# supabase/config.toml should point to these defaults
```

### Enable Pre-commit Hook (Optional)

```bash
# Enable git hooks
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

## Usage

### Running Locally

```bash
# Run verification for local environment
ENV_NAME=local scripts/verify-schema.sh

# Run for staging
ENV_NAME=staging PROJECT_REF=your-staging-ref scripts/verify-schema.sh

# Run for production
ENV_NAME=production PROJECT_REF=your-prod-ref scripts/verify-schema.sh
```

### In CI/CD

The workflow automatically runs on pull requests. No manual intervention needed
unless drift is detected.

To require this check before merging:

1. Go to repository Settings → Branches
2. Add branch protection rule for `main`
3. Require status checks: `supabase-db-guard / verify`

## Common Issues and Solutions

### "Schema drift detected"

**Cause:** Remote database schema doesn't match local migrations

**Solutions:**

1. Run locally: `bash scripts/verify-schema.sh`
2. If remote is ahead:
   - Run `supabase db pull` to generate a migration capturing remote changes
   - Or apply missing migrations to remote: `supabase migration up --linked`
3. If local is ahead:
   - Apply migrations to remote: `supabase migration up --linked`
   - Then re-run verification

### "schema.sql was stale" (in CI)

**Cause:** The committed `supabase/schema.sql` doesn't match current migrations

**Solution:**

```bash
# Run guard locally to refresh schema.sql
ENV_NAME=local scripts/verify-schema.sh

# Commit the refreshed file
git add supabase/schema.sql
git commit -m "chore(db): update schema.sql"
git push
```

### "Supabase CLI not found"

**Cause:** Supabase CLI is not installed

**Solution:**

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://cli.supabase.com/install/linux | sh
```

### "Project not linked"

**Cause:** Supabase project is not linked locally

**Solution:**

```bash
supabase link --project-ref <YOUR_SUPABASE_REF>
```

### Dry-run fails

**Cause:** A migration has dependency issues or references missing tables

**Solution:**

1. Review the migration file that failed
2. Fix dependency order (migrations should be sequential)
3. Ensure all referenced tables/columns exist in earlier migrations
4. Test locally: `supabase db reset`

## Daily Operational Habits

Follow these practices to maintain database integrity:

### ✅ DO

- Create a migration for every schema change
- Test migrations locally first
- Run `scripts/verify-schema.sh` before committing
- Review `supabase/schema.sql` changes in PRs
- Apply migrations via CI/CD or `supabase migration up --linked`

### ❌ DON'T

- Never hand-edit production database
- Don't skip migrations for "quick fixes"
- Don't commit without running verification
- Don't ignore drift warnings

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Developer Workflow                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Create Migration│
                   │ supabase migration│
                   │       new         │
                   └─────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │   Test Locally         │
                │ supabase migration up  │
                │    pnpm run test:rls   │
                └────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │   Run Verification     │
                │scripts/verify-schema.sh│
                └────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │   Commit & Push        │
                │ (pre-commit hook runs) │
                └────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │   Pull Request         │
                │  (CI workflow runs)    │
                └────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │   Merge to Main        │
                │  (deploy workflow)     │
                └────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │  Production Deploy     │
                │supabase migration up   │
                └────────────────────────┘
```

## Files Modified

When running this system, you'll interact with:

- **`scripts/verify-schema.sh`** - Main verification script
- **`.githooks/pre-commit`** - Pre-commit hook (optional)
- **`.github/workflows/db-guard.yml`** - CI workflow
- **`supabase/schema.sql`** - Canonical schema snapshot (auto-updated)
- **`supabase/migrations/*.sql`** - Migration files
- **`supabase/config.toml`** - Supabase configuration with project_ref

## Integration with Existing Workflows

This schema guard integrates with existing workflows:

1. **`.github/workflows/supabase-deploy.yml`** - Applies migrations to
   environments
2. **`scripts/validate-production-readiness.sh`** - Checks migration format and
   RLS
3. **`pnpm run test:rls`** - Tests RLS policies
4. **Husky pre-commit hooks** - Runs alongside existing lint-staged hooks

## Environment Variables

The verification script uses these environment variables:

- **`PROJECT_REF`** - Supabase project reference ID
- **`SUPABASE_PROJECT_REF`** - Alternative for PROJECT_REF
- **`ENV_NAME`** - Environment name (local/staging/production)
- **`SCHEMA_FILE`** - Path to schema.sql (default: supabase/schema.sql)
- **`EXPECTED_BRANCH`** - Expected branch name (default: main)
- **`CI`** - Set to "true" in CI environments
- **`SUPABASE_ACCESS_TOKEN`** - Supabase access token (CI only)

## Further Documentation

- [DB_GUIDE.md](../docs/DB_GUIDE.md) - Comprehensive database guide
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Migration Best Practices](../docs/DB_GUIDE.md#database-migrations)

## Support

For issues or questions:

1. Check common issues section above
2. Review [DB_GUIDE.md](../docs/DB_GUIDE.md)
3. Run with verbose output: `bash -x scripts/verify-schema.sh`
4. Open an issue with the error message and context
