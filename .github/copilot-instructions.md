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
MFA_ORIGIN=http://localhost:3100
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

### Git Hooks and CI Environment

This repository uses **Husky** to enforce code quality via Git hooks:

- **pre-commit**: Runs `lint-staged` to format and lint changed files
- **commit-msg**: Runs `commitlint` to enforce conventional commit format

**Important for CI/CD and Automated Tools:**

The hooks are **automatically disabled** in CI environments by checking for:

- `CI` environment variable (set to any non-empty value)
- `GITHUB_ACTIONS` environment variable
- `HUSKY=0` environment variable

**When creating GitHub Actions workflows:**

```yaml
jobs:
  your-job:
    runs-on: ubuntu-latest
    env:
      CI: "true"
      HUSKY: "0" # Explicitly disable Husky hooks
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          persist-credentials: true
      # ... rest of your steps
```

**If you need to commit/push in a workflow:**

```yaml
- name: Configure Git
  run: |
    git config --global user.name "github-actions[bot]"
    git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
    git config --global core.hooksPath /dev/null  # Extra safety layer
```

**To test hooks locally without triggering them:**

```bash
# Temporarily disable hooks
export HUSKY=0
git commit -m "test: commit without hooks"

# Or skip hooks for a single commit
git commit --no-verify -m "test: commit without hooks"
```

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

---

## SACCO+ System Overview

### Executive Summary

**SACCO+** is a **digital intermediation platform** that channels **informal
ibimina (group savings)** into **formal deposits** at **Umurenge SACCOs** and
MFIs—**without** holding funds or integrating into core banking systems. Members
pay via **USSD** to each SACCO's **MoMo merchant account**. SACCO+ issues
**structured reference tokens** and ingests **evidence
(SMS/notifications/statements)** to **allocate** deposits to the correct **SACCO
→ group (ikimina) → member**.

**Why now?** Most rural savings circulate inside informal groups (ROSCA-style),
limiting deposit mobilization and credit access. SACCO+ formalizes those flows,
preserves group discipline, and gives staff/regulators **real-time
visibility**—with **low friction** for members (USSD + optional mobile app).

**What SACCO+ is not:** It **does not** move or keep money. It **does not**
connect to SACCO cores. It **only** standardizes references, collects evidence,
and **allocates** deposits to groups/members—then **reports** to SACCOs.

### Stakeholders & Scope

#### Primary Stakeholders

- **SACCO staff (sector level)** – onboard and manage ibimina/members; monitor
  deposits; resolve exceptions; export reports.
- **District SACCO managers** – cross-SACCO dashboards and district reports;
  oversight.
- **MFIs (independent)** – operate as isolated organizations with their own
  staff and dashboards.
- **Members & group leaders (optional client app)** – view groups, pay by USSD,
  see statements; submit join requests (staff approve).
- **Regulators (RCA/BNR), MINECOFIN** – policy alignment and oversight via
  aggregated views (phase-gated).

#### Product Boundaries (Hard Guardrails)

- **Funds** go **directly** from member to **SACCO merchant account** (MoMo
  USSD).
- **No** core banking integration; **no** custody or account ledger maintained
  by SACCO+.
- SACCO+ provides **reference standards, ingestion, allocation, and reporting**.

### System Architecture & Data Model

#### High-Level Data Model

- `countries (id, name, iso2, …)`
- `country_config (country_id, reference_format, language_defaults, telco_settings, …)`
- `organizations (id, country_id, name, type: SACCO|MFI, merchant_code, district_id, …)`
- `groups (id, org_id, country_id, name, settings: amount, frequency, cycle, …)`
- `group_members (id, group_id, user_id, member_code)`
- `allocations (id, org_id, country_id, group_id, member_id, txn_id, amount, ts, raw_ref, status, source, audit)`
- `uploads (id, org_id, file_meta, ocr_result, status)`
- `tickets, ticket_messages`
- `org_kb, global_kb (embedding optional)`

**RLS:** per `country_id`, `org_id`; member scoping by
`group_members`/`member_code`; staff/district roles mapped to org/district.

### Metrics & KPIs

- **Adoption:** active ibimina; members onboarded; USSD users.
- **Deposit conversion:** % of ibimina funds formalized; deposits per period.
- **Data quality:** allocation success rate; exception aging; reconciliation
  time.
- **Operational:** staff actions/day; exports generated; dashboard views.
- **Support:** AI chat deflection rate; ticket SLA.
- **Reliability:** uptime; error rates; crash-free sessions.

### Roadmap (Indicative)

- **Phase 0 (Pilot – Nyamagabe):** staff onboarding, USSD references, evidence
  ingestion, allocation & reports.
- **Phase 1 (Provincial):** full admin/staff polish; client app public launch;
  deep links; district dashboards.
- **Phase 2 (National):** multi-country scaffolding live; iOS/Android store
  rollout; AI assistant; WhatsApp mini-app (optional).
- **Phase 3 (Credit option):** ASCA-style loans secured by group savings;
  insurance; strict controls.

### UX Design Principles (Revolut-grade)

- **Liquid-Glass** cards, **Rwanda gradients**, shadow depth, subtle parallax.
- **Icon-first** with short labels; **big numbers**; **mono** font for
  references.
- **Motion:** 120–220ms transitions; haptics for copy/pay; skeletons.
- **One-thumb flows:** bottom nav; sticky primary actions (Pay, Ask to Join,
  Export).
- **Clarity:** bilingual headers; step-by-step USSD guides; consistent
  empty/error states.

### Acceptance Criteria (Go-Live)

- **Security:** RLS tests prove isolation; CSP & headers enabled; secrets never
  in client bundles.
- **Functionality:** USSD references issued; evidence ingested; allocations
  visible; exceptions workable; exports correct.
- **Performance:** PWAs Lighthouse **≥ 90** (PWA/Perf/A11y).
- **Mobile:** Android AAB/APK & iOS IPA built; deep links verified; Android
  Notification Listener + SMS Consent working; iOS copy-first USSD UX.
- **Operations:** Sentry + PostHog dashboards live; runbooks complete.
- **Docs:** single up-to-date repository of architecture, security, RLS,
  runbooks, and release steps.

### Glossary

- **Ibimina / Ikimina** – community group savings.
- **USSD** – unstructured supplementary service data (telco menu).
- **Reference token** – structured code placed in USSD "reference" field to
  route a deposit to the correct group/member.
- **Allocation** – mapping an incoming payment to SACCO/group/member based on
  evidence.
- **RLS** – Row-Level Security (Postgres policy isolation).
- **Intermediation** – SACCO+ standardizes & routes information; never holds
  funds.

---

## TapMoMo NFC→USSD Feature Specification

### Feature Overview

TapMoMo enables local NFC handoff of payment details, followed by USSD
confirmation and payment. This feature focuses on user experience rather than
technical implementation details.

**What the feature does:**

- Tap to hand off payment details locally (NFC)
- Confirm, then pay via USSD
- Android can be payee (HCE "card") and payer (reader) with auto-USSD (fallback
  to dialer)
- iOS is payer (reader) only and cannot auto-dial USSD. It copies the USSD and
  opens the Phone app so users paste and complete

### Core Screens & States

#### Android — Payee ("Get Paid")

**Get Paid Screen:**

- Inputs: Amount, Network (MTN/Airtel), Merchant ID (pre-filled), optional
  Reference
- Activate NFC button → starts HCE session with a 45–60s countdown
- Inline tip: "Keep screen on and unlocked; hold back-to-back with the payer's
  phone."
- Status chips: "Ready to scan · 56s", "One-time payload sent", "Expired — tap
  to reactivate."
- Security hints: shows time-limited and one-time badges

#### Android — Payer ("Pay")

**Scan to Pay Screen:**

- Big CTA: "Scan via NFC"; shows "Bring your phone near the merchant's device."
- On read: shows merchant/network/amount/reference with HMAC/TTL check status
- Confirm & Pay → If dual-SIM, SIM picker sheet; then:
  - USSD progress: "Sending USSD…", with possible network response snippet
  - If blocked/fails: Dialer fallback opens with the encoded USSD (auto-filled)
  - Completion helper: sticky banner "Complete the flow in your dialer; return
    to mark paid."
- Result screen: success/failure with Add note and View history

#### iOS — Payer ("Tap to Pay")

**Scan to Pay Screen:**

- CTA: "Scan with NFC"; shows the 60s CoreNFC session timer hint
- On read: details + validation status
- Confirm & Continue → USSD is copied to clipboard; app opens Phone (blank)
- On return, a lightweight sheet: "Paste the code in the dialer" with 2-step
  instruction and "Mark Paid" checkbox for manual reconciliation (or optional
  push-payment shortcut if you enable it later)

#### History & Receipts (Both Platforms)

- Recent payments list: status pill (Initiated / Pending / Settled / Failed),
  amount, network, ref, time
- Detail view: merchant, nonce, validation results, and reconciliation notes

### Interaction Patterns

**Countdowns & "one-shot" feel:**

- Payee mode clearly shows how long the NFC payload is live and that it's
  consumed once

**Reader feedback:**

- Payer screens show real-time step changes: "Scanning → Payload received →
  Validating → Ready to Pay."

**USSD handoff clarity:**

- Android shows "Sending via your carrier" then either a success or a dialer
  fallback
- iOS shows "USSD copied" + "Open Phone" (auto) + a crisp Paste instruction
  overlay

**Signature/TTL UX:**

- If the payload is expired, replayed, or signature can't be verified, show a
  warning sheet with:
  - Red icon + plain language reason
  - Primary button "Cancel"; secondary "Proceed anyway" (guarded) with a note:
    "May be unsafe."

**Dual-SIM awareness (Android):**

- Short bottom sheet with SIM labels (carrier names & data icons). Remembers
  last choice.

**Sub-60s scan design (iOS):**

- Keep the path short: one tap to start, one confirmation, then the USSD
  copy/open behavior

### Microcopy (Tone & Examples)

- Scan prompts: "Hold your phone near the merchant's device. Keep both phones
  steady."
- Validating: "Checking freshness and signature…"
- USSD on iOS: "USSD code copied. We're opening Phone—paste to continue."
- Fallback on Android: "Your carrier blocked auto-USSD. We've filled the code in
  the dialer."
- Security warnings: "This request looks stale (over 2 minutes old). For safety,
  try again."
- Keep it human and action-oriented; avoid jargon like "APDU" in user-facing
  text

### Error & Edge Cases

- **Expired payload:** show expiry reason; one-tap "Ask merchant to reactivate."
- **Replay detected:** "This code was already used. Ask for a fresh tap."
- **No NFC / disabled:** actionable empty state with "Turn on NFC" deep-link
  (Android) and instructions (iOS)
- **USSD send blocked (Android):** automatic dialer fallback with encoded # →
  %23
- **CoreNFC timeout (iOS):** friendly timeout card with "Try again" action
- **Offline key fetch:** let users proceed with a verification warning; log it
  for reconciliation

### Permissions & Guardrails

- **Android:** NFC, READ_PHONE_STATE (for SIM picker), CALL_PHONE (for
  ACTION_DIAL)
- **iOS:** NFC Reader usage description; no phone permissions needed for opening
  Phone
- UI should explain why a permission is asked and how it improves the flow
  (e.g., "Pick the SIM you want to use for USSD")

### Accessibility & Polish

- Readable contrast, large tap targets, focused voiceover labels ("Copy USSD",
  "Open Phone")
- Haptics: light bump on successful read; warning haptic on expired/replay
- Clipboard feedback (iOS): brief toast "USSD copied."

### Analytics (Lightweight but Useful)

- `nfc_session_started`, `nfc_payload_received`, `validation_result`
  (ok/expired/replay/bad_sig)
- `ussd_attempted` (auto|dialer|copy_open), `payment_marked` (settled|failed)
- `sim_selected` (Android), `ios_paste_helper_shown`
- Keep payload content out of analytics; only metadata and outcomes

### Visual Cheatsheet (Mental Map)

- **Android Payee:** Get Paid → Activate (countdown) → "Sent/Expired"
- **Android Payer:** Scan → Confirm → SIM → USSD (auto) → Dialer fallback if
  needed → Result
- **iOS Payer:** Scan → Confirm → Copy USSD + Open Phone → Paste → Mark Paid
