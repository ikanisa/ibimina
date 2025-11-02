# Audit Follow-up: Supabase RLS Assurance & Migration Guardrails

This follow-up documents the rollback and policy change controls introduced with
the latest hardening work.

## 1. Supabase Policy Regression Coverage

- Added `supabase/tests/rls/loan_applications_access.test.sql` to exercise loan
  application RLS policies alongside contribution access checks.
- Scenarios cover anon key, authenticated members, SACCO staff, and service-role
  bypass expectations, ensuring policy intent is preserved when migrations
  modify related tables.

## 2. Rollback Strategy for Database Changes

1. **Pre-deployment diff guard** – CI now runs
   `supabase db diff --linked --schema public` prior to staging and production
   migrations. Any drift stops the pipeline so new migrations are not applied
   over unknown state.
2. **Automated RLS smoke tests** – On staging verification, migrations run
   against a dedicated branch followed by
   `pnpm --filter @ibimina/admin run test:rls:docker` and the new integration
   coverage. Failures block promotion to production.
3. **Rollback procedure** – If a migration causes regressions:
   - Trigger Supabase point-in-time restore using the timestamp captured in the
     deploy workflow output.
   - Re-run `scripts/verify-schema.sh` locally to confirm the restored
     environment matches the committed schema snapshot before re-attempting
     deployment.
   - Re-apply migrations only after the RLS tests and Playwright API suites
     succeed on the restored clone.

## 3. Policy Change Process

- **Authoring** – Every policy change must ship with an accompanying SQL test
  under `supabase/tests/rls/` that exercises anon, authenticated, and privileged
  roles.
- **Review** – During PR review, verify that `supabase db diff` output is clean
  and the new/updated tests are registered via `scripts/test-rls.sh` (picked up
  automatically through filename convention).
- **Execution** – CI enforces diff cleanliness and test execution. Only after
  `migration-check`, Playwright API suites, and RLS tests succeed will the
  production job apply migrations.
- **Monitoring** – Post-deploy, monitor the existing Grafana alerts for
  `ci.playwright.failure` and Supabase function errors; failures trigger
  rollback via the procedure above.

These steps ensure policy intent remains intact, migrations are reversible, and
the production rollout path is observably safe.
