# Row-Level Security Regression Tests

This document tracks the SQL fixtures that exercise row-level security (RLS) and
country propagation logic in Supabase. Execute them through the existing admin
workspace script:

```bash
pnpm run test:rls
```

Running the command applies all migrations to the test database and executes
each SQL file under `supabase/tests/rls` in alphabetical order.

## Country propagation safeguards

| Context  | Command | Description |
| -------- | ------- | ----------- |
| Local    | `pnpm --filter @ibimina/testing run test:rls` | Runs SQL harness against local Docker Postgres, seeding fixtures for staff, member, auditor roles. |
| Preview  | `apps/admin/scripts/test-rls-docker.sh --database-url <url>` | Executes harness against preview Supabase branch inside CI. |
| CI       | GitHub Actions `ci.yml` (`rls` job) | Mandatory check before merging to `main`. |

* Verifies that `country_id` is synchronized for `groups`, `group_members`,
  `uploads`, and `allocations` whenever their `org_id` or `group_id` changes.
* Confirms that the `tickets` trigger backfills `country_id` on insert and keeps
  the field consistent after reassignment to a different organization.
* Exercises the new `ticket_messages` trigger to ensure both `org_id` and
  `country_id` mirror the parent ticket on insert and update.

## Ticketing access controls

**Fixture:** `supabase/tests/rls/ticketing_access.test.sql`

* Simulates staff from different organizations to confirm they only see their
  own tickets and can create messages inside their tenancy.
* Ensures ticket owners (customers) can read and reply to their own tickets but
  are denied access to other tenants’ conversations.
* Validates that cross-organization writes are rejected for both staff and
  customers.

Keep this file up to date whenever a new fixture is added so security reviewers
and release engineers know which scenarios are covered.
