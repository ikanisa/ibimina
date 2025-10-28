# PR: Auth P1 MFA Enhancements

## Goal

Unify MFA flows on AuthX, improve UX, and add coverage once P0 fixes merged.

## Scope

- Refactor login and `/api/mfa/status` to rely solely on AuthX factor APIs;
  remove legacy `the former legacy /api/mfa/verify (removed)` and ensure state
  updates remain
  consistent.【F:components/auth/login-form.tsx†L214-L279】【F:app/api/authx/challenge/verify/route.ts†L36-L100】【F:app/api/mfa/status/route.ts†L34-L120】
- Implement WhatsApp OTP throttling, salted hash storage, resend countdown, and
  audit logging before re-enabling
  factor.【F:lib/authx/start.ts†L83-L122】【F:app/(auth)/mfa/page.tsx†L150-L213】
- Add MFA management UI in profile for viewing factors, regenerating backup
  codes, revoking trusted devices and
  passkeys.【F:lib/authx/factors.ts†L19-L52】【F:lib/authx/backup.ts†L4-L39】
- Build Playwright flows covering AuthX TOTP/email/WhatsApp (with mock
  provider), backup codes, and trusted device trust/untrust operations.

## Deliverables

- Consolidated AuthX API + UI updates with tests.
- Updated documentation (`REPORT-AUTH.md`, `docs/AUTH-SETUP.md`).
- Playwright suites and CI gating for MFA flows.
