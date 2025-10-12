# SACCO+ Architecture Review

## Overview
The Ibimina Staff Console pairs a Next.js 15 App Router front end with Supabase (Postgres + Auth + Edge Functions). The current build emphasises client-side rendering for dashboards, MFA flows, and recon tools, while migrations attempt a move from legacy `public.*` tables to an `app.*` namespace for multi-tenant enforcement.【F:components/layout/app-shell.tsx†L1-L239】【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】

## Frontend Structure
- **Routing**: App Router split into `(auth)` and `(main)` groups; `(main)` layout enforces MFA session cookie before rendering children.【F:app/(main)/layout.tsx†L9-L29】
- **State & Providers**: `ProfileProvider` injects Supabase profile into the tree; translation provider handles bilingual labels.【F:app/(main)/layout.tsx†L24-L30】【F:components/layout/app-shell.tsx†L91-L239】
- **UI Shell**: `AppShell` implements desktop nav, mobile bottom nav, quick actions dialog, but lacks `aria-current` and keyboard focus traps for the modal.【F:components/layout/app-shell.tsx†L158-L239】
- **Styling**: Tailwind v4 with custom token file defining Rwanda-inspired glassmorphism palette and spacing primitives.【F:styles/tokens.css†L1-L84】
- **Client Components**: MFA screen, dashboard quick actions, and Supabase data consumers rely heavily on client hooks and fetch, increasing hydration payloads.【F:app/(auth)/mfa/page.tsx†L39-L213】【F:lib/dashboard.ts†L73-L200】

## Backend & API Boundaries
- **Supabase Clients**: `lib/supabase/server.ts` creates SSR client using anon key (cookie-based), while `lib/supabase/admin.ts` exposes service-role client for API routes.【F:lib/supabase/server.ts†L1-L26】【F:lib/supabase/admin.ts†L1-L24】
- **MFA APIs**: `/api/mfa/*` routes consume service-role client to read/write secrets and trusted devices, but currently operate directly on `public.users` bypassing new schema abstractions.【F:app/api/mfa/verify/route.ts†L52-L219】
- **Rate Limiting**: `lib/rate-limit.ts` hits `ops.consume_rate_limit` RPC using anon client, failing open on RPC errors.【F:lib/rate-limit.ts†L1-L19】
- **Audit Logging**: `lib/audit.ts` writes to `audit_logs` via anon client, logging to console on failure without retry or queue.【F:lib/audit.ts†L1-L24】
- **Service Worker**: Custom SW caches a fixed shell, not integrated with Next.js asset pipeline; next-pwa wraps build process but `service-worker.js` remains manually maintained.【F:next.config.ts†L29-L51】【F:service-worker.js†L1-L58】

## Data Flow
1. User authenticates via Supabase; `requireUserAndProfile` loads profile + sacco association from Supabase SSR client.【F:lib/auth.ts†L1-L53】
2. Dashboard fetches payments/members via Supabase client, processing month-long arrays client-side to produce KPIs and lists.【F:lib/dashboard.ts†L73-L200】
3. MFA verification uses admin client to decrypt TOTP secret, check backup/email codes, update `users` row, then write trusted device record and audit log.【F:app/api/mfa/verify/route.ts†L83-L224】
4. Rate limits and audit logging rely on Supabase RPC/table writes via SSR client, meaning downtime or policy errors propagate to user operations silently.【F:lib/rate-limit.ts†L1-L19】【F:lib/audit.ts†L1-L24】

## Database & RLS
- **Schemas**: `20251012120000_sacco_plus_schema.sql` introduces `app.*` tables, triggers, and RLS policies, but older `public.*` tables/policies remain in earlier migrations, causing duplication.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】
- **Policy Helpers**: Functions (`app.current_sacco`, `app.payment_sacco`) referenced in docs but not yet validated with automated tests; RLS docs describe expectations without verification harness.【F:docs/RLS.md†L1-L51】
- **Types**: Generated `Database` types still mirror legacy public tables and omit columns like `sacco_id` on audit logs, reducing compile-time safety.【F:lib/supabase/types.ts†L9-L139】
- **Rate Limit & Idempotency**: Ops schema hosts `rate_limits` and `idempotency` tables with helper functions, but client usage fails open and there are no migrations ensuring TTL cleanup is scheduled.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L245-L279】【F:lib/rate-limit.ts†L1-L19】

## Security Posture
- **Headers**: No CSP/frame/referrer headers configured; rely on default Next.js responses.【F:next.config.ts†L29-L51】
- **Secrets**: Service-role key read from server env; risk arises when client bundles accidentally import admin helper (no guard). Need lint rule + bundler guard.
- **MFA Storage**: Secrets encrypted with AES-256-GCM using environment-provided key and pepper; replay guard only ensures step monotonicity but lacks persistent storage for seen steps beyond last step field.【F:app/api/mfa/verify/route.ts†L103-L158】
- **Edge Functions**: Several functions disable JWT verification, relying on external HMAC that is no longer checked, leaving ingestion endpoints exposed.【F:supabase/config.toml†L3-L46】

## Performance & Scalability
- **Image Pipeline**: `unoptimized: true` disables Next image optimisation, inflating payloads for hero art and avatars.【F:next.config.ts†L44-L51】
- **Data Fetching**: No caching or incremental revalidation on dashboards; every request loads entire month from Postgres, which will not scale for busy SACCOs.【F:lib/dashboard.ts†L73-L189】
- **PWA**: Service worker not caching `_next` assets; offline mode unreliable; install prompt absent.【F:service-worker.js†L1-L58】

## Observability
- **Logging**: Console logging only; no structured log shipping or alerting on audit/rate-limit failures.【F:lib/audit.ts†L1-L24】【F:lib/rate-limit.ts†L1-L19】
- **Metrics**: Docs mention Prometheus exporter, but no code references in app; need to confirm instrumentation of API routes.【F:docs/go-live-checklist.md†L95-L137】
- **CI**: Pipeline limited to lint/type/build; lacks Lighthouse/perf budgets and artifact retention.【F:.github/workflows/ci.yml†L1-L32】

## Security Headers Recommendation
Implement `src/lib/security/headers.ts` to generate CSP with nonce, referencing allowed domains for Supabase, fonts, Lucide. Apply via Next.js `headers()` in `next.config.ts` or `middleware.ts` to enforce consistent policy across routes.【F:next.config.ts†L29-L54】

## Supabase RLS Recommendation
Converge on `app.*` schema; generate supabase types, add SQL unit tests for each policy, and ensure UI queries call stored procedures or views that respect SACCO scoping. Remove legacy migrations or mark them to drop deprecated tables once data migrated.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】【F:lib/dashboard.ts†L73-L189】

