# Architecture Runbook

This runbook documents the end-to-end system design for the Ibimina platform so
new engineers can reason about data flow, ownership boundaries, and deployment
surfaces.

## 1. System Overview

- **Staff Console (Next.js 16, PWA)** — `apps/admin` delivers the authenticated
  operations console. Routes under `app/(auth)` gate MFA, while `app/(main)`
  contains dashboards, reconciliation, and SACCO administration
  flows.【F:apps/admin/app/(auth)/login/page.tsx†L1-L160】【F:apps/admin/app/(main)/dashboard/page.tsx†L1-L120】
- **Member PWA (Next.js 15)** — `apps/client` exposes onboarding, group
  discovery, and payment helpers for SACCO members with an offline-first service
  worker and
  manifest.【F:apps/client/app/(auth)/welcome/page.tsx†L1-L120】【F:apps/client/workers/service-worker.ts†L1-L210】
- **Native Mobile (Expo 52)** — `apps/mobile` ships the same member experience
  as a React Native app with Expo Router, NativeWind styling, and analytics
  hooks.【F:apps/mobile/app/(tabs)/home.tsx†L1-L200】【F:apps/mobile/app.config.ts†L1-L80】
- **Background Workers** — `apps/platform-api` runs payment polling, GSM health
  checks, and other automations as long-lived Node workers invoked from the
  CLI.【F:apps/platform-api/src/index.ts†L1-L26】【F:apps/platform-api/src/workers/momo-poller.ts†L1-L200】
- **Supabase Backend** — the `supabase/` directory contains Postgres migrations,
  Row Level Security (RLS) policies, and Deno Edge Functions used by all
  surfaces.【F:supabase/functions/metrics-anomaly-detector/index.ts†L1-L260】

## 2. Data Flow

1. **Authentication**: Both the staff console and client PWA use Supabase auth.
   The staff app layers passkeys/TOTP/backup codes on top of Supabase sessions,
   enforced by middleware and API routes under `app/api/authx` and
   `app/api/device-auth`.【F:apps/admin/app/api/authx/challenge/initiate/route.ts†L1-L160】【F:apps/admin/app/api/device-auth/challenge/route.ts†L1-L120】
2. **Core Data Access**: Shared packages (`@ibimina/config`,
   `@ibimina/data-access`) provide typed clients for Supabase queries so each
   surface executes the same policies and caching
   behavior.【F:packages/config/src/index.ts†L1-L200】【F:packages/data-access/src/index.ts†L1-L180】
3. **Background Automation**: Workers ingest mobile money statements and GSM
   heartbeats, then persist updates in Supabase tables consumed by the staff
   dashboards and
   reports.【F:apps/platform-api/src/workers/momo-poller.ts†L1-L200】【F:apps/admin/app/(main)/reports/page.tsx†L1-L160】
4. **Observability**: Structured logs from the staff console flow through the
   custom logger to external drains, with metrics exported via Supabase
   functions and dashboards under
   `infra/metrics`.【F:apps/admin/lib/observability/logger.ts†L1-L170】【F:infra/metrics/dashboards/ibimina-operations.json†L1-L236】

## 3. Deployment Topology

| Surface            | Hosting target                           | Release command                                              |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| Staff Console      | Vercel (Next.js)                         | `pnpm run release` or `make release`                         |
| Member PWA         | Cloudflare Pages preview / Vercel backup | `pnpm --filter @ibimina/client run deploy:cloudflare`        |
| Native Mobile App  | Expo EAS                                 | `eas build --profile production` (run from `apps/mobile`)    |
| Platform Workers   | Supabase cron jobs / Vercel functions    | `pnpm --filter @ibimina/platform-api run build` then deploy  |
| Supabase Functions | Supabase Edge Functions                  | `pnpm --filter @ibimina/admin run deploy:function:reconcile` |

Release automation always calls `pnpm run check:deploy` before promoting a
build, ensuring lint, typecheck, unit, E2E, and Lighthouse assertions
pass.【F:package.json†L6-L88】【F:Makefile†L1-L104】

## 4. Environment Management

- Copy `.env.example` → `.env.local` and `supabase/.env.example` →
  `supabase/.env.local`, then populate secrets from the shared password manager.
  `make bootstrap` installs dependencies and regenerates Supabase types so the
  admin and client apps stay in sync with the latest
  schema.【F:.env.example†L1-L60】【F:Makefile†L1-L104】
- Supabase migrations and secrets are applied via:
  ```bash
  supabase link --project-ref $SUPABASE_PROJECT_REF
  supabase migration up --linked --include-all --yes
  supabase secrets set --env-file supabase/.env.production
  ```
  These steps are called out in the quick reference and onboarding guides to
  keep local environments
  reproducible.【F:docs/QUICK_REFERENCE.md†L70-L120】【F:docs/dev/getting-started.md†L54-L120】

## 5. Change Coordination

- **Schema changes**: Update SQL migrations, regenerate Supabase types with
  `make bootstrap`, and verify `make test-rls` before opening a PR.
- **API changes**: Update the contract in `docs/runbooks/API_CONTRACT.md`,
  adjust shared packages if necessary, and run `make test` to hit the
  integration suites.
- **UI flows**: Because both the staff and member apps are PWAs, confirm service
  worker assets are refreshed (`apps/*/workers/service-worker.ts`) and offline
  pages updated when introducing new
  routes.【F:apps/admin/workers/service-worker.ts†L1-L220】【F:apps/client/workers/service-worker.ts†L1-L210】

Use this runbook in tandem with the operations and security guides to understand
how a change in one surface propagates through the rest of the system.
