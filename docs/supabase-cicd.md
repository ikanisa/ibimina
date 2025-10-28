# Supabase CI/CD Pipeline

This document describes the Supabase migrations and Edge Functions deployment
pipeline configured in `.github/workflows/supabase-deploy.yml`.

## Overview

The pipeline supports three deployment scenarios:

1. **Pull Request Validation**: Dry-run migration checks and staging preview
2. **Staging Deployment**: Automatic deployment to staging environment for PR
   preview
3. **Production Deployment**: Automatic deployment to production on main branch

## Workflow Jobs

### 1. Migration Check (Pull Requests)

Runs on every PR that modifies Supabase files.

**Purpose**: Validate migrations without affecting production

- Starts local Supabase instance
- Applies migrations in dry-run mode
- Validates SQL syntax
- Checks for common migration issues

**Triggers**:

- Pull requests modifying `supabase/functions/**` or `supabase/migrations/**`

**Steps**:

```yaml
- Start Supabase local instance
- Run migration dry-run (supabase migration up --local)
- Check migration file syntax
- Stop Supabase instance
```

### 2. Preview Deploy to Staging (Pull Requests)

Deploys changes to staging environment for testing.

**Purpose**: Test changes in a production-like environment before merging

- Requires `SUPABASE_STAGING_PROJECT_REF` variable
- Depends on successful migration check
- Comments on PR with deployment status

**Environment**: `staging`

**Steps**:

```yaml
- Link to staging project
- Apply migrations to staging
- Deploy functions to staging
- Comment on PR with deployment details
```

**PR Comment Example**:

```
#### Supabase Staging Deploy ✅

Preview environment has been updated with your changes.

**Project:** `your-staging-ref`
**Migrations:** Applied
**Functions:** Deployed

You can test your changes in the staging environment.
```

### 3. Production Deploy (Main Branch)

Deploys to production automatically when changes are merged to main.

**Purpose**: Deploy validated changes to production

- Only runs on `main` branch
- Applies migrations first, then deploys functions
- Verifies deployment completion

**Environment**: `production`

**Triggers**:

- Push to `main` branch with changes to `supabase/functions/**` or
  `supabase/migrations/**`

**Steps**:

```yaml
- Link to production project
- Apply migrations to production
- Deploy functions to production
- Verify deployment
```

## Required Secrets & Variables

### Secrets (GitHub Repository Secrets)

| Secret                  | Description                  | Used In          |
| ----------------------- | ---------------------------- | ---------------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token    | All environments |
| `SUPABASE_PROJECT_REF`  | Production project reference | Production only  |

### Variables (GitHub Repository Variables)

| Variable                       | Description                          | Used In      |
| ------------------------------ | ------------------------------------ | ------------ |
| `SUPABASE_STAGING_PROJECT_REF` | Staging project reference (optional) | Staging only |

### Setting Up Secrets

1. **Get Supabase Access Token**:

   ```bash
   supabase login
   # Copy the access token
   ```

2. **Add to GitHub**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add `SUPABASE_ACCESS_TOKEN`
   - Add `SUPABASE_PROJECT_REF` (production)
   - Add `SUPABASE_STAGING_PROJECT_REF` (staging) as a variable

3. **Configure Environments** (optional but recommended):
   - Settings → Environments → New environment
   - Create `staging` and `production` environments
   - Add protection rules as needed (e.g., required reviewers for production)

## Edge Functions Deployment

Functions are deployed via `apps/admin/scripts/supabase-go-live.sh`:

```bash
./apps/admin/scripts/supabase-go-live.sh deploy-functions
```

**Deployed Functions**:

- admin-reset-mfa
- analytics-forecast
- bootstrap-admin
- export-report
- export-statement
- gsm-maintenance
- payments-apply
- import-statement
- ingest-sms
- invite-user
- metrics-exporter
- parse-sms
- recon-exceptions
- reporting-summary
- reports-export
- scheduled-reconciliation
- secure-import-members
- settle-payment
- sms-ai-parse
- sms-inbox
- sms-review

## Manual Deployment

### Deploy to Staging

```bash
# Link to staging
supabase link --project-ref your-staging-ref

# Apply migrations
supabase migration up --linked --include-all --yes

# Deploy functions
./apps/admin/scripts/supabase-go-live.sh deploy-functions
```

### Deploy to Production

```bash
# Link to production
supabase link --project-ref your-production-ref

# Apply migrations
supabase migration up --linked --include-all --yes

# Deploy functions
./apps/admin/scripts/supabase-go-live.sh deploy-functions
```

## Migration Best Practices

### Writing Migrations

1. **Create migration file**:

   ```bash
   supabase migration new your_migration_name
   ```

2. **Write idempotent SQL**:

   ```sql
   -- Use IF NOT EXISTS when possible
   CREATE TABLE IF NOT EXISTS your_table (...);

   -- Use DO blocks for conditional logic
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM ...) THEN
       -- your changes
     END IF;
   END $$;
   ```

3. **Test locally first**:
   ```bash
   supabase start
   supabase migration up --local
   ```

### Migration Review Checklist

- [ ] Migration is idempotent (can run multiple times safely)
- [ ] Backwards compatible (doesn't break existing code)
- [ ] Tested locally with `supabase start` and `migration up`
- [ ] SQL syntax is valid
- [ ] Rollback plan documented (if needed)
- [ ] Data migration tested with sample data

## Troubleshooting

### Migration Fails in CI

**Check the dry-run output**:

- View the "Run migration dry-run" step in GitHub Actions
- Common issues: syntax errors, missing dependencies, constraint violations

**Test locally**:

```bash
supabase start
supabase migration up --local
# If it fails, fix the migration and try again
```

### Function Deployment Fails

**Check function logs**:

```bash
supabase functions logs your-function-name
```

**Common issues**:

- Missing environment variables
- Import errors
- TypeScript compilation errors

**Test function locally**:

```bash
supabase functions serve your-function-name
```

### Staging Deploy Doesn't Run

**Requirements**:

- `SUPABASE_STAGING_PROJECT_REF` variable must be set
- Must be a pull request (not a push to main)
- Migration check must pass first

### Missing Permissions

If you see permission errors:

- Ensure `SUPABASE_ACCESS_TOKEN` has correct permissions
- Check that GitHub Actions has permission to write comments (for PR comments)
- Verify environment protection rules aren't blocking deployment

## Monitoring

### Verify Deployments

**Check migrations**:

```bash
supabase migration list --linked
```

**Check functions**:

```bash
supabase functions list
```

**View logs**:

```bash
supabase functions logs
```

### Rollback

**Migrations**:

- Migrations cannot be automatically rolled back
- Create a new migration to undo changes
- Test thoroughly before deploying

**Functions**:

- Previous version can be redeployed if needed
- Keep function versions in Git for history

## Related Documentation

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/introduction)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Edge Functions Deployment](https://supabase.com/docs/guides/functions/deploy)
- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments)
