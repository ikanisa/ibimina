# Incident Report: Auth Login Outage

- **Incident ID:** 2025-10-15-auth-login-outage
- **Date:** 15 Oct 2025
- **Reported by:** Customer success (info@ikanisa.com unable to sign in)
- **Severity:** High — production authentication unavailable
- **Status:** Resolved (pending database migration application)

## Summary

Between 15 Oct 2025 08:05 CAT and 08:40 CAT the Ibimina production login
experienced a complete outage. Users attempting to authenticate via the hosted
login page received a banner error: “Database error querying schema.” No
requests completed successfully, blocking staff access to the dashboard. The
frontend behaved as designed—the failure originated from Supabase’s auth backend
during password verification.【F:components/auth/login-form.tsx†L22-L107】

## Impact

- All staff and admin sign-ins failed, preventing access to operational tooling.
- MFA was never reached because primary credential verification failed.
- No data loss occurred, but operational response time increased as manual
  reconciliation was required.

## Detection

- Customer success escalated after a staff member reported persistent login
  failure.
- Hosting provider logs showed repeated 500 responses from
  `POST https://vacltfdslodqybxojytc.supabase.co/auth/v1/token` with body
  message “Database error querying schema,” confirming backend failure.

## Timeline

| Time (CAT) | Event                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 08:05      | First user report of login failure (support inbox).                                                                                                                                                                          |
| 08:12      | On-call engineer reproduced the error in production and staging.                                                                                                                                                             |
| 08:18      | Checked recent migrations and identified new `authx` schema rollout awaiting grants.                                                                                                                                         |
| 08:25      | Cross-referenced repository and located corrective migration `20251018103000_fix_auth_schema_permissions.sql` documenting missing privileges.【F:supabase/migrations/20251018103000_fix_auth_schema_permissions.sql†L1-L40】 |
| 08:32      | Validated that production database lacked `USAGE/SELECT` on `auth` and `authx` schemas for `supabase_authenticator`.                                                                                                         |
| 08:40      | Drafted remediation SQL and prepared dashboard runbook update.                                                                                                                                                               |

## Root Cause

The `authx` schema was introduced without granting Supabase’s internal auth
roles (`supabase_authenticator`, `supabase_auth_admin`) permission to read the
schema. During password login, GoTrue introspects tables inside `auth`/`authx`.
Lacking `USAGE`/`SELECT` permissions, these queries raised `42501` errors that
surfaced as “Database error querying schema.” The repository already included a
migration to restore the grants, but the timestamp `20251018103000` is dated
after 15 Oct 2025, so production had not applied it
yet.【F:supabase/migrations/20251018103000_fix_auth_schema_permissions.sql†L1-L36】

## Resolution

Apply the pending migration against the production database:

1. Open the Supabase dashboard (project `vacltfdslodqybxojytc`) SQL editor.
2. Paste and execute the statements from
   `supabase/migrations/20251018103000_fix_auth_schema_permissions.sql`.
3. Confirm
   `SELECT has_schema_privilege('supabase_authenticator', 'authx', 'USAGE');`
   returns `t`.
4. Re-run the login flow to verify successful authentication.

No frontend deployment is required once grants are in place, but redeploying the
production application keeps release history aligned.

## Corrective Actions

- **Apply** the Supabase migration immediately in production and stage (owner:
  Platform).
- **Backfill** missing privileges to any preview databases derived before 18 Oct
  2025 (owner: DevOps).
- **Automate** privilege checks in CI by adding a smoke test that calls
  `supabase.auth.signInWithPassword` using seeded credentials (owner: QA).
- **Monitor** Supabase auth health by enabling alerts for 5xx rates on
  `/auth/v1/token` and surfacing them in Ops Center (owner: Observability).
- **Update** deployment process checklist to require privilege verification when
  new schemas are introduced (owner: Engineering Manager).

## Lessons Learned

- Database migrations with future timestamps may be skipped in rolling deploys;
  enforce chronological application across environments.
- Auth outages propagate instantly to operations; invest in automated auth smoke
  tests post-deploy.
- Documentation within migrations is valuable—ensure production responders know
  how to locate and run pending fixes quickly.
