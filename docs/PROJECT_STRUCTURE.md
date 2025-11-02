# Project Structure and Dependency Graph

**Version**: 2.0  
**Last Updated**: 2025-11-28

The ibimina monorepo hosts every surface required to ship the Umurenge SACCO
platform: the staff console, member PWA, native mobile client, background
workers, shared packages, infrastructure as code, and Supabase migrations.
Everything is wired together through a pnpm workspace so upgrades propagate
consistently.

## 📁 Repository Overview

```
ibimina/
├── apps/                    # Deployable applications (web, native, workers)
├── packages/                # Shared packages reused across apps
├── infra/                   # Observability and operations tooling
├── supabase/                # Database schema, tests, functions, cron jobs
├── docs/                    # Architecture, operations, and runbooks
├── scripts/                 # Automation utilities (validation, tooling)
└── config files             # ESLint, tsconfig, Tailwind, etc.
```

## 🏗️ High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ Frontend Surfaces                                                  │
│  • Staff Console (Next.js 16) ─────────────┐                        │
│  • Member PWA (Next.js 15) ────────────────┤──▶ Supabase (Postgres, │
│  • Native Mobile (Expo 52) ────────────────┘    Auth, Storage,     │
│                                                     Edge Functions) │
│ Backend & Automations                                              │
│  • Platform workers (@ibimina/platform-api) ──▶ Payments, SMS, RLS  │
└────────────────────────────────────────────────────────────────────┘
                 ▲                          │
                 │ Shared packages (@ibimina/config, ui, data-access…)
                 └──────────────────────────┘
```

Every surface shares generated Supabase types, runtime configuration, and UI
building blocks so product changes stay aligned across
platforms.【F:package.json†L1-L76】【F:packages/README.md†L1-L120】

## 📦 Applications (`apps/`)

### 1. Staff Console — `apps/admin`

- **Framework**: Next.js 16 App Router with Node runtime (PWA
  enabled).【F:apps/admin/package.json†L1-L78】【F:apps/admin/app/manifest.ts†L1-L40】
- **Primary capabilities**:
  - Auth & MFA flows under `app/(auth)` including passkeys, TOTP, and trusted
    devices.【F:apps/admin/app/(auth)/login/page.tsx†L1-L160】【F:apps/admin/app/api/device-auth/challenge/route.ts†L1-L120】
  - SACCO operations dashboards, reconciliation, Ikimina management, and
    reporting from `app/(main)` route
    groups.【F:apps/admin/app/(main)/dashboard/page.tsx†L1-L120】【F:apps/admin/app/(main)/reconciliation/page.tsx†L1-L200】
  - Installable PWA with custom manifest, service worker, and offline
    fallback.【F:apps/admin/app/manifest.ts†L1-L40】【F:apps/admin/workers/service-worker.ts†L1-L220】【F:apps/admin/app/offline/page.tsx†L1-L80】
- **Key directories**:
  - `components/` — shared UI (Glass cards, gradient headers, data tables).
  - `lib/` — auth guards, Supabase clients, logging, auditing
    utilities.【F:apps/admin/lib/auth.ts†L1-L200】【F:apps/admin/lib/observability/logger.ts†L1-L170】
  - `providers/` — analytics, feature flags, and error boundaries.
  - `tests/` — unit, RLS, Playwright E2E, and observability checks.

### 2. Member PWA — `apps/client`

- **Framework**: Next.js 15 App Router, optimized for mobile-first browsing and
  installability.【F:apps/client/package.json†L1-L82】
- **Key experiences**:
  - Guided onboarding, locale-aware welcome, and account activation under
    `app/(auth)`
    routes.【F:apps/client/app/(auth)/welcome/page.tsx†L1-L120】【F:apps/client/app/(auth)/onboard/page.tsx†L1-L180】
  - Group discovery, payment instructions, and offline messaging under
    `app/(main)` and supporting
    routes.【F:apps/client/app/groups/page.tsx†L1-L200】【F:apps/client/app/pay-sheet/page.tsx†L1-L160】
  - PWA manifest + service worker for offline-first
    experience.【F:apps/client/app/manifest.ts†L1-L40】【F:apps/client/workers/service-worker.ts†L1-L210】
- **Security**: only Supabase anon key, all data behind RLS policies enforced
  via the shared Supabase
  client.【F:apps/client/lib/supabase/client.ts†L1-L120】

### 3. Native Mobile App — `apps/mobile`

- **Framework**: Expo 52 / React Native 0.76 using Expo Router and
  NativeWind.【F:apps/mobile/package.json†L1-L72】
- **Features**: bottom tab navigation, one-tap MoMo payments, statements, and
  offers implemented via Expo Router routes in `app/(tabs)` and supporting
  providers in `src/` for Zustand state, React Query, analytics, and feature
  flags.【F:apps/mobile/app/(tabs)/home.tsx†L1-L200】【F:apps/mobile/src/providers/app.tsx†L1-L160】
- **Release hooks**: deep linking, Sentry, PostHog, ConfigCat, and EAS project
  metadata defined in `app.config.ts` and `package.json` scripts for Expo start
  and
  testing.【F:apps/mobile/app.config.ts†L1-L80】【F:apps/mobile/package.json†L1-L72】

### 4. Platform Workers — `apps/platform-api`

- **Runtime**: TypeScript workers orchestrated through a CLI entry point that
  runs payment polling and GSM heartbeats
  (`pnpm --filter @ibimina/platform-api run build && node dist/...`).【F:apps/platform-api/src/index.ts†L1-L26】
- **Responsibilities**:
  - `runMomoPoller` ingests mobile money statements into Supabase queues for
    reconciliation
    automation.【F:apps/platform-api/src/workers/momo-poller.ts†L1-L200】
  - `runGsmHeartbeat` monitors SMS modem availability and updates the operations
    log.【F:apps/platform-api/src/workers/gsm-heartbeat.ts†L1-L160】
  - Integration and performance suites under `tests/` ensure idempotent jobs and
    alerting contract
    coverage.【F:apps/platform-api/tests/integration/reconciliation.test.ts†L1-L180】

### Additional Surfaces

The monorepo also includes legacy wrappers (`apps/android-auth`, `apps/ios`),
the marketing site (`apps/website`), and white-label builds such as
`sacco-plus-client`. They consume the same shared packages and Supabase APIs and
inherit deployment tooling defined at the workspace
root.【F:apps/android-auth/package.json†L1-L40】【F:apps/website/package.json†L1-L60】

## 🧩 Shared Packages (`packages/`)

Shared packages provide consistent primitives across surfaces:

| Package                | Purpose                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `@ibimina/config`      | Runtime configuration, environment schema, feature flags.【F:packages/config/src/index.ts†L1-L200】      |
| `@ibimina/ui`          | Design system and Tailwind presets for web frontends.【F:packages/ui/src/index.ts†L1-L160】              |
| `@ibimina/locales`     | i18n catalogs (EN/Kinyarwanda/French) shared across apps.【F:packages/locales/src/index.ts†L1-L140】     |
| `@ibimina/data-access` | Typed Supabase queries and repository helpers.【F:packages/data-access/src/index.ts†L1-L180】            |
| `@ibimina/providers`   | Cross-app React providers (analytics, feature flags, auth).【F:packages/providers/src/index.ts†L1-L160】 |
| `@ibimina/testing`     | Jest/Playwright test harness utilities.【F:packages/testing/src/index.ts†L1-L200】                       |
| `@ibimina/ai-agent`    | Agent orchestrations for SMS parsing and support automation.【F:packages/ai-agent/src/index.ts†L1-L220】 |

Packages are published locally via pnpm workspaces; each app lists them as
`workspace:*` dependencies to ensure a single source of
truth.【F:apps/admin/package.json†L51-L79】【F:apps/client/package.json†L49-L78】【F:apps/mobile/package.json†L13-L68】

## 🗄️ Data & Backend (`supabase/`)

- **Migrations**: SQL migrations in `supabase/migrations` define Postgres
  schema, RLS policies, triggers, cron schedules, and metrics views. Apply them
  with `supabase migration up --linked --include-all` as part of bootstrap.
- **Edge Functions**: The `supabase/functions/` directory houses Deno functions
  for anomaly detection, reconciliation, SMS parsing, and webhook
  dispatch.【F:supabase/functions/metrics-anomaly-detector/index.ts†L1-L260】【F:supabase/functions/reconcile/index.ts†L1-L200】
- **Testing**: RLS and API contracts validated through `apps/admin/tests/rls`
  and `supabase/tests` to guarantee permissions
  coverage.【F:apps/admin/tests/rls/memberships.test.ts†L1-L160】

## 🔄 Automation & Tooling

- Root scripts (`pnpm run check:deploy`, `pnpm run release`) orchestrate
  linting, type checking, multi-surface tests, bundle verification, and
  production deploys to Vercel using the shared Makefile
  wrappers.【F:package.json†L6-L76】【F:Makefile†L1-L104】
- Git hooks via Husky enforce formatting and linting on staged files before
  commits land.【F:package.json†L77-L102】
- CI workflows mirror the same commands so local runs match pipeline behavior.

Use this document as the canonical map when planning changes: it links each
business capability to the Next.js routes, React Native screens, or worker jobs
that implement it.
