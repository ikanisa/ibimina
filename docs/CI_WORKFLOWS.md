# CI/CD Workflows Documentation

**Version**: 1.0  
**Last Updated**: 2025-10-29

This document describes all CI/CD workflows in the repository, common failure
modes, and troubleshooting steps.

## 📋 Overview

The repository uses GitHub Actions for continuous integration and deployment.
All workflows are defined in `.github/workflows/`.

### Active Workflows

| Workflow            | File                  | Trigger              | Purpose                              |
| ------------------- | --------------------- | -------------------- | ------------------------------------ |
| **CI**              | `ci.yml`              | Push to main, PRs    | Main CI pipeline - lint, test, build |
| **Node Quality**    | `node-quality.yml`    | Push, PRs            | Code quality checks                  |
| **Node Build**      | `node.yml`            | Push, PRs            | Build verification                   |
| **Supabase Deploy** | `supabase-deploy.yml` | Manual, push to main | Deploy edge functions and migrations |

## 🔄 Main CI Workflow (`ci.yml`)

### Purpose

Comprehensive CI pipeline that validates code quality, security, and
functionality.

### Triggers

- Push to `main` branch
- All pull requests

### Stages

#### 1. Environment Setup

```yaml
- Checkout code
- Setup pnpm (v9)
- Setup Node.js (v20)
- Restore Next.js cache
- Install dependencies (frozen lockfile)
- Install Playwright browsers
```

**Expected Time**: ~62 seconds

#### 2. Pre-Build Validation

```yaml
- Verify feature flags (if secrets available)
- Lint code
- Type check
```

**Expected Time**: ~15 seconds

#### 3. Testing

```yaml
- Unit tests
- Auth security tests
- RLS policy tests
```

**Expected Time**: ~84 tests passing in ~6 seconds

#### 4. Security

```yaml
- Dependency vulnerability audit
- i18n key verification
- i18n glossary consistency
```

**Expected Time**: ~5 seconds

#### 5. Build

```yaml
- Build all packages and apps
- Bundle analysis enabled
```

**Expected Time**: ~5 seconds (with cache)

#### 6. Post-Build Validation

```yaml
- Enforce bundle budgets
- Verify log drain alerting
- Verify PWA baseline (reuse build artifacts)
```

**Expected Time**: ~2 seconds

#### 7. End-to-End Testing

```yaml
- Run Playwright smoke tests
- Upload traces on failure
- Upload test reports
```

**Expected Time**: ~30 seconds

#### 8. Performance Testing

```yaml
- Start preview server
- Wait for server ready
- Run Lighthouse audit
- Enforce Lighthouse budgets
- Stop preview server
```

**Expected Time**: ~45 seconds

### Environment Variables Required

#### Required Secrets (can skip if unavailable)

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

#### Environment Variables Set by Workflow

```yaml
NEXT_TELEMETRY_DISABLED: "1"
CI: "true"
RLS_TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:6543/ibimina_test
```

### Success Criteria

- ✅ All linting passes (0 warnings)
- ✅ All type checks pass
- ✅ All 84 unit tests pass
- ✅ Auth security tests pass
- ✅ RLS policy tests pass
- ✅ No high/critical vulnerabilities
- ✅ Build completes successfully
- ✅ Bundle budgets met
- ✅ E2E tests pass
- ✅ Lighthouse performance thresholds met

### Artifacts Generated

- `playwright-traces/`: Test traces (on failure)
- `playwright-report/`: HTML test report
- `lighthouse-report/`: Lighthouse JSON report

## 🏗️ Node Build Workflow (`node.yml`)

### Purpose

Fast build verification workflow.

### Triggers

- Push to any branch
- Pull requests

### Stages

```yaml
- Setup environment
- Install dependencies
- Build shared packages
- Build applications
```

**Expected Time**: ~90 seconds

### Success Criteria

- ✅ Dependencies install without errors
- ✅ TypeScript compilation succeeds
- ✅ All packages build successfully

## 🔍 Node Quality Workflow (`node-quality.yml`)

### Purpose

Code quality and style checks.

### Triggers

- Push to any branch
- Pull requests

### Stages

```yaml
- Lint all code
- Format check (Prettier)
- Type checking
```

**Expected Time**: ~30 seconds

### Success Criteria

- ✅ ESLint passes with 0 warnings
- ✅ Code is properly formatted
- ✅ No TypeScript errors

## 🚀 Supabase Deploy Workflow (`supabase-deploy.yml`)

### Purpose

Deploy database migrations and edge functions to Supabase.

### Triggers

- Manual dispatch (workflow_dispatch)
- Push to `main` branch (optional)

### Stages

```yaml
- Checkout code
- Setup Supabase CLI
- Link to Supabase project
- Run migrations
- Deploy edge functions
- Set secrets
```

**Expected Time**: ~120 seconds

### Environment Variables Required

#### Required Secrets

- `SUPABASE_ACCESS_TOKEN`: Supabase CLI access token
- `SUPABASE_PROJECT_REF`: Project reference ID
- `SUPABASE_DB_PASSWORD`: Database password

#### Optional Secrets (for edge functions)

- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `HMAC_SHARED_SECRET`
- All other edge function secrets

### Success Criteria

- ✅ Migrations apply successfully
- ✅ Edge functions deploy without errors
- ✅ Secrets update successfully

## 🚨 Common Failure Modes

### 1. Dependency Installation Failures

#### Symptoms

```
ERR_PNPM_NO_MATCHING_VERSION
ERR_PNPM_LOCKFILE_CONFLICT
```

#### Common Causes

- Lockfile out of sync with `package.json`
- Network issues during download
- Incompatible dependency versions

#### Solutions

```bash
# Local fix
pnpm install --no-frozen-lockfile
pnpm install --force

# Then commit updated pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "fix: update lockfile"
```

#### Prevention

- Always use `pnpm install --frozen-lockfile` in CI
- Commit lockfile changes with dependency updates
- Use Renovate bot for automated updates

### 2. TypeScript Path Resolution Errors

#### Symptoms

```
Cannot find module '@ibimina/config'
Module not found: Can't resolve '@ibimina/lib'
```

#### Common Causes

- Mismatched paths in `tsconfig.base.json`
- Packages not built before app build
- Missing package exports

#### Solutions

```bash
# Verify path mappings match actual structure
cat tsconfig.base.json

# Build packages in correct order
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/lib run build
pnpm --filter @ibimina/ui run build

# Then build apps
pnpm --filter @ibimina/admin run build
```

#### Prevention

- Document build order in `packages/README.md`
- Use `pnpm -r run build` for recursive builds
- Validate path mappings in CI

### 3. Missing Environment Variables

#### Symptoms

```
Error: NEXT_PUBLIC_SUPABASE_URL is required
Validation error: Missing required environment variable
```

#### Common Causes

- Secrets not configured in GitHub repository
- Environment variables not set in workflow
- `.env.example` out of sync

#### Solutions

```bash
# Check required variables
grep "REQUIRED" packages/config/src/env.ts

# Verify secrets in GitHub
# Settings → Secrets and variables → Actions

# Update .env.example if needed
cp .env.example .env.local
# Fill in values and test locally
```

#### Prevention

- Document all required variables in `.env.example`
- Use conditional logic in CI for optional secrets
- Validate environment in `packages/config`

### 4. Schema Verification Failures

#### Symptoms

```
Migration failed: relation "table_name" already exists
RLS policy "policy_name" does not exist
Schema mismatch detected
```

#### Common Causes

- Migrations not tested locally
- RLS policies missing or incorrect
- Schema drift between environments

#### Solutions

```bash
# Test migrations locally
supabase start
supabase migration up

# Verify RLS policies
pnpm run test:rls

# Generate latest schema
supabase db dump -f supabase/latest_schema.sql

# Commit schema
git add supabase/latest_schema.sql
```

#### Prevention

- Always test migrations locally before committing
- Keep `latest_schema.sql` updated
- Run `pnpm run test:rls` in CI
- Use migration rollback scripts

### 5. Build Failures

#### Symptoms

```
Build failed: 1 error, 0 warnings
Type error: Property 'xyz' does not exist
```

#### Common Causes

- TypeScript errors
- Missing imports
- Breaking changes in dependencies
- Bundle size exceeded

#### Solutions

```bash
# Check for type errors
pnpm run typecheck

# Build with verbose output
pnpm run build --debug

# Check bundle size
pnpm run assert:bundle

# If bundle too large, analyze
ANALYZE_BUNDLE=1 pnpm run build
```

#### Prevention

- Run `pnpm run typecheck` before committing
- Enable pre-commit hooks
- Monitor bundle size in CI
- Use dynamic imports for large dependencies

### 6. Test Failures

#### Symptoms

```
FAIL src/components/Test.test.tsx
Expected: 200, Received: 401
RLS policy test failed
```

#### Common Causes

- Test database not set up correctly
- Auth context missing
- RLS policies changed
- Flaky tests (timing issues)

#### Solutions

```bash
# Run tests locally
pnpm run test:unit

# Run specific test file
pnpm run test:unit -- src/path/to/test.test.tsx

# Run with coverage
pnpm run test:unit -- --coverage

# For RLS tests
pnpm run test:rls

# For auth tests
pnpm run test:auth
```

#### Prevention

- Write deterministic tests
- Mock external dependencies
- Use test database for integration tests
- Add test for bug fixes

### 7. E2E Test Failures

#### Symptoms

```
Playwright test failed
Timeout waiting for selector
Screenshot shows unexpected state
```

#### Common Causes

- Timing issues (elements not loaded)
- Flaky selectors
- Server not ready
- Auth state issues

#### Solutions

```bash
# Run E2E tests locally
pnpm run test:e2e

# Run in debug mode
pnpm run test:e2e --debug

# View test report
pnpm run test:e2e --reporter=html

# Check uploaded artifacts in GitHub Actions
```

#### Prevention

- Use stable selectors (data-testid)
- Add proper wait conditions
- Mock external services
- Run tests in CI regularly

### 8. Lighthouse Performance Failures

#### Symptoms

```
Performance score: 65 (threshold: 90)
First Contentful Paint: 3.2s (threshold: 1.8s)
Bundle budget exceeded
```

#### Common Causes

- Bundle size too large
- Unoptimized images
- Blocking scripts
- Poor caching

#### Solutions

```bash
# Analyze bundle
ANALYZE_BUNDLE=1 pnpm run build

# Check bundle budgets
pnpm run assert:bundle

# Run Lighthouse locally
pnpm dlx lighthouse http://localhost:3100

# Review performance metrics
node scripts/assert-lighthouse.mjs
```

#### Prevention

- Monitor bundle size in CI
- Optimize images (next/image)
- Use code splitting
- Implement proper caching

### 9. Supabase Deployment Failures

#### Symptoms

```
Migration failed to apply
Edge function deployment error
Secret update failed
```

#### Common Causes

- Invalid SQL syntax
- Breaking schema changes
- Function runtime errors
- Missing environment variables

#### Solutions

```bash
# Test migrations locally
supabase start
supabase migration up

# Test edge functions locally
supabase functions serve function-name

# Check function logs
supabase functions logs function-name

# Verify secrets
supabase secrets list
```

#### Prevention

- Test all migrations locally
- Use transactions (BEGIN/COMMIT)
- Write rollback procedures
- Test edge functions before deploying

### 10. Permission and Access Issues

#### Symptoms

```
Error: Resource not accessible
403 Forbidden
EACCES: permission denied
```

#### Common Causes

- Missing GitHub secrets
- Incorrect permissions in workflow
- RLS policies blocking access
- Rate limiting

#### Solutions

```yaml
# Check workflow permissions
permissions:
  contents: read
  pull-requests: write

# Verify GitHub token permissions
# Settings → Actions → General → Workflow permissions

# For RLS issues, check policies
pnpm run test:rls
```

#### Prevention

- Document required permissions
- Use least-privilege access
- Test with realistic permissions
- Monitor rate limits

## 🔧 Troubleshooting Steps

### Step 1: Identify the Failure

1. Check GitHub Actions tab
2. Find failing workflow run
3. Identify which job/step failed
4. Review error messages and logs

### Step 2: Reproduce Locally

```bash
# Replicate CI environment
CI=true pnpm run lint
CI=true pnpm run typecheck
CI=true pnpm run test
CI=true pnpm run build
```

### Step 3: Check Common Issues

- [ ] Dependencies installed? `pnpm install`
- [ ] Lockfile up to date? `git status pnpm-lock.yaml`
- [ ] Environment variables set? Check `.env.example`
- [ ] Recent changes to config? Review `git log`

### Step 4: Review Recent Changes

```bash
# Check what changed
git log --oneline -10

# Review specific files
git diff HEAD~1 package.json
git diff HEAD~1 tsconfig.base.json
```

### Step 5: Check Dependencies

```bash
# Audit dependencies
pnpm audit

# Check for outdated packages
pnpm outdated

# Verify workspace setup
pnpm list --depth 0
```

### Step 6: Test Incrementally

```bash
# Test each stage
pnpm run lint          # Linting
pnpm run typecheck     # Type checking
pnpm run test:unit     # Unit tests
pnpm run test:auth     # Auth tests
pnpm run test:rls      # RLS tests
pnpm run build         # Build
pnpm run test:e2e      # E2E tests
```

### Step 7: Check Artifacts

If CI failed, download artifacts:

1. Go to failed workflow run
2. Scroll to "Artifacts" section
3. Download relevant artifacts:
   - `playwright-traces/`: Test execution traces
   - `playwright-report/`: HTML test report
   - `lighthouse-report/`: Performance metrics

### Step 8: Review Logs

```bash
# For local logs
tail -f .next/server.log

# For CI logs
gh run view <run-id> --log-failed
```

## 📊 Performance Benchmarks

### Expected CI Times

| Stage              | Expected Time    | Acceptable Range |
| ------------------ | ---------------- | ---------------- |
| Dependency Install | 62s              | 45-90s           |
| Linting            | 8s               | 5-15s            |
| Type Checking      | 12s              | 8-20s            |
| Unit Tests         | 6s               | 4-10s            |
| Build (cached)     | 5s               | 3-15s            |
| Build (no cache)   | 120s             | 90-180s          |
| E2E Tests          | 30s              | 20-60s           |
| Lighthouse         | 45s              | 30-90s           |
| **Total (cached)** | **~3-4 minutes** | 2-6 minutes      |
| **Total (fresh)**  | **~5-7 minutes** | 4-10 minutes     |

### Optimization Tips

1. **Use Cache Effectively**
   - Next.js build cache
   - pnpm store cache
   - Node modules cache

2. **Parallelize When Possible**
   - Run independent jobs in parallel
   - Use matrix builds for multiple versions

3. **Fail Fast**
   - Run quick checks first (lint, typecheck)
   - Run expensive tests last (E2E, Lighthouse)

4. **Skip When Safe**
   - Skip feature flag check if secrets unavailable
   - Skip E2E on documentation-only changes

## 🔐 Security Considerations

### Secrets Management

- Never log secrets in CI
- Use GitHub encrypted secrets
- Rotate secrets regularly
- Limit secret access to necessary workflows

### Permissions

```yaml
permissions:
  contents: read # Read code
  pull-requests: write # Comment on PRs
  checks: write # Update check status
```

### Dependency Security

- Run `pnpm audit` in CI
- Block merges on high/critical vulnerabilities
- Auto-update security patches (Renovate)

## 📝 Adding New Workflows

### Checklist

- [ ] Define clear purpose and triggers
- [ ] Document expected behavior
- [ ] Add to this documentation
- [ ] Test locally with `act` if possible
- [ ] Add status badge to README
- [ ] Configure required secrets
- [ ] Set appropriate permissions
- [ ] Add failure notifications

### Template

```yaml
name: New Workflow
on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - name: Install
        run: pnpm install --frozen-lockfile
      # Add your steps here
```

## 🔗 Related Documentation

- [Ground Rules](GROUND_RULES.md) - CI enforcement of ground rules
- [Quick Reference](QUICK_REFERENCE.md) - Command reference
- [Troubleshooting](TROUBLESHOOTING.md) - General troubleshooting
- [Project Structure](PROJECT_STRUCTURE.md) - Codebase structure

## 📞 Getting Help

If CI continues to fail after following this guide:

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review recent PRs for similar issues
3. Ask in team chat with:
   - Link to failed run
   - Steps already tried
   - Error messages
4. Open issue with `ci` label

---

**Last Updated**: 2025-10-29  
**Maintainers**: DevOps Team  
**CI Status**: Check
[GitHub Actions](https://github.com/ikanisa/ibimina/actions)
