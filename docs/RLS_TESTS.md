# RLS Test Instructions

Use this guide to execute and interpret the Supabase Row-Level Security proof
suite.

## 1. Prerequisites

- Docker (for local Postgres harness)
- Supabase CLI (`supabase login` configured)
- pnpm workspace dependencies installed (`pnpm install`)

## 2. Command Reference

| Context  | Command | Description |
| -------- | ------- | ----------- |
| Local    | `pnpm --filter @ibimina/testing run test:rls` | Runs SQL harness against local Docker Postgres, seeding fixtures for staff, member, auditor roles. |
| Preview  | `apps/admin/scripts/test-rls-docker.sh --database-url <url>` | Executes harness against preview Supabase branch inside CI. |
| CI       | GitHub Actions `ci.yml` (`rls` job) | Mandatory check before merging to `main`. |

## 3. Test Coverage

- **Membership isolation**: Ensures SACCO staff only access records scoped to
  their `sacco_id`.
- **Payments & reconciliations**: Validates insert/update permissions for payment
  tables and verifies exceptions require elevated roles.
- **Trusted devices**: Confirms WebAuthn credentials and device enrollments are
  restricted to the owning profile.
- **Reporting views**: Checks read-only access for `app.member_aggregates` and
  similar materialised views.

## 4. Failure Handling

1. Review failing statement in test output (stored under `supabase/tests/rls`)
2. Update policy or fixture as needed.
3. Re-run tests locally before pushing changes.
4. Attach failure context to PR if policy adjustments are non-trivial.

## 5. Evidence Archival

- Download CI artifact `rls-proof.tar.gz` post-merge for audit storage.
- Record execution date and outcome in release notes (`docs/releases/2025-12-05-vercel-supabase.md`).

Maintaining green RLS proofs is a release gate; do not deploy if the suite fails.
