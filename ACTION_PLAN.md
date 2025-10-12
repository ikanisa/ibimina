# SACCO+ Implementation Plan

## Phase P0 – Hardening (Week 0–2)
| Workstream | Tasks | Owner | Acceptance Tests |
| --- | --- | --- | --- |
| Security headers | Implement `src/lib/security/headers.ts` nonce helper; wire `headers()` in `next.config.ts`/middleware to emit CSP, XFO deny, Referrer-Policy, HSTS.| FE Lead | Automated header smoke via `scripts/verify-pwa.mjs`; manual curl validates CSP & frame-block. | 
| MFA API resilience | Refactor `app/api/mfa/verify/route.ts` to return structured 4xx, add replay guard on TOTP step, persist failures via queue, and ensure audit logging uses service-role function instead of anon client.【F:app/api/mfa/verify/route.ts†L26-L228】【F:lib/audit.ts†L1-L24】 | Auth Squad | Playwright smoke: invalid code => 401 JSON, reused code => 409, success sets cookies. |
| Schema alignment | Migrate UI to `app.*` schema (`lib/dashboard.ts` queries, Supabase types regeneration) and delete legacy `public.*` tables/policies after tests.【F:lib/dashboard.ts†L73-L189】【F:supabase/migrations/20251007111647_0ad74d87-9b06-4a13-b252-8ecd3533e366.sql†L24-L188】 | Data Eng | `pnpm typecheck` passes with regenerated types; RLS integration tests prove sacco scoping. |
| RLS tests | Add Supabase SQL test suite covering sacco scoping for payments/members, rate-limit RPC, trusted devices, using branch DB seeded fixtures.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】 | Data Eng | GitHub Action job runs `supabase db test` with >90% policy coverage. |
| CI upgrade | Extend `.github/workflows/ci.yml` with Lighthouse, artifact upload, and caching; fail build if budgets drop below 90/90/90.【F:.github/workflows/ci.yml†L1-L32】 | DevOps | CI green with Lighthouse JSON artifact uploaded for PR. |
| Edge ingress | Require JWT or HMAC for `parse-sms`, `ingest-sms`, `sms-inbox`; add observability logs to Supabase functions config.【F:supabase/config.toml†L3-L46】 | Platform | Postman tests return 401 without secret; metrics exported to Grafana dashboard. |

## Phase P1 – PWA & UX (Week 3–6)
| Workstream | Tasks | Owner | Acceptance Tests |
| --- | --- | --- | --- |
| MFA UX overhaul | Replace select/input combo with segmented factor chooser, add accessible modal for passkeys, trust-device education copy, and live region for errors.【F:app/(auth)/mfa/page.tsx†L150-L213】 | Design + Auth | Mobile Safari/Chrome manual tests pass; axe-core report clean. |
| Install prompt & SW | Swap custom SW for workbox `staleWhileRevalidate`, precache `_next` assets, support offline `/ikimina` flows, show install toast via `src/components/pwa/InstallPrompt.tsx`.【F:service-worker.js†L1-L58】 | FE Lead | Lighthouse PWA ≥ 90 on CI; offline test via devtools passes. |
| Navigation & skeletons | Add `aria-current` to nav, focus trap for quick actions, skeleton states for dashboard tables and recon modules.【F:components/layout/app-shell.tsx†L158-L239】【F:lib/dashboard.ts†L73-L200】 | UX Engineering | Axe + manual keyboard tests succeed; skeleton renders within 150ms. |
| Table virtualisation | Integrate TanStack virtual tables for ikimina/member lists, infinite scroll with optimistic status chips. | UX Engineering | Scroll tests show <16ms frame budget, memory stable on 5k rows. |
| Preview workflow | Introduce `.github/workflows/preview.yml` to deploy PR to Vercel with Supabase branch DB seeding migrations; report URLs in PR comment. | DevOps | Preview auto-comments on PR with Vercel + Supabase links. |

## Phase P2 – Performance & Ops (Week 7–12)
| Workstream | Tasks | Owner | Acceptance Tests |
| --- | --- | --- | --- |
| SQL materialisation | Create Supabase views/materialised views for dashboard KPIs, monthly aggregates, recon stats, replacing client loops.【F:lib/dashboard.ts†L73-L200】 | Data Eng | `SELECT` latency <150ms; metrics exported to Prometheus. |
| Edge workflows | Implement idempotent Edge Functions for payments/apply, sms-inbox, recon exceptions with `ops.idempotency` table guards.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L245-L279】 | Platform | Replay test returns 409; audit log contains structured diff. |
| Observability | Ship structured logs to Supabase Logflare/Splunk, instrument rate-limit & MFA events with metrics, integrate runbooks into `docs/operations`.【F:lib/rate-limit.ts†L1-L19】【F:docs/go-live-checklist.md†L95-L137】 | SRE | Alert playbooks reviewed; dashboard alarms triggered in chaos test. |
| Analytics & admin UX | Add dashboard widgets (trendlines, risk alerts) and admin policy editor UI; integrate toasts with live regions. | Product | Stakeholder sign-off on analytics spec; toasts pass screen reader QA. |
| Internationalisation polish | Finalise Kinyarwanda/French parity using `scripts/check-i18n.mjs`; add glossary enforcement to CI budgets. | Localization | `pnpm check:i18n` + `check:i18n:consistency` pass in CI. |

## Timeline & Dependencies
- **Week 0**: Kick-off, lock infra secrets, branch off `pr/p0-hardening`.
- **Week 1–2**: Deliver P0 code + tests, run Supabase branch smoke, merge after Lighthouse gate passes.
- **Week 3**: Begin MFA UX + SW refactor, coordinate design QA.
- **Week 4–6**: Ship P1 features, ensure preview workflow stable before main merges.
- **Week 7–10**: Move heavy analytics and SQL materialisation, expand observability.
- **Week 11–12**: Ops runbooks, chaos drills, go-live rehearsal.

## Risks & Mitigations
- **Supabase drift**: Regenerate types before each merge; add lint rule blocking `as any` casts in data layer.【F:lib/supabase/types.ts†L9-L139】
- **Lighthouse flakiness**: Use fixed throttling config, run twice and keep best score; allow rerun on failure.
- **Edge auth tightening**: Coordinate with telecom ingest partners before enabling JWT enforcement; provide fallback signed webhook route.【F:supabase/config.toml†L3-L46】

## Acceptance Summary
- CI: lint/type/build/i18n + Lighthouse ≥90/90/90 + artifact upload.【F:.github/workflows/ci.yml†L1-L32】
- Security: CSP, frame deny, referrer strict-origin, MFA handler returns 401/429 for invalid attempts, audit logs persisted with retries.【F:app/api/mfa/verify/route.ts†L52-L168】
- Data: Single canonical schema, regenerated types, automated RLS tests covering SACCO scoping.【F:supabase/migrations/20251012120000_sacco_plus_schema.sql†L199-L279】
- UX: Mobile MFA flow accessible, nav indicates active route, offline works for dashboard/recon/profile.【F:app/(auth)/mfa/page.tsx†L150-L213】【F:service-worker.js†L1-L58】
