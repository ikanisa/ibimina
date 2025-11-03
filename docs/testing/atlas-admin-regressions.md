# Atlas Admin Regression Inventory

## Automated Suites

| Area                 | Coverage                             | Tooling                        | Notes                                      |
| -------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------ |
| Dashboard smoke      | KPI cards, task list interactions    | Playwright `dashboard.spec.ts` | Runs on PR and nightly cron                |
| Member search        | Directory filters, saved views       | Playwright `members.spec.ts`   | Includes bilingual assertions              |
| Loan delinquency     | Matrix interactions, bulk assignment | Playwright `loans.spec.ts`     | Validates optimistic updates and rollbacks |
| Risk case update     | Kanban drag/drop, evidence upload    | Playwright `risk.spec.ts`      | Captures audit log events                  |
| Component unit tests | UI primitives, hooks                 | Jest `packages/ui-*`           | Snapshots stored in `__snapshots__`        |
| Accessibility        | Axe/Pa11y regression snapshots       | Pa11y CI                       | Stored in `artifacts/a11y/atlas-admin`     |

## Manual Regression Pass

| Scenario                            | Owner           | Frequency                 | Evidence                                   |
| ----------------------------------- | --------------- | ------------------------- | ------------------------------------------ |
| Bilingual content review (en ↔ rw) | Localization QA | Before each release       | Screenshots archived in `attached_assets/` |
| Offline collections workflow        | Field Ops QA    | Quarterly + major release | Chrome dev tools offline report            |
| Risk escalation approval            | Compliance lead | Release candidate         | Jira ticket with timestamped approvals     |
| Loan restructuring wizard           | Credit ops      | Release candidate         | Loom recording attached to PR              |

## Data Validation

- Supabase row-level security policies verified via `pnpm run test:rls`.
- Daily Prometheus dashboards reviewed for anomalies post-deploy.
- Audit log entries sampled (5 per domain) to confirm actor, timestamp,
  justification present.

Maintain this inventory alongside `docs/atlas-admin-ux-review.md` to ensure
coverage remains aligned with the shipped experience.
