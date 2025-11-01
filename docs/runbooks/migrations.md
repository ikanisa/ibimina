# Database Migration Runbook

This runbook defines the sequencing, validation, and recovery procedures for
Supabase database migrations. It is reviewed each release and must be followed
for every schema change shipped to production.

## 1. Scope & Roles

- **Scope:** Supabase migrations under `supabase/migrations/` and any SQL
  executed during deployment.
- **Primary Owner:** Platform engineering lead (delegates tasks to release
  engineer as needed).
- **Supporting Roles:**
  - Release engineer – runs pre-flight checks and coordinates cutover.
  - QA lead – verifies staging data integrity and RLS behaviour.
  - SRE/on-call – owns backup, rollback, and incident response.

## 2. Migration Sequencing Plan

1. **Author & lint locally**
   - Generate migration with Supabase CLI (`supabase migration new`).
   - Run `supabase start` locally and apply migration
     (`supabase migration up --local`).
   - Execute `pnpm run test:rls` to confirm policies align with new schema.
2. **Peer review**
   - Open PR with migration, updated fixtures, and related application changes.
   - Ensure PR template checklists (tests, docs) are complete before approval.
3. **Merge-to-main staging rehearsal**
   - CI automatically applies migrations to staging and runs `test:rls:docker`
     (see §4).
   - Confirm staging data model is healthy, no unexpected drift.
4. **Production deployment**
   - Once staging validation passes, production deployment job applies the same
     migrations.
   - Post-deploy monitoring (queries, dashboards, alerts) for 30 minutes.

## 3. Pre-flight Checks (Run Before Each Release)

- [ ] Confirm `supabase/migrations` order is chronological and filenames use UTC
      timestamps.
- [ ] Run `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit`,
      `pnpm run test:auth`, and `pnpm run test:rls` locally.
- [ ] Validate staged migration by running
      `supabase migration up --linked --include-all --dry-run` against staging.
- [ ] Ensure RLS fixtures (`supabase/tests/fixtures/*`) match expected policies.
- [ ] Review Supabase dashboard for pending or failed migrations.
- [ ] Verify secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_STAGING_PROJECT_REF`,
      backups credentials) are present in GitHub.

## 4. Automated Staging Validation

- GitHub Actions workflow **Supabase Migrations & Edge Functions**
  automatically:
  1. Links to the staging project and applies all pending migrations when
     commits land on `main`.
  2. Runs the Docker-backed RLS test harness
     (`pnpm --filter @ibimina/admin run test:rls:docker`).
  3. Blocks production deployment if either staging apply or RLS tests fail.
- Release engineer monitors the workflow run and signs off in the release
  checklist.

## 5. Backup & Rollback Procedures

### 5.1 Backup (Prior to Production Apply)

1. **Snapshot:** Trigger a point-in-time restore backup in Supabase dashboard
   (`Database → Backups → Create manual backup`).
2. **Export critical tables:**
   ```bash
   supabase db dump --project-ref $SUPABASE_PROJECT_REF --schema app,public --db-url "$PROD_DATABASE_URL" --file backups/$(date -u +%Y%m%dT%H%M%SZ)_pre_migration.sql
   ```
3. **Archive artefacts:** Store backup manifest and migration IDs in
   `/backups/CHANGELOG.md` (or ticket system) with release ID.

### 5.2 Rollback (If Migration Fails)

1. **Immediate response:** Freeze writes by setting the app to maintenance mode
   (toggle feature flag `maintenance_mode`).
2. **Assess damage:**
   - Check Supabase migration history (`supabase migration list --linked`).
   - Inspect error logs and identify last successful migration.
3. **Rollback path:**
   - If migration has down script, execute
     `supabase migration down --linked --to <previous_timestamp>`.
   - If no down script, restore database from latest manual backup (Supabase
     dashboard restore).
4. **Post-rollback validation:**
   - Run smoke tests plus `pnpm run test:rls` locally against restored database
     snapshot.
   - Communicate status in incident channel and file postmortem.

## 6. Runbook Checklist (Per Release)

Complete this checklist before green-lighting production deployment. Update the
checklist state in the release notes or issue tracker.

- [ ] Staging migrations applied successfully (CI job green).
- [ ] RLS Docker test suite passed on the merge commit.
- [ ] Manual Supabase backup captured and logged.
- [ ] Rollback commands prepared (timestamp verified, `migration down` or
      restore path documented).
- [ ] Application smoke tests and security checks completed post-staging.
- [ ] Runbook review completed (no steps outdated, docs updated if necessary).
- [ ] Release owner sign-off: `@<name>`

## 7. Change Log

| Date (UTC) | Updated By    | Notes                                                         |
| ---------- | ------------- | ------------------------------------------------------------- |
| 2025-01-19 | Initial draft | First publication of migration runbook and release checklist. |
