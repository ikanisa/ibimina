# SACCO+ Authentication & MFA Audit

_Date: 2025-10-18_

## Executive Summary
| Dimension | Status | Notes |
| --- | --- | --- |
| Factor coverage | 🟠 Partial | Factors (passkey, TOTP, email, WhatsApp, backup) surface in AuthX UI, but WhatsApp is unsafe to ship without throttling/salting, and backup/TOTP replay guard missing in new API.【F:app/(auth)/mfa/page.tsx†L81-L213】【F:lib/authx/start.ts†L83-L122】【F:lib/authx/verify.ts†L35-L52】 |
| API hygiene | 🔴 High risk | `/api/authx/challenge/verify` lacks rate limiting and state persistence; login still posts to `/api/mfa/verify`, creating divergent logic and cookie issuance paths.【F:app/api/authx/challenge/verify/route.ts†L36-L100】【F:components/auth/login-form.tsx†L214-L279】 |
| Secrets & storage | 🟡 Acceptable | TOTP secrets encrypted with AES-GCM (KMS key), backup codes peppered; however new flow no longer updates `users.last_mfa_step`/`failed_mfa_count`, undermining brute-force defence.【F:lib/mfa/crypto.ts†L1-L103】【F:lib/authx/verify.ts†L35-L52】 |
| Trusted devices | 🟠 Needs work | Legacy route writes `trusted_devices` rows and refreshes cookies; AuthX path only sets cookies, leaving DB state stale and bypassing IP/user-agent checks.【F:app/api/mfa/verify/route.ts†L172-L206】【F:lib/authx/verify.ts†L109-L166】 |
| Observability & tests | 🔴 Missing | No automated MFA unit/e2e tests, audit logging swallows failures, and rate limit RPC lacks telemetry or circuit breakers.【F:lib/audit.ts†L9-L21】【F:lib/rate-limit.ts†L1-L19】 |

### Implementation Snapshot (Work Branch `work`)
- **Factor facade live on legacy path** – `/api/mfa/verify` now funnels tokens through `src/auth/factors`, layering replay caches, audit metadata, and typed success/failure payloads so new UI can reuse responses without schema drift.【F:app/api/mfa/verify/route.ts†L26-L209】【F:src/auth/factors/index.ts†L1-L78】【F:src/auth/factors/totp.ts†L1-L66】
- **Channel resilience uplift** – Email factor adapter now emits structured audits for rate limits vs transport faults and avoids cascading crashes when SMTP/Supabase fail, but AuthX verify handler still bypasses it; follow-up requires routing AuthX through the same facade.【F:src/auth/factors/email.ts†L1-L87】【F:app/api/authx/challenge/verify/route.ts†L49-L96】
- **Replay guard & trusted devices** – Legacy verify persists failure counters, writes trusted device hashes, and signs cookies via new helpers, yet AuthX verify skips those updates; parity remains a P0 risk until flow unification lands.【F:app/api/mfa/verify/route.ts†L74-L205】【F:src/auth/limits.ts†L39-L71】【F:lib/authx/verify.ts†L109-L166】

## Key Findings
1. **AuthX verify fail-open** – New verification route does not throttle attempts, fails to persist `last_mfa_step`/`failed_mfa_count`, and always returns `{ok}` on success without updating Supabase state, enabling brute-force and replay attacks.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/verify.ts†L35-L52】
2. **Dual MFA stacks** – Login form still posts to legacy `/api/mfa/verify`, so cookies/trusted-device creation diverge. Without unification, staff may satisfy one flow but not the other, breaking session enforcement.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/mfa/verify/route.ts†L72-L209】
3. **WhatsApp OTP unsafe** – `sendWhatsAppOtp` hashes `BACKUP_PEPPER+code` (no salt) and lacks issuance limits, allowing spamming and offline brute force if DB leaked. UI exposes factor but backend not production-ready.【F:lib/authx/start.ts†L83-L122】
4. **Trusted device mismatch** – Legacy verify writes `trusted_devices` rows based on hashed user-agent/IP; AuthX verify only sets cookie tokens, leaving DB entries outdated and reducing device revocation efficacy.【F:app/api/mfa/verify/route.ts†L172-L206】【F:lib/authx/verify.ts†L109-L166】
5. **Edge reset & admin flows** – Admin reset route still uses legacy path; AuthX audit logging inserts to `authx.audit` but not centralised; ensure resets, diagnostics, and admin flows align with new API.【F:app/api/admin/mfa/reset/route.ts†L1-L64】【F:lib/authx/audit.ts†L1-L14】

## Flow Analysis
### Sign-in
- Credentials submitted via Supabase browser client. On success, client fetches `/api/mfa/status` which checks `MFA_SESSION_COOKIE` and `TRUSTED_DEVICE_COOKIE`, using hashed user-agent/IP to validate trusted device entries.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/mfa/status/route.ts†L18-L104】
- If MFA required and WhatsApp factor available, legacy flow redirects to `/mfa`. Otherwise, login form stays inline and uses legacy `/api/mfa/verify` endpoint for code submission.【F:components/auth/login-form.tsx†L214-L279】

### AuthX MFA page
- Client fetches `/api/authx/factors/list` to detect enrolled factors (passkey/TOTP/email/WhatsApp/backup). Factor data derived from service-role Supabase queries against `public.users`, `authx.user_mfa`, and credential counts.【F:app/(auth)/mfa/page.tsx†L81-L148】【F:lib/authx/factors.ts†L19-L52】
- Initiation: `/api/authx/challenge/initiate` issues passkey options, sends email via existing OTP service, sends WhatsApp code (unsafe), or simply signals TOTP readiness.【F:app/api/authx/challenge/initiate/route.ts†L1-L47】【F:lib/authx/start.ts†L17-L122】
- Verification: `/api/authx/challenge/verify` validates payload but omits rate limiting, failure tracking, and trusted-device DB writes. It calls `issueSessionCookies` to set cookies directly from route handler.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/verify.ts†L109-L166】

### Legacy MFA route
- `/api/mfa/verify` enforces rate limit via RPC, decrypts TOTP secret, compares steps, updates `last_mfa_step` and `failed_mfa_count`, persists backup code usage, writes audit logs, and creates trusted device row before setting cookies.【F:app/api/mfa/verify/route.ts†L52-L205】

### Enrollment & recovery
- `/api/mfa/enroll` handles TOTP setup with AES-encrypted pending token; `/api/mfa/confirm` enables MFA, resets counters, and clears pending tokens.【F:app/api/mfa/enroll/route.ts†L40-L132】【F:app/api/mfa/confirm/route.ts†L30-L78】
- Backup codes consumed via admin client; hashed with pepper+salt using PBKDF2 and stored in `users.mfa_backup_hashes`. Legacy route updates array; AuthX path only removes hash and returns boolean.【F:lib/mfa/crypto.ts†L79-L123】【F:lib/authx/backup.ts†L4-L39】

## Observability & Testing
- Audit logging writes to `audit_logs` using SSR client; on failure logs error but does not retry or raise alarms.【F:lib/audit.ts†L9-L21】
- No unit or e2e tests cover AuthX flows; `scripts/test-rls.sh` runs only SQL policy tests. Playwright suite absent.【F:scripts/test-rls.sh†L1-L16】
- Rate limit RPC logs error and throws but lacks metrics to distinguish throttled vs fail-open cases; add telemetry and circuit breakers.【F:lib/rate-limit.ts†L1-L19】

## Recommendations
### P0 (Immediate)
1. **Parity hardening**: Add rate limiting, replay guard (step tracking), and failure counters to `/api/authx/challenge/verify`; ensure success updates `users.last_mfa_step`, `failed_mfa_count`, `last_mfa_success_at`, and trusted device table before issuing cookies.【F:app/api/authx/challenge/verify/route.ts†L49-L96】【F:lib/authx/verify.ts†L35-L166】
2. **Disable risky factors**: Hide WhatsApp factor until throttling, salting, and audit logging implemented; display UI banner explaining availability status.【F:app/(auth)/mfa/page.tsx†L81-L148】【F:lib/authx/start.ts†L83-L122】
3. **Edge guardrails**: Require signed JWT/HMAC for admin reset, diagnostics, and OTP issuance functions; log audit events for rate limit hits and resets.【F:supabase/config.toml†L1-L22】【F:app/api/admin/mfa/reset/route.ts†L1-L64】

### P1 (Near Term)
1. **Unify MFA stacks**: Refactor login to use AuthX endpoints, remove legacy `/api/mfa/verify`, and migrate Supabase state updates into shared service module to avoid duplication.【F:components/auth/login-form.tsx†L214-L279】【F:lib/authx/verify.ts†L35-L166】
2. **Trusted device management**: Consolidate cookie + DB updates into a single module that both AuthX and legacy flows call; add revocation UX and expose device list in profile settings.【F:lib/authx/verify.ts†L109-L166】【F:app/api/mfa/status/route.ts†L64-L120】
3. **Testing**: Create unit tests for crypto helpers (AES-GCM, backup code), OTP issuance, and rate limiter; add Playwright scenarios for TOTP success/failure, email OTP, backup code, and trusted device enrollment.【F:lib/mfa/crypto.ts†L1-L123】【F:lib/mfa/email.ts†L68-L200】

### P2 (Longer Term)
1. **Passkey enhancements**: Implement trusted device heuristics for passkey successes (reuse existing rememberDevice flag) and provide management UI for stored credentials.【F:lib/mfa/passkeys.ts†L200-L296】
2. **Telemetry**: Emit structured events for MFA attempts (success/failure/rate-limit) to monitoring pipeline; integrate with alerting dashboards and SIEM.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】
3. **Documentation**: Update `docs/AUTH-SETUP.md` (created separately) with environment, enrollment, recovery, and troubleshooting steps; maintain runbook for incident response.

## Go-Live Checklist (Auth)
- [ ] `/api/authx/challenge/verify` parity verified with regression tests (4xx/429/200) and Supabase state updates.
- [ ] WhatsApp factor either disabled or protected by rate limit + salted storage + provider monitoring.
- [ ] CI executes MFA unit + Playwright suites; Lighthouse a11y on MFA page ≥ 90.
- [ ] Trusted device entries validated against cookie tokens with revocation UI.
- [ ] Edge Functions require JWT/HMAC and log audit events per invocation.
