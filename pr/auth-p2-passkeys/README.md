# PR: Auth P2 Passkeys & Advanced Factors

## Goal

Extend MFA with richer passkey management, analytics, and observability once
core flows stabilise.

## Scope

- Add friendly-name editing, credential revocation, and trusted-device
  heuristics for passkey successes; ensure Supabase credential table updates
  remain secure.【F:lib/mfa/passkeys.ts†L200-L296】
- Provide UI for passkey management (profile page), including revoke, rename,
  and last-used metadata surfaced from
  Supabase.【F:lib/authx/factors.ts†L19-L52】
- Instrument analytics for factor usage (passkey vs codes), integrate with
  monitoring pipeline, and expose dashboards for ops
  review.【F:lib/observability/logger.ts†L1-L76】【F:lib/audit.ts†L9-L21】
- Evaluate addition of passkey-first login (WebAuthn conditional UI) with
  fallback to AuthX code challenge.

## Deliverables

- Updated passkey server/client logic + migrations if needed.
- Profile UI enhancements and documentation updates.
- Observability dashboards and analytics instrumentation.
