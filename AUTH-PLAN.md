# SACCO+ Authentication Remediation Plan

## Current Coverage Snapshot (Work Branch `work`)
- Legacy `/api/mfa/verify` now executes through `src/auth/factors` with replay-step caching, structured responses, and trusted-device persistence, giving us a hardened baseline to mirror in AuthX.【F:app/api/mfa/verify/route.ts†L26-L209】【F:src/auth/factors/totp.ts†L1-L66】
- Email MFA adapter guards issuance and verification errors with audit logging and status codes, but AuthX still bypasses it—migrating to the shared facade remains in scope for P0.【F:src/auth/factors/email.ts†L1-L87】【F:app/api/authx/challenge/verify/route.ts†L49-L96】
- Trusted device cookies remain consistent across flows, yet AuthX omits the DB upsert/hash; plan below schedules parity before enabling new UI by default.【F:app/api/mfa/verify/route.ts†L168-L206】【F:lib/authx/verify.ts†L109-L166】

## P0 – Immediate Hardening (Week 0–1)
| Task | Owner | Acceptance |
| --- | --- | --- |
| Implement rate limiting + replay guard for `/api/authx/challenge/verify`; persist `last_mfa_step`, `failed_mfa_count`, `last_mfa_success_at`; log audits for success/failure with structured codes.【F:app/api/authx/challenge/verify/route.ts†L36-L100】【F:lib/authx/verify.ts†L35-L166】 | Auth squad | Playwright verifies: invalid TOTP → 401 JSON; replay → 409; success updates Supabase fields. |
| Align trusted device handling by moving DB upsert + cookie issuance into shared helper; ensure AuthX path writes hashed fingerprint and refreshes tokens like legacy route.【F:lib/authx/verify.ts†L109-L166】【F:app/api/mfa/verify/route.ts†L172-L206】 | Auth squad | Database shows trusted device row with hashed fingerprint after AuthX verify; `/api/mfa/status` recognises device. |
| Disable WhatsApp factor in UI until throttling/salting done; display notice for admins.【F:app/(auth)/mfa/page.tsx†L81-L148】 | UX + Auth | MFA page hides WhatsApp option or marks as coming soon; QA confirms. |
| Require JWT/HMAC for `parse-sms`, `ingest-sms`, `sms-inbox`, admin reset; add audit logs per invocation.【F:supabase/config.toml†L1-L22】【F:app/api/admin/mfa/reset/route.ts†L1-L64】 | Platform | Unauthenticated function call returns 401; audit table records signed invocations. |

## P1 – Flow Unification & Testing (Week 2–4)
| Task | Owner | Acceptance |
| --- | --- | --- |
| Refactor login form to use AuthX endpoints for factor initiation/verify; delete legacy `/api/mfa/verify` after parity suite passes.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/mfa/verify/route.ts†L52-L205】 | Auth squad | Playwright path: credentials → AuthX challenge → success; legacy endpoints removed with no regressions. |
| Build OTP issuance throttling for WhatsApp (reuse email table), salt hashes per issuance, and add resend countdown UI.【F:lib/authx/start.ts†L83-L122】【F:app/(auth)/mfa/page.tsx†L150-L213】 | Platform + UX | Rate limit returns 429 with retryAt; UI shows countdown; DB stores salted hash. |
| Create unit tests for crypto helpers (AES-GCM, backup codes), OTP verification, and rate limiter; integrate into CI.【F:lib/mfa/crypto.ts†L1-L123】【F:lib/mfa/email.ts†L68-L200】【F:lib/rate-limit.ts†L1-L19】 | QA | `pnpm test` covers new suites; CI fails on regression. |
| Add Playwright scenarios: TOTP fail/success, email OTP, backup code, trusted device enrolment & reuse; run against preview deployments.【F:app/(auth)/mfa/page.tsx†L81-L213】【F:app/api/mfa/status/route.ts†L64-L120】 | QA | CI Playwright job green; manual rerun replicates. |

## P2 – Enhancements (Week 5–8)
| Task | Owner | Acceptance |
| --- | --- | --- |
| Extend passkey flows with trusted device heuristics, friendly names management, and UI for revoking credentials.【F:lib/mfa/passkeys.ts†L200-L296】 | Auth squad | Passkey login can opt into trust; profile lists passkey devices with revoke button. |
| Build MFA management UI (profile settings) to show factors, regenerate backup codes, and manage trusted devices; consume new audit data.【F:lib/authx/factors.ts†L19-L52】【F:lib/authx/backup.ts†L4-L39】 | UX + Auth | Profile page lists factors, supports backup regeneration and device revoke; audits logged. |
| Instrument structured logs/metrics for MFA attempts (success, failure, rate-limit) using existing logger; ship to monitoring backend.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】 | Platform | Observability dashboards show MFA attempt counts; alerts configured for spikes. |

## P3 – Documentation & Operations (Week 9–10)
| Task | Owner | Acceptance |
| --- | --- | --- |
| Publish `docs/AUTH-SETUP.md` covering env variables, enrollment, recovery, troubleshooting, and incident runbook; include Supabase branch DB setup for previews.【F:.env.example†L1-L32】【F:scripts/test-rls.sh†L1-L16】 | DevRel | Doc reviewed by security + ops; link added to README. |
| Update go-live checklist with MFA regression tests, WhatsApp readiness, and edge function guardrails; add to operations playbook.【F:REPORT-AUTH.md†L88-L123】 | Platform | Checklist stored in runbook; sign-off recorded before prod deploy. |

## Dependencies & Risks
- Need KMS data key, peppers, trusted cookie secret set in all environments before enabling new flow.【F:.env.example†L1-L32】
- Twilio credentials or Meta WABA integration must be validated before re-enabling WhatsApp factor.【F:lib/authx/start.ts†L53-L80】
- Supabase migrations should include additional RLS tests for MFA-related tables to prevent regressions.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】
