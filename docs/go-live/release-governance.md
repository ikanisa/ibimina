# Release Governance & Branch Protection

Defines ownership, review expectations, and branch protection settings for
SACCO+ releases. Use this document together with
[CODEOWNERS](../../.github/CODEOWNERS) and the
[release checklist](release-checklist.md).

## CODEOWNERS Overview

| Path                   | Owners                                                 | Notes                                    |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `/`                    | `@ikanisa/platform-eng` `@ikanisa/security-compliance` | Default reviewers for all changes        |
| `app/` & `packages/`   | `@ikanisa/frontend` `@ikanisa/platform-eng`            | UI + shared libraries                    |
| `supabase/` & `infra/` | `@ikanisa/devops` `@ikanisa/platform-eng`              | Database, edge functions, infrastructure |
| `docs/go-live/`        | `@ikanisa/devops` `@ikanisa/product-ops`               | Launch collateral and checklists         |
| `.github/workflows/`   | `@ikanisa/devops`                                      | CI guardrails                            |

> Ensure the GitHub teams listed above exist and remain synchronized with the
> actual on-call roster.

## Protected Branch Policy

### Branches

- `main` — production deployment source.
- `work` — integration branch for pre-production hardening.

### Required Status Checks

1. `ci` (`.github/workflows/ci.yml`) — lint, typecheck, unit tests, bundle
   budgets.
2. `pre-merge-quality` — accessibility, translation parity, targeted smoke
   tests.
3. `node-quality` — dependency audit + formatting.
4. `db-guard` — migration safety net (required when SQL changes).
5. `supabase-deploy` — applies infrastructure changes (required when `supabase/`
   touched).

All checks must pass before merging. Do **not** allow “merge with failed checks”
overrides except during documented incident response.

### Review Rules

- Require **2 approvals** on `main`: one from `@ikanisa/platform-eng` and one
  from `@ikanisa/devops` (CODEOWNERS enforce).
- Require **1 approval** on `work`: any CODEOWNER for touched paths.
- Enforce “Dismiss stale reviews” so changes after approval trigger re-review.
- Require conversations to be resolved before merging.
- Restrict force pushes and direct pushes to `main` and `work` to GitHub admins
  only.

### Emergency Procedure

1. Announce intent to bypass checks in `#incident-room` with rationale and
   timeframe.
2. Obtain sign-off from Platform Engineering manager and DevOps lead.
3. Temporarily relax branch protection using GitHub admin controls; document the
   change in the release issue.
4. Restore protection immediately after the fix and run all workflows manually.
5. Backfill CODEOWNER review post-incident.

## Reviewer Expectations

- **Scope validation**: confirm diff aligns with linked issue or release
  checklist step.
- **CI audit**: check all required workflows completed successfully (no skipped
  jobs).
- **Security posture**: verify secrets, auth flows, and environment configs
  weren’t weakened.
- **Documentation**: ensure relevant guides (including this hub) are updated.
- **Post-merge follow-up**: assign owners for outstanding tasks, add them to
  [gaps & recommendations](gaps-and-recommendations.md).

## Change Approval Workflow

1. Author opens PR against `work` (or `main` for hotfix).
2. CODEOWNERS auto-requested; author pings missing reviewers after 24h.
3. Reviewers leave actionable feedback within 1 business day.
4. Once approvals + CI are green, release captain merges via squash/FF per
   branch policy.
5. Update [CHANGELOG.md](../../CHANGELOG.md) and
   [artifacts inventory](artifacts-inventory.md) before tagging.

Keeping this governance document updated ensures branch rules stay aligned with
CI automation and audit expectations.
