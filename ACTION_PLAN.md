# SACCO+ Implementation Plan

## Phase P0 – Hardening (Week 0–2)

| Workstream                | Tasks                                                                                                                                                                                                                                                                                                                                                                                                             | Owner      | Acceptance Tests                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| AuthX verification parity | Add per-user/IP throttling and replay guard to `/api/authx/challenge/verify`; persist `last_mfa_step`, `failed_mfa_count`, and success timestamps to match the former `the former legacy /api/mfa/verify (removed)` semantics (legacy route now retired); emit structured error codes and audit rows for success/failure.【F:app/api/authx/challenge/verify/route.ts†L36-L100】【F:lib/authx/verify.ts†L35-L166】 | Auth squad | Playwright: wrong TOTP → 401 with `INVALID_CODE`; replay of recent step → 409; success updates cookies and Supabase fields. |
| Factor facade adoption    | Route AuthX verify/initiate endpoints through `src/auth/factors` so both stacks share adapters, replay guard, and audit semantics; delete duplicate helpers once parity confirmed.【F:src/auth/factors/index.ts†L1-L78】【F:src/auth/factors/email.ts†L1-L87】【F:app/api/authx/challenge/verify/route.ts†L36-L100】                                                                                              | Auth squad | AuthX POST uses facade responses; removing legacy helpers leaves Playwright suite green.                                    |
| OTP channel safeguards    | Enforce issuance throttling and salted hashes for WhatsApp/email OTP, reusing `issueEmailOtp` rate limits; add audit trail and structured errors before enabling channel.【F:lib/authx/start.ts†L17-L122】                                                                                                                                                                                                        | Platform   | Unit tests for OTP store verifying rate limit + salt; audit rows appear in Supabase.                                        |
| Edge ingress controls     | ✅ Timestamped HMAC guards now protect `parse-sms`, `ingest-sms`, `sms-inbox`, `scheduled-reconciliation`, and `metrics-exporter`, logging rejected signatures and replay attempts.【F:supabase/functions/\_shared/auth.ts†L1-L80】【F:supabase/functions/sms-inbox/index.ts†L1-L200】【F:supabase/functions/metrics-exporter/index.ts†L1-L140】                                                                  | Platform   | Supabase function tests: unauthenticated calls → 401; signed requests succeed.                                              |
| Accessibility fixes       | Add `aria-current` to nav, focus trap/ESC handling for quick actions dialog, and keyboard handlers for install banner; ensure remember-device copy consistent across flows.【F:components/layout/app-shell.tsx†L166-L278】【F:components/system/add-to-home-banner.tsx†L21-L46】【F:app/(auth)/mfa/page.tsx†L168-L206】                                                                                           | UX eng     | axe-core clean on dashboard/MFA; keyboard-only walkthrough passes.                                                          |
| 404 & fallback UX         | Branded `app/not-found.tsx` shipped; add offline fallback shell and dashboard skeleton loaders to avoid blank states during Supabase fetches.【F:app/not-found.tsx†L1-L86】【F:lib/dashboard.ts†L74-L200】                                                                                                                                                                                                        | FE lead    | Visiting `/invalid` shows branded 404; dashboard shows skeleton during load.                                                |
| RLS smoke tests           | Expand Supabase SQL tests to cover payments, recon exceptions, trusted devices, and ops tables using existing fixture harness.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】                                                                                                                                                                                                                        | Data eng   | `pnpm test:rls` covers new scripts; failing policy blocks CI.                                                               |

## Phase P1 – PWA & UX (Week 3–6)

| Workstream              | Tasks                                                                                                                                                                                                                                                                                                                                                       | Owner     | Acceptance Tests                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| Service worker overhaul | Replace manual SW with workbox `StaleWhileRevalidate` precaching `_next` assets and dynamic caching for authenticated routes; add offline fallback view and versioning.【F:service-worker.js†L1-L58】                                                                                                                                                       | FE lead   | Lighthouse PWA ≥ 90 on CI; offline DevTools audit passes for `/dashboard`, `/ikimina`, `/profile`.                  |
| MFA UI unification      | Switch login form to AuthX APIs, add passkey/totp fallback guidance, autofocus errors, and trust-device copy parity.【F:components/auth/login-form.tsx†L214-L279】【F:app/(auth)/mfa/page.tsx†L81-L213】                                                                                                                                                    | Auth + UX | Playwright: credentials→AuthX challenge success; trust device prompts match copy.                                   |
| Navigation & IA polish  | Introduce contextual quick actions (tasks vs navigation), add state badges, and integrate global search results grouping with keyboard support.【F:components/layout/app-shell.tsx†L238-L278】【F:components/layout/global-search-dialog.tsx†L1-L140】                                                                                                      | UX eng    | Keyboard + screen-reader reviews approve; analytics tracks quick-action usage.                                      |
| CI alignment            | Convert workflows to pnpm, add auth integration tests, persist Lighthouse budgets as failure gates, upload artefacts for audits, and expose a one-shot readiness command (`pnpm run check:deploy` / `make ready`) documented in the deployment checklist.【F:.github/workflows/ci.yml†L1-L52】【F:package.json†L1-L35】【F:DEPLOYMENT_CHECKLIST.md†L1-L40】 | DevOps    | CI runs pnpm install, fails when Lighthouse < 90 or MFA tests fail; local readiness command mirrors the same gates. |

## Phase P2 – Performance & Observability (Week 7–12)

_Status: Security, UX, and logging milestones from P0–P3 are complete; remaining
focus is Supabase materialisation, analytics cache invalidation, expanded RLS
coverage, log-drain alerting, and MFA automation._ | Workstream | Tasks | Owner
| Acceptance Tests | | --- | --- | --- | --- | | Dashboard SQL materialisation |
🚧 Create Supabase views/materialised tables for monthly totals, top ikimina,
and overdue contributors; swap frontend queries to `app.*` views; regenerate
Supabase
types.【F:lib/dashboard.ts†L74-L190】【F:lib/supabase/types.ts†L1-L32】 | Data
eng | Summary API returns <150 ms p95; TypeScript types reference new views
without `any`. | | Image & asset optimisation | ✅ Enabled Next image
optimisation, expanded remote patterns, added virtualised risk panels, and
delivered bundle analysis script; still need to tune SACCO logo storage and
dashboard skeleton
loaders.【F:next.config.ts†L28-L94】【F:components/analytics/risk-signals-virtualized.tsx†L1-L85】【F:scripts/analyze-bundle.mjs†L1-L28】 |
FE lead | WebPageTest <1.5 MB first load on mid-tier mobile; layout shift
minimal. | | Observability uplift | 🚧 Log drain forwarding, runbooks, and CI
bundle gates are in place; remaining scope is alert wiring and gating on audit
writer
health.【F:lib/observability/logger.ts†L16-L125】【F:.github/workflows/ci.yml†L1-L120】【F:lib/audit.ts†L1-L21】 |
SRE | Alerts fire during chaos drill; docs include runbook and dashboards. | |
Preview infrastructure | ✅ Wire Supabase branch DB + seed script to preview
workflow, run auth-focused e2e tests against preview
URL.【F:.github/workflows/node.yml†L1-L46】【F:scripts/test-rls-docker.sh†L1-L19】 |
DevOps | PR comment shows preview host + Supabase URLs; Playwright suite passes
on preview. |

## Timeline & Dependencies

- **Week 0**: Kick-off, align security + platform teams on AuthX parity, confirm
  secrets (KMS key, BACKUP_PEPPER, trust cookie secret) and Twilio
  providers.【F:.env.example†L1-L32】
- **Week 1–2**: Deliver P0 hardening fixes, expanded RLS tests, and
  accessibility updates; rerun CI + manual regression on MFA flows.
- **Week 3–6**: Roll out SW/UX polish, unify MFA flows, migrate CI to pnpm with
  Lighthouse budgets; run mobile QA sessions.
- **Week 7–10**: Execute SQL materialisation, image optimisation, and
  observability uplift; validate dashboards on production-sized data.
- **Week 11–12**: Final preview automation, chaos drills, and go-live rehearsal
  with support runbooks.

## Risks & Mitigations

- **Auth regression risk**: Unifying two MFA stacks can cause downtime—introduce
  feature flag toggling between legacy and AuthX endpoints during
  rollout.【F:components/auth/login-form.tsx†L214-L279】
- **Edge function tightening**: Telecom partners must update signatures before
  JWT/HMAC enforcement; coordinate change window and provide sandbox
  endpoints.【F:supabase/config.toml†L1-L22】
- **Workbox complexity**: Introduce integration tests that purge caches on
  deploy to avoid stale UI and document SW update flow in QA
  checklist.【F:service-worker.js†L1-L58】

## Acceptance Summary

- CI: pnpm lint/type/test/build + Lighthouse budgets + Playwright MFA suite all
  green on every PR.【F:.github/workflows/ci.yml†L1-L52】
- Security: AuthX route matches legacy protections, WhatsApp/email OTP
  throttled, Supabase functions require authentication, and audit logs emit
  structured
  entries.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/start.ts†L83-L122】【F:supabase/config.toml†L1-L22】【F:lib/audit.ts†L9-L21】
- UX: Mobile nav accessible, quick actions contextual, install banner
  keyboard-friendly, skeletons/offline fallback implemented alongside
  branded 404.【F:components/layout/app-shell.tsx†L166-L278】【F:components/system/add-to-home-banner.tsx†L21-L46】【F:app/not-found.tsx†L1-L86】
- Data: Dashboard queries use `app.*` views with regenerated types and
  comprehensive RLS
  tests.【F:lib/dashboard.ts†L74-L190】【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】
