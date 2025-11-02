# Security Overview

Ibimina's security programme builds on Supabase RLS, hardened authentication, and
continuous verification. This document summarises the controls that underpin the
runbooks.

## Identity & Access

- Supabase Auth with enforced MFA (passkeys, TOTP, backup codes) and trusted
  device attestations.
- Admin console routes rely on `requireUserAndProfile` guards; member-facing
  endpoints use anon-key plus RLS with scoped policies.
- GitHub SSO gated with branch protection and required reviews before merges to
  `main`.

## Data Protection

- RLS policies defined across `app.*`, `identity.*`, and `operations.*` schemas;
  validated via `pnpm --filter @ibimina/testing run test:rls`.
- Encryption in transit via HTTPS-only Vercel domains and Supabase managed TLS;
  sensitive at-rest values encrypted with KMS-provisioned keys.
- Regular backups scheduled through Supabase with manual snapshot captured per
  release (see `GO_LIVE_CHECKLIST.md`).

## Secrets & Configuration

- Environment variables captured per-lane in `docs/ENVIRONMENT.md`.
- Secrets rotated per cadence defined in `docs/runbooks/SECURITY.md` and logged
  in the security ledger (`docs/security/rotations-*.md`).
- Vercel deployments use protected environment variables; Supabase secrets synced
  via `supabase secrets set --env-file`.

## Monitoring & Response

- Log drain feeds Grafana Loki dashboards monitored by SRE rotation.
- Alerts route to PagerDuty and Slack; test hooks required before each release.
- Incident triage and postmortem process documented in
  `docs/runbooks/SECURITY.md`.

## Compliance & Audit

- CHANGELOG and `docs/releases/` provide traceability for every deployment.
- RLS proof artifacts (CI job outputs, SQL harness logs) retained for three
  months.
- Quarterly access reviews ensure principle of least privilege across Supabase
  roles and third-party integrations.

For operational procedures refer to `docs/runbooks/SECURITY.md` and the go-live
materials under `docs/go-live/`.
