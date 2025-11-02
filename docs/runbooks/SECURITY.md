# Security Runbook

This runbook captures the controls that keep Ibimina production safe and the
actions to take when rotating secrets or responding to security events.

## 1. Identity & Access Controls

- **Authentication**: Staff console logins use Supabase sessions plus a
  mandatory MFA step (passkeys, TOTP, backup codes). The `requireUserAndProfile`
  guard rejects requests lacking a verified MFA
  timestamp.【F:apps/admin/lib/auth.ts†L1-L200】【F:apps/admin/app/(auth)/login/page.tsx†L1-L160】
- **Trusted Devices**: Device enrollment and challenge flows live under
  `app/api/device-auth`. Users must complete WebAuthn registration before the
  device is stored, and every login revalidates against the stored credential
  IDs.【F:apps/admin/app/api/device-auth/enroll/route.ts†L1-L180】【F:apps/admin/app/api/device-auth/verify/route.ts†L1-L200】
- **Role-based Access**: Profiles carry `role` and `sacco_id` values.
  Route-level loaders enforce permissions by checking the profile before
  returning data, e.g. the dashboard denies access when a SACCO assignment is
  missing.【F:apps/admin/app/(main)/dashboard/page.tsx†L43-L80】
- **Member Access**: The client PWA consumes only RLS-protected APIs using the
  anon key; no service-role credentials ship to the
  browser.【F:apps/client/lib/supabase/client.ts†L1-L120】

## 2. Secrets & Key Management

- All runtime secrets live in `.env.local` / `.env.production` files validated
  by the `@ibimina/config` schema. Required keys include Supabase service role,
  encryption keys (`KMS_DATA_KEY`/`BACKUP_PEPPER`), MFA secrets, and external
  provider
  tokens.【F:packages/config/src/index.ts†L1-L200】【F:.env.example†L1-L60】
- Supabase secrets are synced via `supabase secrets set --env-file` to keep Edge
  Functions in parity with application deployments.
- Rotate credentials quarterly or immediately after suspected compromise. Update
  both local `.env*` files and Supabase secrets, then regenerate Supabase types
  (`make bootstrap`) to ensure no stale configuration leaks into builds.

## 3. Data Protection

- **Encryption**: Sensitive fields (PII, MFA secrets) are encrypted client-side
  with AES-256-GCM using keys provided by `KMS_DATA_KEY`. Helpers live in
  `apps/admin/lib/mfa/crypto.ts` for backup codes and MFA
  secrets.【F:apps/admin/lib/mfa/crypto.ts†L1-L120】
- **RLS Policies**: Every table exposed to client surfaces is locked behind RLS
  and verified via the `tests/rls` suite before
  release.【F:apps/admin/tests/rls/memberships.test.ts†L1-L160】
- **Backups**: Supabase automated backups run nightly. Confirm retention weekly
  in the Supabase dashboard; escalate to SRE if failures appear in status
  emails.

## 4. Logging & Monitoring

- Structured logs include request ID, user ID, SACCO ID, and contextual payloads
  for every event. Configure `LOG_DRAIN_URL`, `LOG_DRAIN_TOKEN`, and
  `LOG_DRAIN_ALERT_WEBHOOK` in production
  environments.【F:apps/admin/lib/observability/logger.ts†L1-L170】【F:.env.example†L21-L36】
- Security events (failed MFA, device revocations) are emitted with distinct
  event names (`auth.mfa.failure`, `device.revoked`) and appear in the drain and
  Supabase audit tables for correlation.
- For mobile, enable Sentry DSN and PostHog keys so runtime errors propagate to
  monitoring tools configured in
  `apps/mobile/app.config.ts`.【F:apps/mobile/app.config.ts†L1-L80】

## 5. Rotation Playbooks

| Secret / Credential        | Rotation cadence | Steps                                                                                        |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| Supabase service role key  | Quarterly        | Rotate in Supabase dashboard → update `.env*` → `supabase secrets set`                       |
| KMS data key / pepper      | Quarterly        | Generate new key → update `.env*` → recycle Next.js deployment                               |
| MFA session & trusted keys | Monthly          | Rotate `MFA_SESSION_SECRET` & `TRUSTED_COOKIE_SECRET` → invalidate sessions                  |
| Log drain tokens           | Quarterly        | Issue new tokens → update env vars → run `pnpm --filter @ibimina/admin run verify:log-drain` |
| Expo access tokens         | Quarterly        | `eas credentials` rotate → update CI secrets                                                 |

Record rotations in the security ledger (`docs/security/rotations-<year>.md`) so
compliance reviews have traceability.

## 6. Incident Workflow

1. **Detection**: Alerts arrive via the log drain webhook or Supabase security
   notifications. Confirm the indicator is legitimate before proceeding.
2. **Containment**: Disable affected API keys or rotate credentials immediately.
   For compromised accounts, revoke sessions in Supabase and delete the trusted
   device entries.
3. **Eradication**: Patch vulnerabilities (e.g., fix API route bug), add tests
   to prevent regression, and redeploy via `pnpm run release`.
4. **Recovery**: Monitor logs for recurrence, re-enable rotated keys, and notify
   stakeholders via the #security channel.
5. **Postmortem**: File a report in `docs/security/incidents/<date>-<slug>.md`
   within 48 hours.

Keep this runbook beside the operations guide during audits and incident drills.
