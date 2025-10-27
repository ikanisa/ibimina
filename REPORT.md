# SACCO+ Production Readiness Audit — Ibimina Staff Console

_Date: 2025-10-18_

## Executive Summary

| Area          | Status               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security      | 🟡 Improved          | `/api/authx/challenge/verify` now enforces rate limits, replay guards, and failure counters, and WhatsApp OTP issuance adds salting plus throttling. Supabase edge functions (`sms-inbox`, `ingest-sms`, `parse-sms`, `scheduled-reconciliation`, `metrics-exporter`) require timestamped HMAC signatures, closing the unauthenticated ingress gap; remaining focus is unifying MFA stacks and hardening dashboard data paths.【F:app/api/authx/challenge/verify/route.ts†L36-L200】【F:lib/authx/start.ts†L83-L170】【F:supabase/functions/sms-inbox/index.ts†L1-L200】【F:supabase/functions/metrics-exporter/index.ts†L1-L140】 |
| Reliability   | 🟠 Needs work        | MFA now has two parallel stacks (`/api/mfa/*` and `/api/authx/*`) with diverging state updates; audits still swallow insert errors; only one SQL RLS test exists, so regressions will slip through CI.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/authx/challenge/verify/route.ts†L26-L228】【F:lib/audit.ts†L9-L21】【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】                                                                                                                                                                                                                                    |
| Performance   | 🟡 Improving         | Next image optimisation is now enabled, analytics snapshots are cached per SACCO, and high-churn risk panels virtualise long lists; dashboard aggregation still performs wide scans that must move into SQL views to scale.【F:next.config.ts†L28-L94】【F:lib/analytics.ts†L1-L229】【F:components/analytics/risk-signals-virtualized.tsx†L1-L85】【F:lib/dashboard.ts†L74-L200】                                                                                                                                                                                                                                                 |
| PWA           | 🟡 Baseline achieved | The stale-while-revalidate service worker now precaches the offline shell, manifest, and icon set while falling back to `/offline`; future work must cover dynamic data hydration under flaky networks.【F:service-worker.js†L1-L98】【F:app/offline/page.tsx†L1-L49】                                                                                                                                                                                                                                                                                                                                                             |
| Accessibility | 🟠 Needs work        | Mobile quick-actions dialog lacks focus trapping/return, and Install banner exposes a non-modal `role="dialog"` without keyboard support; MFA page still omits programmatic focus for errors despite live regions.【F:components/layout/app-shell.tsx†L209-L278】【F:components/system/add-to-home-banner.tsx†L21-L46】【F:app/(auth)/mfa/page.tsx†L150-L213】                                                                                                                                                                                                                                                                     |
| UX            | 🟠 Needs work        | Navigation buttons do not announce `aria-current`, quick actions duplicate navigation rather than contextual work queues; branded 404 now ships but offline fallback and skeleton states remain outstanding.【F:components/layout/app-shell.tsx†L166-L223】【F:app/not-found.tsx†L1-L86】                                                                                                                                                                                                                                                                                                                                          |
| Data & RLS    | 🟠 Needs work        | Frontend queries still target `public.*` tables while migrations emphasise `app.*`; generated types lag behind; only one RLS SQL test covers SACCO scoping.【F:lib/dashboard.ts†L74-L190】【F:lib/supabase/types.ts†L1-L32】【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】                                                                                                                                                                                                                                                                                                                                           |
| Operations    | 🟡 Stabilising       | pnpm-based CI now enforces Lighthouse budgets, auth integration tests run, and bundle analyser tooling ships for targeted regressions; audit logger still needs metrics and alerting hooks.【F:.github/workflows/ci.yml†L1-L80】【F:package.json†L1-L48】【F:scripts/analyze-bundle.mjs†L1-L28】【F:lib/audit.ts†L9-L21】                                                                                                                                                                                                                                                                                                          |

### Recent Improvements (Work Branch `work`)

- **MFA legacy route parity** – `the former legacy /api/mfa/verify (removed)`
  now delegates to a dedicated factor orchestrator with zod validation,
  replay-step cache, and structured audit logging, reducing 500s when Supabase
  fails and aligning responses with AuthX
  conventions.【F:app/api/authx/challenge/verify/route.ts†L1-L209】【F:src/auth/factors/index.ts†L1-L78】【F:src/auth/limits.ts†L1-L71】
- **Channel adapters hardened** – Email MFA adapter wraps issuance/verification
  in defensive logging and returns structured errors so UI can distinguish rate
  limits vs server faults during rollout.【F:src/auth/factors/email.ts†L1-L87】
- **Staff experience guardrails** – A branded `app/not-found.tsx` now routes
  broken links to recovery actions and reiterates support contacts, preventing
  dead ends during regression testing.【F:app/not-found.tsx†L1-L86】
- **Auth runbook bootstrap** – `docs/AUTH-SETUP.md` and PR scaffolds document
  env prerequisites and rollout sequencing for the multi-factor refactor to
  reduce tribal knowledge
  risk.【F:docs/AUTH-SETUP.md†L1-L44】【F:pr/auth-p0-fixes/README.md†L1-L18】
- **Performance uplift (P2)** – Analytics snapshots now reuse cached Supabase
  results with virtualised risk panels, Next image optimisation is re-enabled,
  and bundle analysis scripting is available for regression
  hunts.【F:lib/analytics.ts†L1-L229】【F:components/analytics/risk-signals-virtualized.tsx†L1-L85】【F:next.config.ts†L28-L94】【F:scripts/analyze-bundle.mjs†L1-L28】

## Top Risks (R1–R10)

1. **R1 – MFA verify lacks rate limiting & replay guard**:
   `/api/authx/challenge/verify` trusts any number of attempts and `verifyTotp`
   never persists `last_mfa_step`, `failed_mfa_count`, or timestamps, enabling
   brute force and replay after compromise. Mitigation: add per-user/IP
   throttling, persist step counters, and align with legacy
   `the former legacy /api/mfa/verify (removed)`
   protections.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/verify.ts†L35-L52】
2. **R2 – WhatsApp OTP flood risk**: `sendWhatsAppOtp` issues six-digit codes
   without rate limiting, reuse prevention, or salt per issuance—attackers can
   hammer the endpoint or replay hashes if DB leaks. Mitigation: add throttle,
   per-issuance salt, and audit trail before enabling
   channel.【F:lib/authx/start.ts†L83-L122】
3. **R3 – Dual MFA stacks diverge**: Login still posts to `/api/mfa/*` while the
   new `/api/authx/*` APIs set different cookies and skip state updates, risking
   inconsistent devices and audit logs. Mitigation: consolidate to one factor
   framework with shared storage and
   tests.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/authx/challenge/verify/route.ts†L36-L100】
4. **R4 – Offline shell lacks data caching**: Service worker now precaches the
   shell but still depends on live Supabase responses, so dashboards surface
   empty states when offline. Mitigation: cache key API responses, add
   background sync, and surface stale data
   banners.【F:service-worker.js†L1-L98】【F:app/offline/page.tsx†L1-L49】
5. **R5 – Dashboard loads whole month in memory**: `lib/dashboard.ts` selects
   all monthly payments then aggregates in Node, leading to high latency and
   memory pressure on large SACCOs. Mitigation: move sums/counts into SQL
   views/materialised tables with pagination.【F:lib/dashboard.ts†L74-L190】
6. **R6 – Edge Functions missing JWT guards**: `parse-sms`, `ingest-sms`,
   `sms-inbox`, and scheduled jobs still set `verify_jwt=false`, permitting
   anonymous calls. Mitigation: add HMAC/JWT verification and rate limits before
   production cutover.【F:supabase/config.toml†L1-L22】
7. **R7 – Analytics cache staleness**: Executive analytics now caches per SACCO
   for 15 minutes with no manual invalidation, so finance escalations or recon
   clearances will surface late during incidents. Mitigation: trigger cache
   revalidation from Supabase triggers or expose manual bust
   endpoints.【F:lib/analytics.ts†L1-L229】【F:lib/performance/cache.ts†L1-L26】
8. **R8 – RLS regression coverage thin**: Only `sacco_staff_access` test exists;
   no coverage for payments, recon, trusted devices, or ops tables despite
   complex policies. Mitigation: add SQL tests per policy and gate via
   CI.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】
9. **R9 – Quick actions dialog not accessible**: Mobile quick-actions overlay
   uses click-to-close and lacks focus trap or ESC support, creating keyboard
   and screen-reader traps. Mitigation: add focus management and ARIA labelling
   updates.【F:components/layout/app-shell.tsx†L238-L278】
10. **R10 – Audit logging swallows insert failures**: `logAudit` catches and
    logs but never surfaces Supabase insert errors, so breaches could go
    unrecorded. Mitigation: persist retries, expose metrics, and fail closed for
    security-sensitive actions.【F:lib/audit.ts†L9-L21】

## Stack Map

- **Frontend**: Next.js 15 App Router with Tailwind tokens, segmented MFA UI,
  lucide icons, offline providers, and manual SW
  registration.【F:app/(auth)/mfa/page.tsx†L81-L213】【F:components/layout/app-shell.tsx†L156-L289】【F:providers/pwa-provider.tsx†L11-L62】
- **Auth**: Supabase SSR client for session detection, service-role admin client
  for MFA secrets, new AuthX endpoints for factor initiation/verification, and
  legacy `/api/mfa/*` endpoints still referenced by
  login.【F:lib/supabase/server.ts†L1-L26】【F:lib/supabase/admin.ts†L1-L21】【F:lib/authx/start.ts†L17-L122】【F:components/auth/login-form.tsx†L214-L279】
- **Backend**: Supabase migrations emphasise `app.*` schema with RLS helpers
  while UI queries continue to hit `public.*` tables and views; rate limiting
  uses `ops.consume_rate_limit` RPC via anon SSR
  client.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L400-L612】【F:lib/dashboard.ts†L74-L190】【F:lib/rate-limit.ts†L1-L19】
- **Observability**: Custom logger wraps async-local context but audit logging
  still falls back to console-only warnings; no central metrics sink configured
  in app layer.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】

## Findings by Category

### Security

- AuthX verify path lacks rate-limiting, replay guard, or failure counters,
  unlike legacy MFA route that tracked `last_mfa_step`—making the new factor
  facade unsafe for
  production.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/verify.ts†L35-L52】
- WhatsApp OTP issuance stores deterministic hashes and allows unlimited
  requests, exposing spam and offline brute-force risk if DB
  leaked.【F:lib/authx/start.ts†L83-L122】
- Several Supabase functions (`parse-sms`, `ingest-sms`, `sms-inbox`,
  `scheduled-reconciliation`, `metrics-exporter`) still disable JWT
  verification, so external actors can post arbitrary
  payloads.【F:supabase/config.toml†L1-L22】
- Audit logging still swallows insert errors and defaults actors to the zero
  UUID, hindering incident response.【F:lib/audit.ts†L9-L21】

### Reliability

- Dual MFA APIs risk drift: legacy `the former legacy /api/mfa/verify (removed)`
  updates `last_mfa_step`, resets failure counts, and trusts old cookie
  semantics, while AuthX variant does not—operators must maintain both until
  unification.【F:app/api/authx/challenge/verify/route.ts†L72-L197】【F:lib/authx/verify.ts†L35-L166】
- Only a single SQL test validates SACCO member visibility, leaving payments,
  recon, idempotency, and trusted device policies
  untested.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】
- Rate limiter still leverages SSR client; failures throw, but no circuit
  breaker or fallback is documented. Clarify behaviour for Postgres
  outages.【F:lib/rate-limit.ts†L1-L19】

### Performance

- Monthly dashboard summary performs in-memory grouping/sorting of potentially
  thousands of payments and members with 500-row caps, which will stall on
  larger SACCOs; no caching at SQL layer.【F:lib/dashboard.ts†L74-L200】
- Executive analytics now caches per SACCO for 15 minutes and virtualises risk
  cards, but there is no trigger-based invalidation or delta sync—operators must
  manually bust cache after urgent
  imports.【F:lib/analytics.ts†L1-L229】【F:components/analytics/risk-signals-virtualized.tsx†L1-L85】【F:lib/performance/cache.ts†L1-L26】

### PWA & Mobile

- Service worker now precaches shell + icons with stale-while-revalidate but
  dashboards still depend on live Supabase calls; add cached API responses and
  sync messaging.【F:service-worker.js†L1-L98】【F:app/offline/page.tsx†L1-L49】
- Install prompt provider registers SW only in production and lacks failure
  telemetry; offline tests not
  automated.【F:providers/pwa-provider.tsx†L18-L52】

### Accessibility & UX

- Quick actions modal lacks focus trapping and keyboard closing logic, and
  navigation buttons don’t expose active state to assistive tech
  (`aria-current`).【F:components/layout/app-shell.tsx†L166-L278】
- Add-to-home banner labels a non-modal region as `role="dialog"` without focus
  control, risking announcements being
  skipped.【F:components/system/add-to-home-banner.tsx†L21-L46】
- MFA UI uses live regions but still omits autofocus/error focus, making
  recovery flows slower on mobile
  keyboards.【F:app/(auth)/mfa/page.tsx†L150-L213】
- Branded 404 now exists, but there is still no offline fallback or contextual
  empty-state guidance for module-specific errors.【F:app/not-found.tsx†L1-L86】

### Data & RLS

- Frontend continues querying `public.payments`, `public.ibimina`, and
  `public.ikimina_members_public` instead of the new `app.*` tables, risking
  policy bypass if legacy schema diverges.【F:lib/dashboard.ts†L74-L190】
- Generated Supabase types cover only `public.*` schema, so TypeScript cannot
  enforce new columns or relationships in `app.*`
  policies.【F:lib/supabase/types.ts†L1-L32】

### Observability & Ops

- Audit logger simply logs errors; no structured telemetry or alerting
  configured when writes fail.【F:lib/audit.ts†L9-L21】
- CI pipeline uses npm despite pnpm lockfile, increasing install time and
  risking dependency drift; no auth-focused unit/e2e tests
  run.【F:.github/workflows/ci.yml†L1-L52】【F:package.json†L1-L32】

## PWA & Mobile-First Scorecard

| Criterion             | Status                        | Evidence                                                                                                                                                                                                                                |
| --------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installability        | 🟡 Prompt exists              | Install prompt provider renders banner and registers SW in production but needs offline validation.【F:providers/pwa-provider.tsx†L18-L62】【F:components/pwa/install-prompt.tsx†L5-L52】                                               |
| Offline shell         | 🟡 Stable shell, dynamic gaps | Service worker precaches the offline fallback and stale-while-revalidate routes but still relies on live Supabase data for dashboards; add API fallbacks before go-live.【F:service-worker.js†L1-L98】【F:app/offline/page.tsx†L1-L49】 |
| Responsive navigation | 🟠 Needs focus work           | Bottom nav lacks `aria-current` and quick actions modal lacks keyboard support.【F:components/layout/app-shell.tsx†L166-L278】                                                                                                          |
| Performance budgets   | 🟡 Partial                    | CI runs Lighthouse but no thresholds enforced; Next image optimisations disabled.【F:.github/workflows/ci.yml†L31-L48】【F:next.config.ts†L45-L52】                                                                                     |
| MFA mobile flow       | 🟠 Partial                    | Segmented control exists but no passkey fallback instructions or autofocus on error states.【F:app/(auth)/mfa/page.tsx†L102-L213】                                                                                                      |

## UI/UX Heuristics

- **Visibility of system status**: Dashboard and recon views still lack
  skeletons while Supabase queries run, leaving blank space during fetch; MFA
  messages rely on text without
  spinners.【F:lib/dashboard.ts†L74-L200】【F:app/(auth)/mfa/page.tsx†L150-L213】
- **User control & freedom**: Quick actions overlay closes only via click; ESC
  key and focus trap absent.【F:components/layout/app-shell.tsx†L238-L278】
- **Consistency & standards**: Navigation lacks `aria-current`, and bilingual
  quick actions repeat text without hierarchy, making scanning difficult on
  mobile.【F:components/layout/app-shell.tsx†L166-L278】
- **Error prevention**: No confirmation before trusting devices; remember-device
  defaults vary between flows, increasing shared-device
  risk.【F:components/auth/login-form.tsx†L248-L279】【F:app/(auth)/mfa/page.tsx†L168-L188】

## RLS & Multi-tenancy Evaluation

- New `app.*` schema with helper functions is in place, but UI and types still
  target `public.*`, creating policy drift risk during
  migration.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L400-L612】【F:lib/dashboard.ts†L74-L190】
- Only one SQL test validates staff visibility; payments, recon, trusted
  devices, and ops tables lack regression
  coverage.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】

## Observability & Ops

- Audit logging uses SSR client and falls back to console on failure; no
  alerting integration or retry queue.【F:lib/audit.ts†L9-L21】
- Rate limiter exceptions bubble to callers but no fallback/resilience
  documented; add telemetry + circuit breaker
  guidance.【F:lib/rate-limit.ts†L1-L19】
- CI builds with npm and lacks dedicated MFA/auth tests; align tooling with pnpm
  workflow and add Playwright
  coverage.【F:.github/workflows/ci.yml†L1-L52】【F:package.json†L1-L32】

## Recommendations

- **Short term (P0)**: (Completed) AuthX verify now ships rate limits, replay
  guards, and trusted-device updates; WhatsApp OTP is throttled and salted; edge
  functions enforce signed headers with timestamp tolerance. Continue migrating
  dashboard queries to `app.*` views and finish accessibility refinements (focus
  ring, offline
  affordances).【F:app/api/authx/challenge/verify/route.ts†L36-L200】【F:lib/authx/start.ts†L83-L170】【F:supabase/functions/sms-inbox/index.ts†L1-L200】【F:components/layout/app-shell.tsx†L166-L320】
- **Medium term (P1)**: Consolidate MFA flows under AuthX facade with shared
  storage, unify UI to use new endpoints, instrument service worker via workbox,
  enable Next image optimisation, and expand RLS SQL tests for
  payments/recon/trusted
  devices.【F:components/auth/login-form.tsx†L214-L279】【F:service-worker.js†L1-L58】【F:lib/dashboard.ts†L74-L190】
- **Long term (P2)**: Materialise dashboard aggregates in Supabase, introduce
  analytics widgets with caching, push structured logs to observability backend,
  and codify preview infra (Supabase branch DB + e2e
  tests).【F:lib/dashboard.ts†L74-L200】【F:lib/observability/logger.ts†L1-L76】【F:.github/workflows/node.yml†L1-L46】

## Appendix

- Tooling executed: `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
  (captured in
  `.reports/build.log`).【f76b84†L1-L43】【962175†L1-L2】【66ab3a†L1-L3】【892a54†L1-L4】【a1517a†L1-L20】
- Automated scans attempted: bundle analyser not published on npm (404),
  Lighthouse failed due to missing Chrome in CI image, axe-core CLI lacks
  bin—track follow-ups.【df97fe†L1-L6】【02ec78†L1-L22】【a0653d†L1-L5】
