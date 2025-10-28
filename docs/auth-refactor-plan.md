# Authentication & MFA Refactor Plan

## Goals

- Unify login / session management across admin, staff, and member experiences.
- Centralise Supabase interaction and profile hydration logic.
- Modernise MFA (passkeys, TOTP, backup codes) with reusable services and clear
  UX flows.
- Remove legacy duplication (app/api routes vs edge functions) and align with
  RLS policies.
- Provide comprehensive test coverage (unit, integration, RLS) and developer
  tooling (fixtures, stubs).

## Current Pain Points (quick audit)

- Multiple auth entry points (`app/(auth)`, `app/api/member`, `app/api/authx`)
  with repeated Supabase calls.
- MFA state scattered between `lib/auth.ts`, `lib/authx/*`, and edge functions –
  hard to reason about fallback order.
- Tests depend on Supabase local DB but migrations still assume production cron
  extension.
- No single source of truth for auth-related error handling; UI forms each
  implement bespoke flows.
- RLS seed scripts reference roles (`app_authenticator`) that the local test
  harness does not create.

## Proposed Architecture

1. **Auth Service Layer** (`lib/auth/service.ts`)
   - Expose methods: `signInWithPassword`, `signOut`, `getSessionProfile`,
     `requireSession`, `initiateMfa`, `verifyMfa`, `enrolMfaPasskey`,
     `listMfaFactors`.
   - Wrap Supabase client operations; centralise error translation.
   - Provide platform-agnostic context (server, edge, client).
2. **API Restructuring**
   - Consolidate admin/staff login endpoints under `app/api/auth/login` with
     subroutes for `password`, `mfa`, `passkey`.
   - Member-specific flows move into `app/api/member/auth/*` but reuse shared
     service.
   - Retire ad-hoc routes with duplicated logic (`app/api/member/onboard`,
     `app/api/member/pay/ussd-params`) by delegating to shared guard middleware.
3. **MFA Pipeline**
   - Store MFA configuration in `app.users` (JSON `mfa_methods`,
     `mfa_secret_enc`, `backup_codes`).
   - Introduce stored procedures for issuing and verifying OTP, updating
     counters, and logging audit events.
   - Implement `lib/auth/mfa.ts` for passkey/TOTP/email/WhatsApp flows.
4. **Frontend UX**
   - Standardise form components in `components/auth` using state machines
     (XState or custom) to drive multi-step login.
   - Provide consistent error surfaces, fallback to backup codes, and visual
     status for passkey availability.
5. **Testing & Tooling**
   - Add Supabase seed script to create required roles (`app_authenticator`,
     `supabase_authenticator`).
   - Update `scripts/test-rls.sh` to skip `pg_cron` scheduling, mimic production
     policies.
   - Add Vitest unit suites for auth service and Playwright for happy-path
     login + MFA flows.

## Phased Delivery

1. **Foundation (Week 1)**
   - Implement auth service layer and migrate existing server utilities
     (`lib/auth.ts`, `lib/authx/*`).
   - Fix Supabase migrations for local RLS tests (pg_cron guards, role seeds).
2. **Backend Endpoints (Week 2)**
   - Replace login API routes with consolidated versions; add tests.
   - Update Supabase functions/policies for new MFA metadata.
3. **Frontend Refactor (Week 3)**
   - Rebuild login/admn/MFA forms on top of service layer.
   - Add shared state machine + UI components.
4. **Rollout & Hardening (Week 4)**
   - Update docs, changelog; add monitoring hooks.
   - Perform full regression (unit, RLS, e2e). Open release PR.

## Immediate Tasks

- [ ] Create `lib/auth/service.ts` scaffolding.
- [ ] Patch migrations for pg_cron guard (done for 11153000 + 12120000).
- [ ] Seed missing roles for RLS tests.
- [ ] Draft API contract for new login endpoints.
