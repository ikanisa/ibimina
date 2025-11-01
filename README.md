# Ibimina Staff Console — Next.js App Router

A staff-only Progressive Web App for Umurenge SACCO ibimina operations. The UI
foundation now matches the Rwanda-inspired liquid-glass spec: Next.js 15 App
Router, mobile-first gradients, Framer Motion transitions, and Supabase-backed
semantic SACCO search.

## Quick Links

- [**CONTRIBUTING.md**](CONTRIBUTING.md) - Guidelines for contributing to the
  project
- [**DEVELOPMENT.md**](DEVELOPMENT.md) - Detailed development setup and workflow
  guide
- [**docs/**](docs/) - Additional documentation on architecture, deployment, and
  operations

### Essential Documentation

- [**docs/GROUND_RULES.md**](docs/GROUND_RULES.md) - Mandatory standards and
  best practices
- [**docs/QUICK_REFERENCE.md**](docs/QUICK_REFERENCE.md) - Quick command
  reference with timings
- [**docs/PROJECT_STRUCTURE.md**](docs/PROJECT_STRUCTURE.md) - Project structure
  and dependency graph
- [**docs/TROUBLESHOOTING.md**](docs/TROUBLESHOOTING.md) - Common issues and
  solutions
- [**docs/CI_WORKFLOWS.md**](docs/CI_WORKFLOWS.md) - CI/CD workflows and
  troubleshooting
- [**docs/DB_GUIDE.md**](docs/DB_GUIDE.md) - Database procedures and migration
  guide
- [**docs/SCHEMA_VERIFICATION.md**](docs/SCHEMA_VERIFICATION.md) - Schema drift
  detection and verification system
- [**docs/ENV_VARIABLES.md**](docs/ENV_VARIABLES.md) - Complete environment
  variables reference
- [**packages/README.md**](packages/README.md) - Shared packages documentation

### Deployment Documentation

- [**docs/CLOUDFLARE_DEPLOYMENT.md**](docs/CLOUDFLARE_DEPLOYMENT.md) -
  Comprehensive guide for deploying to Cloudflare Pages
- [**CLOUDFLARE_DEPLOYMENT_CHECKLIST.md**](CLOUDFLARE_DEPLOYMENT_CHECKLIST.md) -
  Step-by-step deployment checklist
- [**.env.cloudflare.template**](.env.cloudflare.template) - Environment
  variables template for Cloudflare
- [**DEPLOYMENT_GUIDE.md**](DEPLOYMENT_GUIDE.md) - General deployment guide

## Overview

**Ibimina** (Kinyarwanda for "groups") is a comprehensive SACCO management
platform designed for Rwanda's Umurenge SACCOs. The system manages group savings
(ikimina), member accounts, mobile money payments, and reconciliation workflows.
Built with security, observability, and offline-first capabilities in mind.

## Branching model

- `main` is the deployment-ready default branch and now tracks the latest
  reviewed `work` refactor.
- `work` remains the integration branch for active feature development; open
  pull requests should continue to target `work` until they are ready to be
  promoted.
- After validation, merge `work` into `main` (fast-forward preferred) so
  production containers and local staging environments stay aligned with the
  most recent authenticated flows.

## Tech stack

### Frontend

- **Next.js 15** (App Router with typed routes)
- **TypeScript 5.9** for type safety
- **Tailwind CSS** with custom design tokens (`styles/tokens.css`)
- **Framer Motion** for page transitions and animations
- **PWA** (Progressive Web App) with manifest & service worker

### Backend

- **Supabase** for authentication, database, and Edge Functions
  - PostgreSQL with Row-Level Security (RLS)
  - Real-time subscriptions
  - Edge Functions (Deno runtime)
- **@supabase/ssr** for SSR-compatible auth

### Infrastructure

- **Prometheus + Grafana** for observability (in `infra/metrics/`)
- **Docker** for containerized deployments
- **pg_cron** for scheduled database jobs

### Key Features

- Multi-factor authentication (TOTP, Passkeys/WebAuthn, Email OTP)
- End-to-end encryption for PII (AES-256-GCM)
- Offline-first capabilities with service workers
- Bilingual interface (English, Kinyarwanda, French)
- Semantic SACCO search with trigram matching

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js** v20.x or higher (specified in `.nvmrc`)
- **pnpm** v10.19.0 (specified in `package.json`)
- **Supabase CLI** (for local database development)
- **Docker** (optional, for running local Supabase and metrics stack)

## Development Tooling

- **Package Manager**: pnpm 10.19.0 (monorepo workspace)
- **Code Quality**: ESLint + Prettier (auto-format on commit)
- **Commit Convention**: Conventional Commits with commitlint
- **Git Hooks**: husky + lint-staged for pre-commit checks
- **Dependency Management**: Renovate bot for automated updates
- **Testing**: Playwright (E2E), tsx (unit tests), Supabase RLS tests

See [CONTRIBUTING.md](CONTRIBUTING.md) and [DEVELOPMENT.md](DEVELOPMENT.md) for
detailed guidelines.

## Getting Started

### 1. Install dependencies

```bash
# Use the correct Node version
nvm use 20

# Install pnpm if not already installed
npm install -g pnpm@10.19.0

# Install project dependencies
pnpm install
```

### 2. Copy and configure environment variables

```bash
# Copy the example environment file
cp .env.example .env
```

`.env.example` groups the mandatory secrets at the top so you can see what must
be filled in before running the app. Update `.env` with the following
**required** values (matching the placeholders shipped in `.env.example`):

| Variable                        | Purpose                        | How to obtain                            |
| ------------------------------- | ------------------------------ | ---------------------------------------- |
| `APP_ENV`                       | Runtime environment label      | Use `development` locally                |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL           | From your Supabase project settings      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key                | From your Supabase project API settings  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (server-only) | From your Supabase project API settings  |
| `KMS_DATA_KEY_BASE64`           | 32-byte base64 encryption key  | Generate with: `openssl rand -base64 32` |
| `BACKUP_PEPPER`                 | Salt for backup codes          | Generate with: `openssl rand -hex 32`    |
| `MFA_SESSION_SECRET`            | MFA session signing key        | Generate with: `openssl rand -hex 32`    |
| `TRUSTED_COOKIE_SECRET`         | Trusted device cookie key      | Generate with: `openssl rand -hex 32`    |
| `HMAC_SHARED_SECRET`            | HMAC for edge function auth    | Generate with: `openssl rand -hex 32`    |
| `MFA_EMAIL_FROM`                | From address for MFA email     | Use a verified sender (Resend/SMTP)      |
| `MFA_EMAIL_LOCALE`              | Default MFA locale             | Typically `en`, `rw`, or `fr`            |

Use the quick commands below to mint secrets that match the placeholder formats
in `.env.example`:

```bash
openssl rand -base64 32 # KMS_DATA_KEY_BASE64
openssl rand -hex 32    # BACKUP_PEPPER, MFA_SESSION_SECRET, TRUSTED_COOKIE_SECRET, HMAC_SHARED_SECRET
```

See `.env.example` for optional configuration covering logging, email,
analytics, Web Push, and test scaffolding.

### 3. Provision Supabase secrets (optional but recommended)

When you link a Supabase project, push the same secrets to the project so Edge
Functions and migrations run locally and in CI with matching credentials:

```bash
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  HMAC_SHARED_SECRET=$HMAC_SHARED_SECRET \
  KMS_DATA_KEY_BASE64=$KMS_DATA_KEY_BASE64 \
  BACKUP_PEPPER=$BACKUP_PEPPER \
  TRUSTED_COOKIE_SECRET=$TRUSTED_COOKIE_SECRET \
  MFA_SESSION_SECRET=$MFA_SESSION_SECRET \
  MFA_EMAIL_FROM=$MFA_EMAIL_FROM \
  MFA_EMAIL_LOCALE=$MFA_EMAIL_LOCALE
```

### 4. Start local Supabase (optional)

For local development with a full database:

```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# The local instance runs at http://127.0.0.1:54321
# Update your .env with these local URLs
```

### 5. Run the development server

```bash
# Start Next.js dev server (default port 3000)
pnpm dev

# Or start a specific app
pnpm --filter @ibimina/admin dev
```

The admin console will be available at `http://localhost:3000`.

`.env` stays out of version control and is loaded automatically by the admin
app. See [`docs/local-hosting.md`](docs/local-hosting.md) for a detailed
Mac-hosting walkthrough plus health-check steps.

### Configure CI secret stores

Ensure your CI/CD targets read the same secrets defined in `.env.example`.

#### Vercel

- Set **Production**, **Preview**, and **Development** environment variables to
  include all required keys: `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `KMS_DATA_KEY_BASE64`, `BACKUP_PEPPER`, `MFA_SESSION_SECRET`,
  `TRUSTED_COOKIE_SECRET`, `HMAC_SHARED_SECRET`, `MFA_EMAIL_FROM`, and
  `MFA_EMAIL_LOCALE`.
- Mirror any optional integrations you rely on (Resend, OpenAI, Web Push) using
  the same names and values found in `.env`.
- Use `vercel env pull` to refresh local `.env` files after updating the secret
  store so developers stay aligned.

#### GitHub Actions

- Store the same required variables listed above as repository or environment
  secrets so workflows can build and run Playwright tests against preview
  deployments.
- Add Supabase deployment credentials alongside them: `SUPABASE_PROJECT_REF` and
  `SUPABASE_ACCESS_TOKEN` for the Supabase CLI workflow.
- When rotating secrets, update the GitHub Action store and immediately refresh
  Vercel to keep build and deploy pipelines in sync.

- `pnpm start` (and the `apps/admin/scripts/start.sh` wrapper) boots the
  `.next/standalone` output by default. Set `ADMIN_USE_STANDALONE_START=0` (or
  `USE_STANDALONE_START=0`) if you explicitly want to fall back to `next start`
  during troubleshooting.

### Environment variables

The repo ships with a curated `.env.example` that lists every secret the runtime
expects. Update that file when you add/remove configuration so the team always
has an up-to-date reference.

- `APP_ENV` controls high-level behaviour such as CSP allowances and log
  metadata. Defaults to `development` locally.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` are required for Supabase clients.
- `GIT_COMMIT_SHA` is optional and feeds `/api/healthz` plus build diagnostics
  when CI exports it.

For Supabase edge functions and migrations, continue to manage secrets through
`supabase/.env` files or
`supabase secrets set --env-file supabase/.env.production` as part of your
deployment process.

## Running Supabase migrations

The Umurenge SACCO master list is seeded by the latest SQL migration:

```
supabase/migrations/20251008120000_enrich_saccos_with_umurenge_master.sql
```

Run this migration via the Supabase SQL console (or through your preferred admin
workflow) to apply the schema updates, semantic search function, and the 416
Umurenge SACCO records captured in `supabase/data/umurenge_saccos.json`.

## Project layout

```
pnpm-workspace.yaml      # pnpm monorepo definition
apps/
  admin/                # Next.js staff console (App Router)
  platform-api/         # Placeholder for future API/cron services
packages/
  config/               # (WIP) typed runtime config loader
  core/                 # (WIP) shared domain + Supabase helpers
  testing/              # (WIP) Playwright / Vitest utilities
  ui/                   # (WIP) shared design system components
supabase/               # Config, migrations, seed data
docs/                   # Architecture, hosting, onboarding guides
```

## Supabase integration

- `lib/supabase/server.ts` exposes a server-side client that reads the session
  cookie (no project linking required).
- `lib/auth.ts` centralises user/session lookups and guards the `(main)` route
  group.
- Dashboard, Ikimina, Recon, Reports, and Admin pages now query Supabase
  directly in server components.
- See `docs/go-live-checklist.md` for the full Supabase bootstrap sequence
  (migrations, secrets, edge functions, GSM ingestion).
- Refer to `docs/local-hosting.md` when wiring Supabase credentials into
  `.env.local` for local development.

### GitHub Actions deployment secrets

In addition to the application secrets listed under
[_Configure CI secret stores_](#configure-ci-secret-stores), the Supabase deploy
workflow (`.github/workflows/supabase-deploy.yml`) requires the following
repository secrets so migrations and edge functions can be promoted
automatically:

- `SUPABASE_PROJECT_REF` – the Supabase project reference used by
  `supabase link` and `supabase migration up`.
- `SUPABASE_ACCESS_TOKEN` – a personal access token with CLI access to the
  project (Settings → Access Tokens in the Supabase dashboard).

Ensure these secrets stay in sync with your production project before re-running
the workflow.

## SACCO+ Supabase backend

The SACCO+ runtime lives under `supabase/` and is documented in:

- `docs/DB-SCHEMA.md` – entity model, columns, helper functions
- `docs/RLS.md` – policy matrix covering SACCO staff vs system admins
- `docs/API-EDGE.md` – Edge Function endpoints, auth model, rate limits

### Local bootstrap

```bash
supabase start
supabase db reset
supabase functions serve sms-inbox --no-verify-jwt
supabase functions serve payments-apply
```

Provision secrets once per project (service role, HMAC, AI, crypto keys, report
signing):

```bash
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  HMAC_SHARED_SECRET=$HMAC_SHARED_SECRET \
  KMS_DATA_KEY_BASE64=$KMS_DATA_KEY_BASE64 \
  BACKUP_PEPPER=$BACKUP_PEPPER \
  TRUSTED_COOKIE_SECRET=$TRUSTED_COOKIE_SECRET \
  REPORT_SIGNING_KEY=$REPORT_SIGNING_KEY \
  EMAIL_OTP_PEPPER=$EMAIL_OTP_PEPPER \
  RESEND_API_KEY=$RESEND_API_KEY \
  MFA_EMAIL_FROM=$MFA_EMAIL_FROM
```

- Passkeys + TOTP: set `MFA_RP_ID`, `MFA_ORIGIN`, and optional `MFA_RP_NAME` so
  WebAuthn challenges issue against the correct relying party. Staff can enroll
  hardware-backed passkeys alongside authenticator apps from **Profile →
  Security**.

### Smoke cURL tests

```bash
# sms inbox (text/plain)
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BODY='You have received RWF 20,000 from 0788... Ref NYA.GAS.TWIZ.001 TXN 12345 at 2025-10-01 12:00'
# Adjust context if your EDGE_URL path differs (default Supabase deployments use /functions/v1)
CONTEXT="POST:/functions/v1/sms/inbox"
SIG=$(printf "%s%s%s" "$TS" "$CONTEXT" "$BODY" | openssl dgst -sha256 -hmac "$HMAC_SHARED_SECRET" -hex | cut -d" " -f2)
curl -i -X POST "$EDGE_URL/sms/inbox" \
  -H "x-signature: $SIG" \
  -H "x-timestamp: $TS" \
  -H "content-type: text/plain" \
  --data "$BODY"

# AI parse fallback
curl -i -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "content-type: application/json" \
  -d '{"smsInboxId":"<uuid>"}' \
  "$EDGE_URL/sms/ai-parse"

# payments apply (idempotent)
curl -i -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "x-idempotency-key: demo-1" \
  -H "content-type: application/json" \
  -d '{"saccoId":"<uuid>","msisdn":"+250788...","amount":20000,"currency":"RWF","txnId":"12345","occurredAt":"2025-10-01T12:00:00Z","reference":"NYA.GAS.TWIZ.001"}' \
  "$EDGE_URL/payments/apply"
```

After each deploy run `scripts/postdeploy-verify.sh` to apply cron job health
checks, invoke smoke tests, and confirm secrets.

## Observability & Ops

- `supabase/functions/metrics-exporter` exposes Prometheus gauges covering
  SMS/notification backlog, payments, and exporter health.
- Run `docker compose up` inside `infra/metrics` to launch Prometheus + Grafana
  locally; the default dashboard (`ibimina-operations`) is provisioned
  automatically.
- Operational runbooks live in `docs/security-observability.md`, feature flag
  procedures in `docs/operations/feature-flags.md`, and MFA rollout guidance in
  `docs/operations/mfa-rollout.md`.

### GSM modem ingestion

Edge functions no longer expect a third-party SMS webhook. The GSM modem reader
can forward messages straight to Supabase by either inserting directly into
`public.sms_inbox` with a service-role key or by invoking the `ingest-sms` edge
function with the standard Supabase `Authorization: Bearer <service_role_key>`
header:

```
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
INGEST_CONTEXT="POST:/functions/v1/ingest-sms"
PAYLOAD='{"rawText":"15000 AIRTEL 2505221230 REF.KIG/NYARUGENGE.G2.M001","receivedAt":"2025-10-09T07:21:12Z","vendorMeta":{"modemPort":"usb0"}}'
INGEST_SIG=$(printf "%s%s%s" "$TS" "$INGEST_CONTEXT" "$PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SHARED_SECRET" -hex | cut -d" " -f2)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-signature: $INGEST_SIG" \
  -H "x-timestamp: $TS" \
  https://<project-ref>.supabase.co/functions/v1/ingest-sms \
  -d "$PAYLOAD"
```

`ingest-sms` still runs parsing, deduplication, ledger posting, and auditing,
but no longer checks `SMS_SHARED_SECRET`. Adjust rate limits if needed with
`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_SECONDS` secrets.

## Recent polish

- Revamped the AppShell with bilingual navigation, skip links, quick actions,
  and a global search palette that exposes semantic SACCO lookup.
- Extended global search to surface ikimina, members, and recent payments with
  bilingual microcopy baked into the palette.
- Expanded client-side search across Ikimina directories while keeping upload
  wizards and RPC-powered SACCO picking in sync with Supabase.
- Rounded out accessibility with consistent focus treatments, bilingual
  microcopy, and a `viewport` export that advertises the active theme colour.

## Scripts

- `pnpm dev` – start the dev server on port 3000
- `pnpm build` – production build with PWA bundling
- `pnpm start` – serve the built app on port 3000 (respects `PORT`)
- `pnpm lint` – lint the project
- `pnpm typecheck` – run TypeScript without emitting files
- `pnpm check:lighthouse` – open a Lighthouse report against localhost
- `pnpm analyze:pwa` – run Lighthouse PWA checks against
  `https://localhost:3000`
- `pnpm verify:pwa` – validate manifest/head/service worker and probe
  `/api/health`
- `pnpm check:i18n` – ensure en/rw/fr have matching keys
- `pnpm check:i18n:consistency` – enforce canonical glossary terms across
  locales
- `pnpm fix:i18n` – backfill missing rw/fr keys from en (flat keys)

Deployments run through your self-hosted CI/CD pipeline; push changes when
you’re ready to release to your local or on-prem infrastructure.

## Deployment readiness

- Run `pnpm run check:deploy` (or `make ready`) to execute the same
  lint/type/test/build/Playwright/Lighthouse/log-drain gates that CI enforces.
- Run `pnpm run validate:production` to verify production readiness
  prerequisites.
- Walk through the [Production Go-Live Checklist](PRODUCTION_CHECKLIST.md) for
  comprehensive pre-deployment validation.
- Review the [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) for standard
  release procedures.
- Follow [Post-Deployment Validation](docs/POST_DEPLOYMENT_VALIDATION.md) after
  each deployment.
- Keep [Disaster Recovery Procedures](docs/DISASTER_RECOVERY.md) accessible for
  emergency response.
