# GitHub Copilot Coding Agent Instructions

## Repository Overview

**Ibimina** ("groups" in Kinyarwanda) is a comprehensive SACCO (Savings and
Credit Cooperative) management platform for Rwanda's Umurenge SACCOs. The system
manages group savings (ikimina), member accounts, mobile money payments, and
reconciliation workflows with security, observability, and offline-first
capabilities.

**Repository Type**: pnpm monorepo workspace  
**Primary Application**: Next.js 15 staff console (apps/admin)  
**Lines of Code**: ~341 TypeScript/TSX files in admin app  
**Tech Stack**:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.9, Tailwind CSS
  4
- **Backend**: Supabase (PostgreSQL with RLS, Edge Functions on Deno runtime)
- **Infrastructure**: Docker, Prometheus, Grafana, pg_cron

## Critical: Environment Variables Required for Build

**The build WILL FAIL without these environment variables.** Before running any
build commands, you MUST set these in your environment or create a `.env` file
in the repository root:

```bash
# REQUIRED - Build will fail without these
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKUP_PEPPER=$(openssl rand -hex 32)
MFA_SESSION_SECRET=$(openssl rand -hex 32)
TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
OPENAI_API_KEY=your-openai-key
HMAC_SHARED_SECRET=$(openssl rand -hex 32)
KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)

# OPTIONAL but recommended
APP_ENV=development
NODE_ENV=development
LOG_DRAIN_URL=your-log-drain-url
MFA_RP_ID=localhost
MFA_ORIGIN=http://localhost:3000
```

**For quick testing without Supabase**: Use placeholder values (build will
succeed but runtime will fail):

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
export SUPABASE_SERVICE_ROLE_KEY=placeholder
export BACKUP_PEPPER=$(openssl rand -hex 32)
export MFA_SESSION_SECRET=$(openssl rand -hex 32)
export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
export OPENAI_API_KEY=placeholder
export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
```

## Build and Validation Procedures

### Prerequisites

1. **Node.js v20.x or higher** (specified in .nvmrc and package.json engines)
2. **pnpm 10.19.0** (exact version - managed via packageManager field)
3. **PostgreSQL client (psql)** for RLS tests
4. **Playwright browsers** for E2E tests

### Installation (ALWAYS run this first)

```bash
# Install pnpm globally if not present
npm install -g pnpm@10.19.0

# Install dependencies - ALWAYS use --frozen-lockfile in CI/scripts
pnpm install --frozen-lockfile

# Install Playwright browsers (for E2E tests)
pnpm exec playwright install --with-deps
```

### Build Order (Critical - follow this sequence)

**NEVER run `pnpm build` without environment variables set first.**

```bash
# 1. Ensure environment variables are set (see above section)
# 2. Check code quality BEFORE building
pnpm lint          # Lint all packages (expect some errors in apps/client)
pnpm typecheck     # Type check (should pass)

# 3. Build (will fail without env vars)
pnpm build         # Builds all packages in dependency order

# 4. Run tests AFTER build
pnpm test:unit     # Unit tests across all packages
pnpm test:auth     # Auth security integration tests
pnpm test:rls      # RLS policy tests (requires PostgreSQL)
pnpm test:e2e      # Playwright E2E tests (requires built app)
```

### Known Build Issues and Workarounds

**Issue 1: Lint Errors in apps/client**  
**Symptom**: `pnpm lint` fails with @typescript-eslint/no-explicit-any errors in
apps/client  
**Workaround**: This is expected. The client app has known lint issues. Use
`pnpm --filter @ibimina/admin lint` to lint only the admin app.

**Issue 2: RLS Tests Fail with Connection Error**  
**Symptom**: `pnpm test:rls` fails with "psql: could not connect"  
**Cause**: PostgreSQL not running or wrong connection string  
**Solution**: Set
`RLS_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:6543/ibimina_test`
and ensure PostgreSQL is running on port 6543.

**Issue 3: Build Hangs or Times Out**  
**Symptom**: `pnpm build` hangs after 2 minutes  
**Solution**: Increase timeout. Typical build time is 3-5 minutes. Use
`timeout 300` or pass `--timeout 300` to commands.

**Issue 4: Missing Secrets During Feature Flag Check**  
**Symptom**: `pnpm check:flags` fails with "SUPABASE_URL is required"  
**Solution**: This check requires live Supabase credentials. In local dev, set
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` or skip with `|| true`.

### Complete Deployment Readiness Check

```bash
# This runs the FULL CI pipeline locally (takes 5-10 minutes)
pnpm check:deploy
# OR
make ready

# What it runs (in order):
# 1. Feature flag validation (requires Supabase secrets)
# 2. Linting
# 3. Type checking
# 4. Unit tests
# 5. Auth security tests
# 6. RLS policy tests
# 7. Build
# 8. E2E tests
# 9. Lighthouse performance checks
```

## Project Layout and Architecture

### Monorepo Structure

```
/
├── apps/
│   ├── admin/              # Main Next.js staff console (PRIMARY APP)
│   │   ├── app/           # Next.js App Router routes
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities, auth, Supabase clients
│   │   ├── middleware.ts  # Auth middleware
│   │   ├── tests/         # Unit, integration, E2E tests
│   │   └── scripts/       # Build and validation scripts
│   ├── client/            # Client-facing mobile app (React Native)
│   └── platform-api/      # Future API services (stub)
├── packages/
│   ├── config/            # Shared config loader (WIP)
│   ├── core/              # Domain logic, Supabase helpers (WIP)
│   ├── ui/                # Shared design system (WIP)
│   ├── lib/               # Shared utilities (WIP)
│   └── testing/           # Test utilities (WIP)
├── supabase/
│   ├── functions/         # 30+ Edge Functions (Deno runtime)
│   ├── migrations/        # Database migrations (18+ files)
│   ├── tests/rls/         # RLS policy tests
│   └── data/              # Seed data (umurenge_saccos.json)
├── docs/                   # Architecture, deployment, operations docs
├── scripts/                # Repo-level validation scripts
└── infra/metrics/         # Prometheus + Grafana setup
```

### Key Configuration Files

- **Root**: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- **Admin App**: `apps/admin/next.config.ts`, `apps/admin/middleware.ts`,
  `apps/admin/tailwind.config.ts`
- **Linting**: `eslint.config.mjs` (root), `apps/admin/eslint.config.mjs`
- **Formatting**: `.prettierrc.json`, `.prettierignore`
- **Git Hooks**: `.husky/pre-commit` (lint-staged), `.husky/commit-msg`
  (commitlint)
- **CI/CD**: `.github/workflows/ci.yml` (main),
  `.github/workflows/node-quality.yml`, `.github/workflows/supabase-deploy.yml`

### Important Files to Review Before Changes

1. **apps/admin/lib/supabase/server.ts** - Server-side Supabase client
2. **apps/admin/lib/auth.ts** - Authentication utilities
3. **apps/admin/middleware.ts** - Auth middleware for route protection
4. **supabase/migrations/** - Database schema changes (must be sequential)
5. **apps/admin/next.config.ts** - Next.js configuration (PWA, output settings)

## Testing Strategy

### Test Organization

- **Unit Tests**: `apps/admin/tests/unit/*.test.ts` (tsx test runner)
- **Integration Tests**: `apps/admin/tests/integration/*.test.ts` (tsx test
  runner)
- **E2E Tests**: `apps/admin/tests/e2e/*.spec.ts` (Playwright)
- **RLS Tests**: `supabase/tests/rls/*.test.sql` (psql)

### Running Tests

```bash
# Unit tests (fast, no external dependencies)
pnpm test:unit

# Auth security tests (validates MFA, passkeys, session handling)
pnpm test:auth

# RLS policy tests (requires PostgreSQL with test DB)
# Database URL: postgresql://postgres:postgres@localhost:6543/ibimina_test
pnpm test:rls

# E2E tests (requires built app and Playwright browsers)
pnpm test:e2e

# All tests
pnpm test  # Currently only runs test:rls
```

### Test Database Setup for RLS Tests

```bash
# RLS tests need PostgreSQL running
# Default connection: postgresql://postgres:postgres@localhost:6543/ibimina_test
# Set via: export RLS_TEST_DATABASE_URL=<your-connection-string>

# Test script automatically:
# 1. Runs apps/admin/scripts/db-reset.sh
# 2. Executes each *.test.sql file in supabase/tests/rls/
# 3. Reports pass/fail for each test
```

## CI/CD Pipeline Details

### GitHub Actions Workflows

**1. `.github/workflows/ci.yml` (Main Pipeline)**  
Runs on: push to main, all pull requests  
Services: PostgreSQL 15 on port 6543  
Duration: ~8-12 minutes  
Steps (in order):

1. Install dependencies with pnpm 9 (note: package.json specifies 10.19.0)
2. Install Playwright browsers
3. Verify feature flags (skips if secrets unavailable)
4. Lint all packages
5. Type check all packages
6. Run unit tests
7. Run auth security tests
8. Run RLS policy tests (uses service postgres:6543)
9. Check for dependency vulnerabilities (`pnpm audit`)
10. Verify i18n keys consistency
11. Build with bundle analysis
12. Enforce bundle budgets
13. Verify log drain alerting
14. Run Playwright smoke tests
15. Start preview server and run Lighthouse
16. Enforce Lighthouse budgets

**2. `.github/workflows/node-quality.yml` (Quick Checks)**  
Runs on: push to main, pull requests  
Fast validation: lint → typecheck → build  
Duration: ~3-5 minutes

**3. `.github/workflows/supabase-deploy.yml` (Database Deployment)**  
Deploys migrations and edge functions to Supabase  
Requires secrets: `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`

### Required GitHub Secrets

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for feature flag checks
- `SUPABASE_PROJECT_REF` - Project reference for deployments
- `SUPABASE_ACCESS_TOKEN` - Access token for CLI

## Branching Model and Git Workflow

### Branches

- **main** - Production-ready, deployment branch
- **work** - Integration branch for active development (TARGET FOR MOST PRs)

### Creating Feature Branches

```bash
git checkout work
git pull origin work
git checkout -b feature/descriptive-name

# Naming conventions:
# feature/  - New features
# fix/      - Bug fixes
# docs/     - Documentation
# refactor/ - Code refactoring
# test/     - Test additions
# chore/    - Maintenance
```

### Commit Message Format (Enforced by commitlint)

```
<type>(<scope>): <subject>

Examples:
feat(auth): add passkey authentication support
fix(dashboard): resolve incorrect balance display
docs(readme): update local setup instructions
```

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Pre-commit Hooks**:

1. **lint-staged** - Formats staged files with Prettier, lints with ESLint
2. **commitlint** - Validates commit message format

## Common Commands Reference

### Development

```bash
pnpm dev                    # Start admin app on port 3000
pnpm --filter @ibimina/admin dev  # Explicit admin app
PORT=3001 pnpm dev         # Use different port
```

### Code Quality

```bash
pnpm lint                   # Lint all packages
pnpm format                 # Format all files
pnpm format:check           # Check formatting without changes
pnpm typecheck              # Type check all packages
```

### Building

```bash
pnpm build                  # Build all packages
pnpm --filter @ibimina/admin build  # Build only admin
ANALYZE_BUNDLE=1 pnpm build # Build with bundle analysis
```

### Testing

```bash
pnpm test                   # Run all tests (currently test:rls)
pnpm test:unit              # Unit tests
pnpm test:auth              # Auth integration tests
pnpm test:rls               # RLS policy tests
pnpm test:e2e               # Playwright E2E tests
```

### Validation Scripts

```bash
pnpm check:i18n             # Verify translation keys
pnpm check:i18n:consistency # Verify glossary consistency
pnpm assert:bundle          # Enforce bundle size budgets
pnpm verify:log-drain       # Verify log drain config
pnpm check:flags            # Verify feature flags in Supabase
```

### Deployment Checks

```bash
pnpm check:deploy           # Full deployment readiness (5-10 min)
make ready                  # Alias for check:deploy
pnpm validate:production    # Run production readiness script
```

### Supabase Operations

```bash
supabase start              # Start local Supabase
supabase db reset           # Reset DB and run migrations
supabase migration new <name>  # Create new migration
supabase db push            # Apply migrations
supabase functions serve <name>  # Serve edge function locally
```

## Critical Instructions for Coding Agents

### ALWAYS Do This

1. **Set environment variables BEFORE running `pnpm build`** - Build will fail
   otherwise
2. **Run `pnpm install --frozen-lockfile`** before any build commands
3. **Check the current branch** - Most PRs target `work`, not `main`
4. **Run lint and typecheck BEFORE building** to catch issues early
5. **Use pnpm, never npm or yarn** - This is a pnpm workspace
6. **Check .gitignore before committing** - Never commit .env, node_modules,
   .next, etc.

### NEVER Do This

1. **Never modify pnpm-lock.yaml manually** - Use `pnpm install` to update
2. **Never commit secrets or API keys** - Use environment variables
3. **Never run `pnpm build` without env vars** - It WILL fail
4. **Never skip the lint/typecheck steps** - CI will fail
5. **Never force-push to main or work branches**
6. **Never modify migration files after they've been applied** - Create new
   migrations

### When Making Changes

1. **Small changes**: Run `pnpm lint` and `pnpm typecheck` in affected workspace
2. **Database changes**: Create new migration, test with `supabase db reset`
3. **Frontend changes**: Test with `pnpm dev` and verify in browser
4. **Before PR**: Run `pnpm check:deploy` or at minimum: lint → typecheck →
   build → test

### Troubleshooting Build Failures

1. **"NEXT_PUBLIC_SUPABASE_URL is required"** → Set environment variables
2. **"pnpm: command not found"** → Run `npm install -g pnpm@10.19.0`
3. **Lint fails in apps/client** → Expected, use `--filter @ibimina/admin` to
   skip
4. **RLS tests fail** → Ensure PostgreSQL running on port 6543
5. **Build times out** → Increase timeout to 300+ seconds

### Performance Notes

- **Initial install**: ~45 seconds with 1058 packages
- **Lint**: ~30 seconds (all packages)
- **Type check**: ~45 seconds (all packages)
- **Build**: ~3-5 minutes (with env vars)
- **Full check:deploy**: ~8-12 minutes

## Important: Trust These Instructions

These instructions were created through comprehensive exploration of the
repository including:

- All documentation files (README, CONTRIBUTING, DEVELOPMENT, etc.)
- All workflows and CI configurations
- All build scripts and validation procedures
- Testing each command to verify behavior
- Documenting observed errors and workarounds

**Only perform additional searches if:**

1. These instructions are incomplete for your specific task
2. You encounter behavior that contradicts these instructions
3. You need details about specific code implementation not covered here

Otherwise, trust these instructions to minimize exploration time and command
failures.
