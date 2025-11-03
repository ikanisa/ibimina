# Release Checklist

Structured steps for promoting the SACCO+ staff console to production. Pair this
checklist with the [production checklist](production-checklist.md) and
[release governance guide](release-governance.md).

## 1. Planning & Preparation

- [ ] Confirm target release window and stakeholders in the team calendar.
- [ ] Create release tracking issue with links to:
  - [Go-live executive summary](executive-summary.md)
  - [Gaps & recommendations backlog](gaps-and-recommendations.md)
  - [Artifacts inventory](artifacts-inventory.md)
- [ ] Ensure remediation items tagged “Pre-launch” are closed or have signed
      waivers.
- [ ] Verify CODEOWNERS are assigned for all touched paths; escalate gaps before
      freeze.

## 2. Branch Health

- [ ] Ensure `work` is up to date with `main` (fast-forward merge).
- [ ] Confirm branch protection rules on `work` and `main` require:
  - `ci` workflow (ci.yml)
  - `pre-merge-quality` workflow
  - `node-quality` workflow
  - `db-guard` and `supabase-deploy` when migrations are present
- [ ] Validate pending PRs include at least one CODEOWNER approval per
      [release governance](release-governance.md).

## 3. Pre-Release Validation

- [ ] Run `pnpm run validate:production` locally.
- [ ] Review Atlas admin UX artifacts (`docs/atlas-admin-ux-review.md`,
      `docs/atlas-admin-ux-spec.md`) and confirm deltas signed off.
- [ ] Update regression inventory (`docs/testing/atlas-admin-regressions.md`)
      with scenarios exercised in this release.
- [ ] Capture latest Lighthouse + Web Vitals for `/admin`, `/admin/members`,
      `/admin/loans`; attach to release issue.
- [ ] Ensure bilingual (en/rw) sanity checks recorded with evidence links.
- [ ] Execute `scripts/validate-production-readiness.sh`.
- [ ] Review latest run of `.github/workflows/pre-merge-quality.yml` for flakes.
- [ ] Confirm Supabase migrations applied successfully in staging
      (`pnpm supabase db diff`).
- [ ] Update [CHANGELOG.md](../../CHANGELOG.md) with release notes and PR
      references.

## 4. Release Candidate Tagging

- [ ] Create annotated tag `vX.Y.Z-rcN` on `work` after CI success.
- [ ] Bundle Atlas admin screenshot catalog from `attached_assets/` into release
      evidence folder.
- [ ] Verify telemetry dashboards (Prometheus/Grafana) show Atlas admin widgets
      reporting.
- [ ] Trigger deploy to staging via `deploy-cloudflare.yml` dispatch.
- [ ] Run smoke tests against staging (Playwright suite and manual
      verification).
- [ ] Capture screenshots and metrics for release archive (attach to release
      issue).

## 5. Production Launch

- [ ] Merge `work` → `main` with fast-forward.
- [ ] Confirm protected branch checks are green post-merge.
- [ ] Trigger production deployment workflows (`deploy-cloudflare.yml`,
      `supabase-deploy.yml`).
- [ ] Monitor observability dashboards (Prometheus, Grafana) for 30 minutes.
- [ ] Communicate launch completion to stakeholders (Slack + email template).

## 6. Post-Launch Activities

- [ ] Run [post-deployment validation](../POST_DEPLOYMENT_VALIDATION.md).
- [ ] File follow-up tasks for remaining “Post-launch” items in
      [gaps & recommendations](gaps-and-recommendations.md).
- [ ] Update [artifacts inventory](artifacts-inventory.md) with generated assets
      (dashboards, logs).
- [ ] Schedule retrospective and include relevant metrics/logs.
- [ ] Close release tracking issue with summary and link to metrics.

## 7. Communication Templates

- **Stakeholder email**: Use `attached_assets/launch-email-template.md`.
- **Support handoff**: Update Zendesk macro referencing new release tag.

Maintain this document alongside the release governance to keep the checklist
accurate for each production push.
