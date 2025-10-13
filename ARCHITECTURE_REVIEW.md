# SACCO+ Architecture Review

## Overview
The Ibimina Staff Console runs on Next.js 15 App Router with Tailwind design tokens and Supabase providing Auth, Postgres, and Edge Functions. The codebase now includes a new AuthX factor facade (`app/api/authx/*`) alongside the legacy `/api/mfa/*` stack, resulting in duplicated security paths that must be unified for production readiness.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/authx/challenge/verify/route.ts†L36-L100】 Migrations continue to push business data into the `app.*` schema with RLS helpers, while frontend queries still target `public.*` tables and views.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L400-L612】【F:lib/dashboard.ts†L74-L190】

## Frontend Structure
- **Routing**: App Router splits unauthenticated flows under `(auth)` and protected screens under `(main)`. The main layout checks the MFA session cookie before rendering children, redirecting to `/login?mfa=1` when stale.【F:app/(main)/layout.tsx†L1-L28】
- **Providers**: `AppProviders` wraps I18n, theme, toast, offline queue, confirmation modals, PWA registration, and motion animation, ensuring providers run client-side.【F:providers/app-providers.tsx†L1-L32】
- **MFA UI**: `app/(auth)/mfa/page.tsx` renders a segmented factor chooser with passkey/TOTP/email/WhatsApp/backup options, but it depends on the new AuthX endpoints and assumes per-factor state that the API does not yet persist (e.g., failure counters).【F:app/(auth)/mfa/page.tsx†L81-L213】
- **Navigation shell**: `AppShell` renders desktop nav, mobile bottom nav, quick actions dialog, and global search. Quick actions rely on client-only state and currently lack focus management or `aria-current` annotations.【F:components/layout/app-shell.tsx†L166-L289】
- **PWA glue**: The PWA provider registers `service-worker.js` in production and surfaces an install banner; the service worker itself remains a manually maintained asset with a minimal cache list.【F:providers/pwa-provider.tsx†L18-L52】【F:service-worker.js†L1-L58】

## Backend & API Boundaries
- **Supabase clients**: `createSupabaseServerClient` uses the anon key with cookies for SSR, while `createSupabaseAdminClient` keeps the service-role key server-side. Admin client is used extensively for MFA secrets and OTP issuance.【F:lib/supabase/server.ts†L1-L26】【F:lib/supabase/admin.ts†L1-L21】
- **Auth endpoints**: Legacy `/api/mfa/*` endpoints handle enrollment, verification, and passkeys with detailed state updates (`last_mfa_step`, `failed_mfa_count`, trusted device creation). AuthX endpoints expose initiate/verify/factor list APIs but currently omit rate limiting and replay protection.【F:app/api/mfa/verify/route.ts†L72-L228】【F:app/api/authx/challenge/verify/route.ts†L36-L100】
- **OTP services**: Email OTP uses `supabase.functions.invoke('mfa-email')` with hashed storage and rate limits; WhatsApp OTP relies on Twilio but misses throttling/salting, storing deterministic hashes in `authx.otp_issues`.【F:lib/mfa/email.ts†L68-L200】【F:lib/authx/start.ts†L83-L122】
- **Rate limiting & audit**: A shared `enforceRateLimit` RPC runs through the SSR client; audit logging writes to `audit_logs` using SSR client and logs errors when inserts fail (no retries).【F:lib/rate-limit.ts†L1-L19】【F:lib/audit.ts†L9-L21】

## Data Flow
1. Staff authenticate via Supabase; `requireUserAndProfile` fetches user profile and associated SACCO, then `(main)` layout validates MFA cookies before rendering protected routes.【F:lib/auth.ts†L1-L53】【F:app/(main)/layout.tsx†L1-L28】
2. Dashboards fetch payments, ikimina, and members from `public` tables and views, aggregating results in Node to produce summary cards and tables.【F:lib/dashboard.ts†L74-L200】
3. MFA verification depends on two stacks: the legacy route updates Supabase `users` fields, logs audit entries, and issues trusted-device cookies, while the AuthX route simply returns `{ok}` and sets cookies without updating user state or enforcing rate limits.【F:app/api/mfa/verify/route.ts†L72-L209】【F:lib/authx/verify.ts†L35-L166】
4. Supabase Edge Functions handle imports, SMS ingestion, and scheduled jobs; several functions remain unauthenticated (`verify_jwt=false`), making network ingress reliant on external firewalling.【F:supabase/config.toml†L1-L22】

## Database & RLS
- **Schemas**: `app.*` schema hosts core SACCO tables with helper functions (`app.current_sacco`, `app.payment_sacco`) and policies. Legacy `public.*` tables persist for compatibility, but frontend still queries them directly, undermining policy consolidation.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L400-L612】【F:lib/dashboard.ts†L74-L190】
- **Policies**: RLS policies cover user profiles, ikimina, members, payments, recon, accounts, ledger, SMS inbox, imports, audit logs, trusted devices, and ops schemas. Only one SQL test validates sacco_staff access, leaving other policies untested in CI.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】
- **Trusted devices**: Policy allows owners/admins to manage device entries; legacy MFA route writes these records, but AuthX variant does not, risking stale trust lists.【F:app/api/mfa/verify/route.ts†L172-L206】【F:lib/authx/verify.ts†L109-L166】

## Security Posture
- **CSP & headers**: Middleware sets CSP with per-request nonce and security headers; however, style-src still includes `'unsafe-inline'` for Tailwind, reducing strictness.【F:middleware.ts†L1-L36】【F:lib/security/headers.ts†L1-L66】
- **Secrets**: Service-role key remains server-only; `.env.example` documents MFA secrets (KMS data key, peppers, trusted cookie secret) required for hardening.【F:.env.example†L1-L32】
- **Auth gaps**: AuthX verification missing rate limiting/replay guard, WhatsApp OTP unthrottled, and multiple Edge Functions unauthenticated remain primary blockers.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/start.ts†L83-L122】【F:supabase/config.toml†L1-L22】

## Performance & Scalability
- **Dashboard**: In-memory aggregation and 500-row member fetches will not scale; shift to SQL aggregates/materialised views for month summaries and top ikimina lists.【F:lib/dashboard.ts†L74-L200】
- **Images**: `next.config.ts` sets `unoptimized: true`, preventing CDN resizing. Performance budgets rely solely on Lighthouse step; no static asset pipeline configured.【F:next.config.ts†L45-L52】【F:.github/workflows/ci.yml†L31-L48】
- **PWA**: Manual service worker caches minimal assets; offline navigation beyond `/dashboard` fails, and update strategy lacks versioning. Replace with workbox to scale across routes.【F:service-worker.js†L1-L58】

## Observability
- **Logging**: Async-local logger supports structured logs, but audit log failures still only emit console errors; no integration with external logging/alerting system yet.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】
- **Metrics**: No in-app metrics instrumentation; Supabase functions mention `metrics-exporter` but it remains unauthenticated and not wired into dashboards.【F:supabase/config.toml†L17-L22】
- **CI/CD**: CI runs lint/typecheck/build/RLS tests and Lighthouse but uses npm instead of pnpm; preview workflow deploys to Vercel when secrets exist. Need pnpm alignment and auth-focused e2e tests.【F:.github/workflows/ci.yml†L1-L52】【F:.github/workflows/preview.yml†L1-L42】

## Security Header Recommendation
Continue issuing CSP with nonce via middleware but remove `'unsafe-inline'` from `style-src` by migrating critical inline styles to hashed or stylesheet-based approaches; ensure Supabase domains remain whitelisted.【F:lib/security/headers.ts†L1-L66】

## Supabase RLS Recommendation
Standardise on `app.*` schema by introducing views that mirror legacy tables, regenerate Supabase types, and expand SQL tests to cover each policy (payments, recon, trusted devices, ops). Drop or deprecate legacy `public.*` tables once UI migrates.【F:lib/dashboard.ts†L74-L190】【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】
