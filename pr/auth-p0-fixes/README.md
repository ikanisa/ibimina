# PR: Auth P0 Fixes

## Goal

Eliminate critical MFA vulnerabilities identified in Auth audit.

## Scope

- Add rate limiting, replay guard, and Supabase state updates to
  `/api/authx/challenge/verify`; share logic with legacy verifier and update
  tests.【F:app/api/authx/challenge/verify/route.ts†L36-L100】【F:lib/authx/verify.ts†L35-L166】【F:app/api/authx/challenge/verify/route.ts†L72-L209】
- Align trusted device issuance (DB + cookies) across flows; ensure
  `app/api/mfa/status` recognises AuthX-issued
  sessions.【F:lib/authx/verify.ts†L109-L166】【F:app/api/mfa/status/route.ts†L64-L120】
- Temporarily hide WhatsApp factor or gate behind feature flag until throttling
  implemented.【F:app/(auth)/mfa/page.tsx†L81-L148】【F:lib/authx/start.ts†L83-L122】
- Require JWT/HMAC for sensitive Supabase functions (`parse-sms`, `ingest-sms`,
  `sms-inbox`, admin reset) and add audit logging for
  invocations.【F:supabase/config.toml†L1-L22】【F:app/api/admin/mfa/reset/route.ts†L1-L64】
- Add unit coverage for crypto helpers, backup code consumption, and rate
  limiter; run in
  CI.【F:lib/mfa/crypto.ts†L1-L123】【F:lib/authx/backup.ts†L4-L39】【F:lib/rate-limit.ts†L1-L19】

## Deliverables

- Updated API handlers, helpers, and unit tests.
- Supabase config changes + documentation updates (`docs/AUTH-SETUP.md`).
- Playwright regression for TOTP/backup/email flows and trusted device
  enrollment.
