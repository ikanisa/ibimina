# Ibimina Apps (Staff Admin, Client, Website)

Ibimina delivers SACCO tools for Rwanda: a staff console, a client-facing PWA,
and a marketing site built on a shared Next.js/Tailwind stack. Supabase supplies
auth, database, and real-time features.

## What ships today

- **Staff admin PWA** (`apps/pwa/staff-admin`): onboarding, reconciliation,
  reporting, device-aware MFA.
- **Client PWA** (`apps/pwa/client`): group savings, statements, AI help,
  offline-friendly flows.
- **Website** (`apps/website`): public marketing pages.
- **Shared packages** (`packages/ui`, `packages/lib`, `packages/config`,
  `packages/locales`).

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Backend**: Supabase (Postgres + RLS, auth, Edge Functions), @supabase/ssr
  for server helpers.
- **Tooling**: pnpm workspaces, ESLint/Prettier, Playwright, Husky +
  lint-staged.

## Authentication & data access

1. **Create a Supabase project** and enable email logins. Keep RLS on for every
   table.
2. **Link secrets locally** by copying `.env.example` to `.env` and filling the
   required keys below. The same values should be stored in Vercel/Cloudflare
   and CI secret stores.
3. **Passkeys/TOTP**: set `MFA_RP_ID`, `MFA_ORIGIN`, and `MFA_RP_NAME` to match
   the staff domain so WebAuthn challenges validate correctly.
4. **Edge/Webhooks**: use `HMAC_SHARED_SECRET` to sign Supabase Edge Function
   calls (e.g., SMS inbox or reconciliation hooks).
5. **Optional local database**: `supabase start && supabase db reset` seeds the
   schema and sample data for running without a remote project.

### Required environment variables

| Variable                              | Purpose                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| `APP_ENV`                             | Runtime label (`development`, `staging`, `production`). |
| `NEXT_PUBLIC_SUPABASE_URL`            | Supabase project URL for browser clients.               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Public anon key (RLS enforced).                         |
| `SUPABASE_URL`                        | Supabase service URL for server actions and hooks.      |
| `SUPABASE_SERVICE_ROLE_KEY`           | Service role key for server-only operations.            |
| `KMS_DATA_KEY_BASE64`                 | Base64 32-byte key for encrypting PII.                  |
| `BACKUP_PEPPER`                       | Hex pepper for backup/MFA code hashing.                 |
| `MFA_SESSION_SECRET`                  | Hex secret for MFA session cookies.                     |
| `TRUSTED_COOKIE_SECRET`               | Hex secret for trusted device cookies.                  |
| `HMAC_SHARED_SECRET`                  | Hex secret for verifying webhook/Edge calls.            |
| `MFA_EMAIL_FROM` / `MFA_EMAIL_LOCALE` | Sender and locale for MFA email delivery.               |

Generate secrets locally with:
# Ibimina Monorepo — Next.js PWAs + Supabase

Ibimina is a monorepo housing the staff/admin console, member-facing PWA,
marketing site, and Supabase assets for Umurenge SACCO operations. The flagship
surface is the staff-admin PWA (Next.js 15 App Router with typed routes,
mobile-first gradients, Framer Motion transitions, and Supabase-backed semantic
search), with the member PWA and website sharing the same workspace tooling.

## Quick Links

- [**CONTRIBUTING.md**](CONTRIBUTING.md) - Guidelines for contributing to the
  project
- [**docs/dev/getting-started.md**](docs/dev/getting-started.md) - Consolidated
  developer onboarding checklist
- [**DEVELOPMENT.md**](DEVELOPMENT.md) - Detailed development setup and workflow
  guide
- [**docs/**](docs/) - Additional documentation on architecture, deployment, and
  operations

### Essential Documentation

- [**docs/GROUND_RULES.md**](docs/GROUND_RULES.md) - Mandatory standards and
  best practices
- [**docs/QUICK_REFERENCE.md**](docs/QUICK_REFERENCE.md) - Quick command
  reference with timings
- [**docs/ADMIN_APPS_GUIDE.md**](docs/ADMIN_APPS_GUIDE.md) - Guide to choosing
  the correct admin/staff app
- [**AUTHENTICATION_README.md**](AUTHENTICATION_README.md) - Supabase email + QR
  authentication quickstart
- [**docs/MIGRATION_APPLICATION_GUIDE.md**](docs/MIGRATION_APPLICATION_GUIDE.md) -
  How to apply database migrations
- [**docs/PROJECT_STRUCTURE.md**](docs/PROJECT_STRUCTURE.md) - Project structure
  and dependency graph
- [**docs/TROUBLESHOOTING.md**](docs/TROUBLESHOOTING.md) - Common issues and
  solutions
- [**KNOWN_ISSUES.md**](KNOWN_ISSUES.md) - Current known issues and their
  resolutions
- [**PRE_EXISTING_BUILD_ISSUES.md**](PRE_EXISTING_BUILD_ISSUES.md) - Known build
  issues requiring separate PRs
- [**docs/CI_WORKFLOWS.md**](docs/CI_WORKFLOWS.md) - CI/CD workflows and
  troubleshooting
- [**docs/DB_GUIDE.md**](docs/DB_GUIDE.md) - Database procedures and migration
  guide
- [**docs/SUPABASE_LOCAL_DEVELOPMENT.md**](docs/SUPABASE_LOCAL_DEVELOPMENT.md) -
  Supabase CLI setup and local development guide
- [**docs/SCHEMA_VERIFICATION.md**](docs/SCHEMA_VERIFICATION.md) - Schema drift
  detection and verification system
- [**docs/ENV_VARIABLES.md**](docs/ENV_VARIABLES.md) - Complete environment
  variables reference
- [**packages/README.md**](packages/README.md) - Shared packages documentation

### Deployment Documentation

### Go-Live & Release

- [**Go-Live documentation hub**](docs/go-live/README.md) - Central index for
  audit collateral
- [**Release checklist**](docs/go-live/release-checklist.md) - Step-by-step
  launch procedure
- [**Release artifacts inventory**](docs/go-live/artifacts-inventory.md) -
  Evidence catalog for audits
- [**CI workflows overview**](docs/CI_WORKFLOWS.md) - Required status checks and
  troubleshooting

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

### Authentication at a glance

- **Email-first**: staff authenticate with Supabase email/password managed in
  Auth.
- **Admin invites**: system admins add teammates via the
  `invite-user`/`admin-invite-staff` flow, which issues a temporary password and
  requires a reset on first login.
- **QR continuation**: signed-in mobile devices can approve browser sessions via
  the `auth-qr-*` functions (generate → verify → poll).
- See [AUTHENTICATION_README.md](AUTHENTICATION_README.md) for the complete
  setup and operator runbook.
### Current application inventory

- **Staff-admin PWA** (`apps/pwa/staff-admin`): Next.js 15 App Router, served
  via Node on port `3100` (see Dockerfile), and packaged for Android/iOS via
  Capacitor. Primary target for staff operations.
- **Member PWA** (`apps/pwa/client`): Next.js 15 App Router experience for SACCO
  members and group leaders, also packaged with Capacitor for mobile delivery.
- **Marketing site** (`apps/website`): Next.js static export for product
  marketing and documentation.
- **Supabase backend** (`supabase/`): SQL schema, tests, and Edge Functions for
  auth, payments, and reconciliation flows.
- **Shared packages** (`packages/*`): Config, feature flags, UI kit, data
  access, locales, Supabase schemas, and supporting tooling for all apps.

See `apps/INDEX.md` and `packages/INDEX.md` for per-surface details.

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

- Supabase-backed email authentication with admin invites + QR hand-off
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

### Quickstart (auth-ready)

```bash
# 1) Install dependencies
nvm use 20
npm install -g pnpm@10.19.0
pnpm install

# 2) Copy envs and fill Supabase + auth secrets
cp .env.example .env

# 3) Apply schema + deploy auth helpers
supabase db reset
cd supabase && supabase functions deploy invite-user auth-qr-generate auth-qr-verify auth-qr-poll admin-reset-mfa

# 4) Run the staff console
cd ..
pnpm --filter @ibimina/staff-admin-pwa dev
```

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

| Variable                         | Purpose                        | How to obtain                            |
| -------------------------------- | ------------------------------ | ---------------------------------------- |
| `APP_ENV`                        | Runtime environment label      | Use `development` locally                |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL           | From your Supabase project settings      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Public anon key                | From your Supabase project API settings  |
| `SUPABASE_URL`                   | Service URL for edge functions | From your Supabase project settings      |
| `SUPABASE_SERVICE_ROLE_KEY`      | Service role key (server-only) | From your Supabase project API settings  |
| `KMS_DATA_KEY_BASE64`            | 32-byte base64 encryption key  | Generate with: `openssl rand -base64 32` |
| `BACKUP_PEPPER`                  | Salt for backup codes          | Generate with: `openssl rand -hex 32`    |
| `MFA_SESSION_SECRET`             | MFA session signing key        | Generate with: `openssl rand -hex 32`    |
| `TRUSTED_COOKIE_SECRET`          | Trusted device cookie key      | Generate with: `openssl rand -hex 32`    |
| `HMAC_SHARED_SECRET`             | HMAC for edge function auth    | Generate with: `openssl rand -hex 32`    |
| `MFA_EMAIL_FROM`                 | From address for MFA email     | Use a verified sender (Resend/SMTP)      |
| `MFA_EMAIL_LOCALE`               | Default MFA locale             | Typically `en`, `rw`, or `fr`            |
| `EMAIL_WEBHOOK_URL` _(optional)_ | Custom invite email webhook    | Point at your transactional mailer       |
| `EMAIL_WEBHOOK_KEY` _(optional)_ | Bearer token for webhook auth  | Set alongside the webhook URL            |

Use the quick commands below to mint secrets that match the placeholder formats
in `.env.example`:

```bash
openssl rand -base64 32 # KMS_DATA_KEY_BASE64
openssl rand -hex 32    # BACKUP_PEPPER MFA_SESSION_SECRET TRUSTED_COOKIE_SECRET HMAC_SHARED_SECRET
```

### 5. Run the development server

```bash
# Start the staff console (default port 3100)
pnpm --filter @ibimina/staff-admin-pwa dev
```

The admin console will be available at `http://localhost:3100`.

`.env` stays out of version control and is loaded automatically by the admin
app. See [`docs/local-hosting.md`](docs/local-hosting.md) for a detailed
Mac-hosting walkthrough plus health-check steps.

### Configure CI secret stores

Ensure your CI/CD targets read the same secrets defined in `.env.example`.

#### Vercel

- Set **Production**, **Preview**, and **Development** environment variables to
  include all required keys: `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `KMS_DATA_KEY_BASE64`, `BACKUP_PEPPER`, `MFA_SESSION_SECRET`,
  `TRUSTED_COOKIE_SECRET`, `HMAC_SHARED_SECRET`, `MFA_EMAIL_FROM`, and
  `MFA_EMAIL_LOCALE`. Add `EMAIL_WEBHOOK_URL`/`EMAIL_WEBHOOK_KEY` if you send
  custom invite emails.
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
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
  and `SUPABASE_SERVICE_ROLE_KEY` are required for Supabase clients and edge
  functions.
- `GIT_COMMIT_SHA` is optional and feeds `/api/healthz` plus build diagnostics
  when CI exports it.

For Supabase edge functions and migrations, continue to manage secrets through
`supabase/.env` files or
`supabase secrets set --env-file supabase/.env.production` as part of your
deployment process.
## Getting started

1. **Install toolchain**: Node 20 (see `.nvmrc`) and `pnpm i -g pnpm@10.19.0`.
2. **Install dependencies**: `pnpm install`.
3. **Configure env**: `cp .env.example .env` and populate the required
   variables.
4. **Run locally**:
   - Staff admin: `pnpm --filter @ibimina/staff-admin-pwa dev` (port 3100).
   - Client: `pnpm --filter @ibimina/client dev` (port 5000).
   - Website: `pnpm --filter @ibimina/website dev`.
   - Optional: start Supabase locally with `supabase start` before running the
     apps.

See [RUN_TEST_DEPLOY.md](RUN_TEST_DEPLOY.md) for a concise run/test/deploy flow.

## Project layout

```
apps/
  pwa/
    staff-admin/   # Staff/admin console (Next.js App Router)
    client/        # Client PWA (Next.js App Router)
  website/         # Marketing site
packages/
  ui/ lib/ config/ locales/   # Shared components, utilities, config, translations
supabase/                      # SQL migrations, edge functions, seed data
```

## Deployment notes

- Build PWAs with `pnpm build:admin` and `pnpm build:client`; both output
  standalone `.next` bundles.
- The website can be exported statically
  (`pnpm --filter @ibimina/website build`).
- Mirror the required env vars into your hosting provider and CI; keep
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` in CI for Supabase
  migrations/edge deployments.
