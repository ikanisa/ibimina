# PR: P0 Hardening

## Goal

Address critical security and stability gaps identified in the audit before
production go-live.

## Scope

- Harden `/api/authx/challenge/verify` with rate limiting, replay guard, and
  Supabase state updates matching legacy
  `the former legacy /api/mfa/verify (removed)` (update `lib/authx/verify.ts`,
  introduce shared
  helper).【F:app/api/authx/challenge/verify/route.ts†L36-L100】【F:lib/authx/verify.ts†L35-L166】【F:app/api/authx/challenge/verify/route.ts†L72-L209】
- Align trusted-device creation (DB + cookies) across legacy and AuthX flows;
  refactor into shared
  module.【F:lib/authx/verify.ts†L109-L166】【F:app/api/mfa/status/route.ts†L64-L120】
- Disable or guard WhatsApp factor until throttling ready (feature flag/UI
  copy).【F:app/(auth)/mfa/page.tsx†L81-L148】
- Lock down Supabase functions with JWT/HMAC verification (`parse-sms`,
  `ingest-sms`, `sms-inbox`, scheduled jobs).【F:supabase/config.toml†L1-L22】
- Ship quick accessibility fixes (`aria-current`, quick actions focus trap,
  keyboard dismissal).【F:components/layout/app-shell.tsx†L166-L278】
- Add basic RLS SQL tests for payments/recon/trusted devices and wire into CI
  (`scripts/test-rls.sh`).【F:supabase/tests/rls/sacco_staff_access.test.sql†L1-L118】【F:scripts/test-rls.sh†L1-L16】

## Deliverables

- Updated APIs and helpers with unit tests (crypto, rate limiter, OTP).
- Playwright smoke for MFA success/failure and trusted device enrollment.
- Supabase config changes plus migration/test scripts.
- Changelog + documentation updates (`REPORT-AUTH.md`, `docs/AUTH-SETUP.md`).
