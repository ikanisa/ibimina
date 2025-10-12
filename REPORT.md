# SACCO+ Production Readiness Audit — Ibimina Staff Console

_Date: 2025-10-15_

## Executive Summary
| Area | Status | Notes |
| --- | --- | --- |
| Security | 🔴 Critical gaps | No CSP/headers, duplicated `public` vs `app` schemas without automated policy tests, and MFA admin routes depend on the service-role key without replay protection hardening.【F:next.config.ts†L29-L54】【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】【F:app/api/mfa/verify/route.ts†L26-L228】 |
| Reliability | 🟠 Needs work | Critical flows (MFA, recon, imports) lack integration tests and depend on client-side Supabase RPC calls that can silently fail (rate limits, audit logging) without retries.【F:lib/rate-limit.ts†L1-L19】【F:lib/audit.ts†L1-L24】 |
| Performance | 🟠 Needs work | Global `next/image` optimisations disabled and dashboard queries pull month-long payment sets into memory with no pagination or caching.【F:next.config.ts†L44-L51】【F:lib/dashboard.ts†L60-L200】 |
| PWA | 🟠 Needs work | Manifest has no maskable icons, custom service worker ships a hard-coded shell and skips `_next` assets which breaks offline navigation beyond two routes.【F:public/manifest.json†L1-L15】【F:service-worker.js†L1-L58】 |
| Accessibility | 🟠 Needs work | MFA screen renders button-driven flows without semantic form submission, no error associations, and lacks focus management for dialogs.【F:app/(auth)/mfa/page.tsx†L39-L213】【F:components/layout/app-shell.tsx†L135-L239】 |
| UX | 🟠 Needs work | Navigation lacks current-item announcements, quick action dialog duplicates information without prioritisation, and there are no loading/empty skeletons for large tables.【F:components/layout/app-shell.tsx†L158-L239】【F:lib/dashboard.ts†L88-L200】 |
| Data & RLS | 🔴 Critical gaps | Supabase migrations define both `public.*` and `app.*` tables; generated types lag behind and omit security-sensitive columns, risking drift and policy bypass.【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】【F:lib/supabase/types.ts†L9-L139】 |
| Operations | 🟠 Needs work | CI lacks Lighthouse or preview deployment safeguards; multiple Edge Functions allow unauthenticated invocation by design without compensating telemetry.【F:.github/workflows/ci.yml†L1-L32】【F:supabase/config.toml†L3-L46】 |

## Top Risks
1. **R1 – Schema drift between `public` and `app` namespaces**: Duplicate migrations mean UI queries the legacy `public` tables while policies move to `app`, creating inconsistent RLS coverage. Impact: High. Likelihood: High. Mitigation: Consolidate schema, regenerate types, add policy tests.【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L280】
2. **R2 – Missing response security headers**: No CSP, frame, or referrer policies are set globally, leaving the console open to script injection and clickjacking. Impact: High. Likelihood: Medium. Mitigation: Introduce `headers()` middleware with CSP + nonce helper.【F:next.config.ts†L29-L54】
3. **R3 – MFA verification failure modes leak 500s**: Cryptographic errors return `500` and log secrets, and admin Supabase client updates `public.users` outside RLS, making brute-force detection brittle. Impact: High. Likelihood: Medium. Mitigation: Harden handler with structured 4xx responses, replay guard, and server-only queue for audit writes.【F:app/api/mfa/verify/route.ts†L52-L168】
4. **R4 – PWA offline shell incomplete**: Service worker caches only `/` `/dashboard` `/recon` and ignores `_next` assets, causing blank screens offline; no background sync or update strategy. Impact: Medium. Likelihood: High. Mitigation: Switch to workbox `staleWhileRevalidate`, include manifest + dynamic routes, test via Lighthouse.【F:service-worker.js†L1-L58】
5. **R5 – Type generation outdated**: Supabase `Database` types omit `sacco_id` on audit logs and lack `trusted_devices`, so TypeScript can’t enforce access scope. Impact: Medium. Likelihood: High. Mitigation: Regenerate types from the live schema, add lint rule for `any` escapes.【F:lib/supabase/types.ts†L9-L139】
6. **R6 – Edge Functions without JWT verification**: `parse-sms`, `ingest-sms`, and cron hooks bypass JWT checks, enabling anonymous ingestion unless HMAC is enforced downstream. Impact: High. Likelihood: Medium. Mitigation: Require JWT or signed webhook, add rate limits & telemetry.【F:supabase/config.toml†L3-L46】
7. **R7 – Rate limit RPC uses anon key**: Enforcement calls Supabase RPC with the end-user cookie client, so downtime or auth failure silently disables throttling, undermining brute-force protections. Impact: Medium. Likelihood: Medium. Mitigation: Move to edge function/service-role invoker with circuit breakers.【F:lib/rate-limit.ts†L1-L19】
8. **R8 – Dashboard fetches entire month in memory**: Full-month payment aggregation without pagination risks timeouts and runaway memory for high-volume SACCOs. Impact: Medium. Likelihood: High. Mitigation: Replace with SQL aggregates & materialized views.【F:lib/dashboard.ts†L60-L200】
9. **R9 – MFA UI not mobile-first**: Factor selection lacks bottom sheet or accessible grouping, while trust checkbox defaults to true without explanation, causing UX confusion on phones. Impact: Medium. Likelihood: High. Mitigation: Introduce segmented control, explicit states, ARIA live regions.【F:app/(auth)/mfa/page.tsx†L39-L213】
10. **R10 – CI/CD missing performance budget**: Pipeline stops at build; no Lighthouse or preview gating, so regressions ship unnoticed. Impact: Medium. Likelihood: High. Mitigation: Extend CI with Lighthouse artifact, add Vercel preview with Supabase branch DB.【F:.github/workflows/ci.yml†L1-L32】

## Stack Map
- **Frontend**: Next.js 15 App Router, client-heavy MFA + dashboards, Tailwind token CSS, lucide icons, sonner toasts.【F:components/layout/app-shell.tsx†L1-L239】【F:styles/tokens.css†L1-L84】
- **Auth & Data**: Supabase SSR client for session-bound queries, admin client wraps service-role key, rate-limit RPC in `ops.consume_rate_limit` function.【F:lib/supabase/server.ts†L1-L26】【F:lib/supabase/admin.ts†L1-L24】【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L245-L279】
- **MFA**: Custom API routes for passkeys/TOTP/email + trusted device cookies, yet UI still hits `/api/authx/*` proxies for multi-factor flows.【F:app/api/mfa/verify/route.ts†L26-L228】【F:app/(auth)/mfa/page.tsx†L81-L213】
- **Backend**: Supabase migrations define SACCO entities, SMS ingestion, ledger, RLS policies, but there’s drift between `public` and `app` versions and unverified edge functions.【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】【F:supabase/config.toml†L3-L46】

## Findings by Category
### Security
- Lack of CSP/X-Frame/X-Content-Type headers leaves UI exposed; `next.config.ts` only wires `next-pwa` and image config.【F:next.config.ts†L29-L51】
- MFA verification relies on service-role Supabase client updating `public.users`, bypassing RLS and returning 500 on decrypt issues, enabling enumeration attacks.【F:app/api/mfa/verify/route.ts†L52-L168】
- Edge Functions `parse-sms`, `ingest-sms`, `sms-inbox`, and scheduled jobs allow unauthenticated access; missing audit logs/telemetry per invocation.【F:supabase/config.toml†L3-L46】
- Rate limiter uses anon session client so failure defaults to fail-open logging only a warning.【F:lib/rate-limit.ts†L1-L19】

### Reliability
- Audit logging swallows insert errors and defaults actor ID to zero UUID; no alerting when writes fail.【F:lib/audit.ts†L1-L24】
- Dashboard data loader processes entire payment arrays on the application tier without fallbacks or caching, risking timeouts during month-end loads.【F:lib/dashboard.ts†L73-L200】
- Service worker caches stale shell; no SW versioning strategy, which can strand clients on outdated assets after deploy.【F:service-worker.js†L1-L58】

### Performance
- `next/image` optimisations disabled globally via `unoptimized: true`, preventing CDN resizing and WebP fallback efficiency.【F:next.config.ts†L44-L51】
- Dashboard summarisation loops in JS instead of SQL; no indexes for aggregated queries on `payments` table in UI code path.【F:lib/dashboard.ts†L73-L200】

### PWA & Mobile
- Manifest lacks maskable icons/apple-touch entries; fails installability on Android adaptive icons.【F:public/manifest.json†L1-L15】
- Service worker ignores `_next` assets and API caching, so offline nav to `/ikimina` or `/profile` fails immediately.【F:service-worker.js†L1-L58】

### Accessibility
- MFA flow uses custom buttons with no `<form>`/submit semantics and lacks error associations or `aria-live` region for message updates.【F:app/(auth)/mfa/page.tsx†L150-L213】
- Mobile quick actions dialog toggled by floating button but lacks focus trap/return; closing relies on pointer click only.【F:components/layout/app-shell.tsx†L201-L239】

### UX
- Navigation items don’t surface active state to screen readers (`aria-current` missing), and bilingual quick actions repeat copy without progression status.【F:components/layout/app-shell.tsx†L158-L239】
- Dashboard lacks skeleton loaders; blank spaces appear during Supabase fetch, degrading perceived performance.【F:lib/dashboard.ts†L73-L200】

### Data & RLS
- Two schema tracks (`public.*` and `app.*`) exist simultaneously; generated types only model legacy public tables so new policies or columns aren’t enforced in TypeScript.【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】【F:lib/supabase/types.ts†L9-L139】
- No automated tests validate RLS rules; reliance on documentation in `docs/RLS.md` without executable checks.【F:docs/RLS.md†L1-L51】

### Operations
- CI runs lint/typecheck/build but lacks Lighthouse or test gates, and no artifacts are uploaded for audit trail.【F:.github/workflows/ci.yml†L1-L32】
- Preview deployments not automated; Supabase branch database creation/manual linking absent, and feature flags rely on documentation only.【F:docs/go-live-checklist.md†L95-L137】

## PWA & Mobile-First Scorecard
| Criterion | Status | Evidence |
| --- | --- | --- |
| Installability | 🟠 Maskable icon missing | Manifest only lists PNG icons without `purpose: "maskable"` or Apple touch icons.【F:public/manifest.json†L10-L15】 |
| Offline shell | 🔴 Incomplete | Service worker caches only dashboard/recon routes and skips Next.js assets, so navigation fails offline.【F:service-worker.js†L1-L58】 |
| Responsive navigation | 🟢 Present but improvable | Mobile bottom nav exists yet lacks `aria-current` and focus return controls.【F:components/layout/app-shell.tsx†L201-L239】 |
| Performance budgets | 🔴 Missing | `next.config.ts` disables optimisation; no Lighthouse CI step yet.【F:next.config.ts†L44-L51】【F:.github/workflows/ci.yml†L1-L32】 |
| MFA mobile flow | 🟠 Needs redesign | Factor chooser is desktop-centric with plain selects/inputs and no per-factor guidance.【F:app/(auth)/mfa/page.tsx†L150-L213】 |

## UI/UX Heuristics (Nielsen)
- **Visibility of system status**: MFA initiation shows success/error text but no spinner overlay or toast; dashboard lacks loading states when fetching Supabase data.【F:app/(auth)/mfa/page.tsx†L81-L213】【F:lib/dashboard.ts†L73-L200】
- **User control & freedom**: Quick actions modal closes only via pointer click; no ESC handler or focus trap, hindering keyboard users.【F:components/layout/app-shell.tsx†L201-L239】
- **Error prevention**: Trust device checkbox defaulted true without context increases accidental long-term trust on shared devices.【F:app/(auth)/mfa/page.tsx†L170-L188】
- **Recognition vs recall**: Navigation icons lack labels for assistive tech; quick actions replicate navigation entries instead of contextual tasks.【F:components/layout/app-shell.tsx†L158-L239】

## RLS & Multi-tenancy Evaluation
- `supabase/migrations/20251012120000_sacco_plus_schema.sql` establishes `app.user_profiles` and policy helpers but UI still queries `public` views, creating inconsistent enforcement.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】【F:lib/dashboard.ts†L73-L189】
- Legacy migration `20251007111647_...` continues to define RLS on `public.ibimina`, `public.members`, etc., risking policy divergence when only one schema is updated.【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】
- No automated RLS regression tests exist; `docs/RLS.md` is descriptive only.【F:docs/RLS.md†L1-L51】

## Observability & Ops
- Audit logger suppresses errors and defaults actor IDs, so there is no guarantee failures are surfaced to operators.【F:lib/audit.ts†L9-L23】
- Rate limiter lacks telemetry/log forwarding beyond console warnings, so SREs cannot distinguish fail-open events.【F:lib/rate-limit.ts†L3-L18】
- CI pipeline lacks artifact retention and does not run Lighthouse/performance budgets.【F:.github/workflows/ci.yml†L1-L32】

## Recommendations
- **Short term (P0)**: Add global security headers with CSP nonce helper; refactor MFA verify to return structured 4xx, enforce replay guard, and rely on server-side queue; regenerate Supabase types and align UI queries to canonical schema; expand CI with Lighthouse + artifacts.【F:next.config.ts†L29-L54】【F:app/api/mfa/verify/route.ts†L26-L228】【F:lib/supabase/types.ts†L9-L139】【F:.github/workflows/ci.yml†L1-L32】
- **Medium term (P1)**: Redesign MFA UI with segmented factor chooser, accessible dialogs, and trust-device education; implement SQL-backed dashboard aggregates and skeleton states; deliver install prompt + dynamic SW caching with workbox.【F:app/(auth)/mfa/page.tsx†L39-L213】【F:lib/dashboard.ts†L73-L200】【F:service-worker.js†L1-L58】
- **Long term (P2)**: Harden Edge Functions with JWT/HMAC verification, implement idempotent ledger operations, integrate analytics dashboards and operations runbooks into app, add Supabase branch automation in preview workflow.【F:supabase/config.toml†L3-L46】【F:docs/go-live-checklist.md†L95-L137】

## Appendix
- Tooling executed: `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build` (captured in `.reports/build.log` and terminal logs).【6c35f5†L1-L7】【9fd272†L1-L4】【6eeaf0†L1-L4】【f17b18†L1-L19】
- Attempted bundle analysis failed (package unavailable) — follow-up required.【cede29†L1-L6】
- Build artefact summary logged under `.reports/build.log` for reference.【232486†L1-L20】
