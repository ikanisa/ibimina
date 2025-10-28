# SACCO+ Authentication & MFA Audit

_Date: 2025-10-18_

## Executive Summary

| Dimension             | Status        | Notes                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Factor coverage       | 🟡 Acceptable | WhatsApp factor is gated behind `NEXT_PUBLIC_WHATSAPP_MFA` and hidden by default while throttling lands; passkey, TOTP, email, and backup factors remain available.【F:app/(auth)/mfa/page.tsx†L10-L115】【F:lib/authx/start.ts†L83-L122】                                                                                    |
| API hygiene           | 🟢 Good       | `/api/authx/challenge/verify` now mirrors legacy parity with shared helpers, rate limits, and Supabase state updates aligned with `the former legacy /api/mfa/verify (removed)`.【F:app/api/authx/challenge/verify/route.ts†L33-L248】【F:app/api/authx/challenge/verify/route.ts†L28-L214】【F:lib/authx/verify.ts†L32-L89】 |
| Secrets & storage     | 🟢 Good       | TOTP secrets stay encrypted, backup codes peppered, and both verification paths reset failure counters and replay guards on success.【F:lib/mfa/crypto.ts†L1-L103】【F:app/api/authx/challenge/verify/route.ts†L146-L206】【F:app/api/authx/challenge/verify/route.ts†L169-L236】                                             |
| Trusted devices       | 🟢 Good       | Legacy and AuthX paths now converge on `issueSessionCookies`, ensuring trusted-device rows and cookies stay in sync across flows.【F:app/api/authx/challenge/verify/route.ts†L200-L214】【F:app/api/authx/challenge/verify/route.ts†L233-L246】【F:lib/authx/verify.ts†L32-L89】                                              |
| Observability & tests | 🔴 Missing    | No automated MFA unit/e2e tests, audit logging swallows failures, and rate limit RPC lacks telemetry or circuit breakers.【F:lib/audit.ts†L9-L21】【F:lib/rate-limit.ts†L1-L19】                                                                                                                                              |

### Implementation Snapshot (Work Branch `work`)

- **Unified verification parity** –
  `the former legacy /api/mfa/verify (removed)` and
  `/api/authx/challenge/verify` both rely on the factor facade, enforce rate
  limits, persist replay guards, and issue trusted-device cookies via
  `issueSessionCookies`.【F:app/api/authx/challenge/verify/route.ts†L28-L214】【F:app/api/authx/challenge/verify/route.ts†L33-L248】【F:lib/authx/verify.ts†L32-L89】
- **WhatsApp gated by default** – Smart MFA UI filters out WhatsApp unless
  `NEXT_PUBLIC_WHATSAPP_MFA` explicitly enables it, and surfaces guidance while
  the channel remains hardened.【F:app/(auth)/mfa/page.tsx†L10-L118】
- **RLS harness committed** – SQL policy tests cover payments, recon, ops, and
  trusted device tables, executed via `scripts/test-rls.sh` and Docker wrapper
  for parity with
  CI.【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】【F:supabase/tests/rls/trusted_devices_access.test.sql†L1-L84】【F:scripts/test-rls-docker.sh†L1-L21】

## Key Findings

1. **Observability & test debt** – Audit logging still swallows failures,
   rate-limit RPC lacks telemetry, and there are no automated unit or Playwright
   suites covering AuthX
   factors.【F:lib/audit.ts†L9-L21】【F:lib/rate-limit.ts†L1-L19】
2. **WhatsApp backend hardening outstanding** – Delivery remains gated at the
   UI, but server-side hashing and throttling must still add per-request salts,
   HMAC, and provider metrics before
   reenabling.【F:lib/authx/start.ts†L83-L122】
3. **Admin & diagnostics alignment** – Admin reset and diagnostics endpoints
   continue to rely on legacy flows; align them with AuthX audit + verification
   paths for consistent logging and policy
   enforcement.【F:app/api/admin/mfa/reset/route.ts†L1-L64】【F:lib/authx/audit.ts†L1-L14】

## Flow Analysis

### Sign-in

- Credentials submitted via Supabase browser client. On success, client fetches
  `/api/mfa/status` which checks `MFA_SESSION_COOKIE` and
  `TRUSTED_DEVICE_COOKIE`, using hashed user-agent/IP to validate trusted device
  entries.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/mfa/status/route.ts†L18-L104】
- If MFA required and WhatsApp factor available, legacy flow redirects to
  `/mfa`. Otherwise, login form stays inline and uses legacy
  `the former legacy /api/mfa/verify (removed)` endpoint for code
  submission.【F:components/auth/login-form.tsx†L214-L279】

### AuthX MFA page

- Client fetches `/api/authx/factors/list` to detect enrolled factors
  (passkey/TOTP/email/WhatsApp/backup). Factor data derived from service-role
  Supabase queries against `public.users`, `authx.user_mfa`, and credential
  counts.【F:app/(auth)/mfa/page.tsx†L81-L148】【F:lib/authx/factors.ts†L19-L52】
- Initiation: `/api/authx/challenge/initiate` issues passkey options, sends
  email via existing OTP service, and only triggers WhatsApp delivery when the
  feature flag is enabled—backend hashing still needs salting before production
  rollout.【F:app/api/authx/challenge/initiate/route.ts†L1-L47】【F:lib/authx/start.ts†L17-L122】
- Verification: `/api/authx/challenge/verify` shares the factor facade with
  legacy flow, enforces rate limits, persists Supabase state, and issues cookies
  via
  `issueSessionCookies`.【F:app/api/authx/challenge/verify/route.ts†L33-L246】【F:lib/authx/verify.ts†L32-L89】

### Legacy MFA route

- `the former legacy /api/mfa/verify (removed)` enforces rate limit via RPC,
  decrypts TOTP secret, compares steps, updates `last_mfa_step` and
  `failed_mfa_count`, persists backup code usage, writes audit logs, and creates
  trusted device row before setting
  cookies.【F:app/api/authx/challenge/verify/route.ts†L52-L205】

### Enrollment & recovery

- `/api/mfa/enroll` handles TOTP setup with AES-encrypted pending token;
  `/api/mfa/confirm` enables MFA, resets counters, and clears pending
  tokens.【F:app/api/mfa/enroll/route.ts†L40-L132】【F:app/api/mfa/confirm/route.ts†L30-L78】
- Backup codes consumed via admin client; hashed with pepper+salt using PBKDF2
  and stored in `users.mfa_backup_hashes`. Legacy route updates array; AuthX
  path only removes hash and returns
  boolean.【F:lib/mfa/crypto.ts†L79-L123】【F:lib/authx/backup.ts†L4-L39】

## Observability & Testing

- Audit logging writes to `audit_logs` using SSR client; on failure logs error
  but does not retry or raise alarms.【F:lib/audit.ts†L9-L21】
- No unit or e2e tests cover AuthX flows; `scripts/test-rls.sh` runs only SQL
  policy tests. Playwright suite absent.【F:scripts/test-rls.sh†L1-L16】
- Rate limit RPC logs error and throws but lacks metrics to distinguish
  throttled vs fail-open cases; add telemetry and circuit
  breakers.【F:lib/rate-limit.ts†L1-L19】

## Recommendations

### P0 (Immediate)

1. **WhatsApp backend hardening**: Add per-request salts, throttling, and
   provider telemetry before re-enabling the channel that the UI currently hides
   by default.【F:lib/authx/start.ts†L83-L122】
2. **Observability & automated tests**: Instrument audit/rate-limit paths with
   structured logs and ship unit + Playwright coverage for AuthX verification
   and recovery flows.【F:lib/audit.ts†L9-L21】【F:lib/rate-limit.ts†L1-L19】
3. **Admin & diagnostics alignment**: Move reset/diagnostics flows onto AuthX
   audit pathways so operator actions share the same logging and policy
   enforcement.【F:app/api/admin/mfa/reset/route.ts†L1-L64】【F:lib/authx/audit.ts†L1-L14】

### P1 (Near Term)

1. **Unify MFA entrypoint**: Point the login form at AuthX endpoints and retire
   legacy `the former legacy /api/mfa/verify (removed)` once tests cover the new
   path
   end-to-end.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/authx/challenge/verify/route.ts†L33-L246】
2. **Trusted device management UX**: Expose device inventory and revocation
   controls in profile while reusing the shared session issue
   helper.【F:lib/authx/verify.ts†L32-L89】【F:app/api/mfa/status/route.ts†L64-L120】
3. **Factor lifecycle documentation**: Extend runbooks (`docs/AUTH-SETUP.md`) to
   capture enrollment, recovery, and incident response with the AuthX
   stack.【F:docs/AUTH-SETUP.md†L1-L44】

### P2 (Longer Term)

1. **Passkey enhancements**: Implement trusted-device heuristics for passkey
   successes (reuse rememberDevice flag) and surface management UI for stored
   credentials.【F:lib/mfa/passkeys.ts†L200-L296】
2. **Telemetry integration**: Emit structured metrics for MFA attempts
   (success/failure/rate-limit) and wire into alerting dashboards /
   SIEM.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】
3. **Offline + member apps**: Continue mobile/PWA polish once core auth paths
   complete; maintain runbook for incident response and scheduled
   reconciliation.【F:docs/operations/mfa-rollout.md†L1-L80】

## Go-Live Checklist (Auth)

- [ ] `/api/authx/challenge/verify` parity verified with regression tests
      (4xx/429/200) and Supabase state updates.
- [ ] WhatsApp factor either disabled or protected by rate limit + salted
      storage + provider monitoring.
- [ ] CI executes MFA unit + Playwright suites; Lighthouse a11y on MFA page
      ≥ 90.
- [ ] Trusted device entries validated against cookie tokens with revocation UI.
- [ ] Edge Functions require JWT/HMAC and log audit events per invocation.
