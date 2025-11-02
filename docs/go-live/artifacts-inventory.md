# Release Artifacts Inventory

Catalogue of evidence collected during go-live validation. Update this inventory
for each release so audit trails remain accessible.

## 1. Executive & Readiness Documentation

| Artifact                       | Location                                                   | Owner                | Last Updated |
| ------------------------------ | ---------------------------------------------------------- | -------------------- | ------------ |
| Go-live executive summary      | [executive-summary.md](executive-summary.md)               | Product Operations   | 2025-10-31   |
| Readiness audit narrative      | [readiness-audit.md](readiness-audit.md)                   | Platform Engineering | 2025-10-31   |
| Readiness scorecard            | [readiness-summary.md](readiness-summary.md)               | QA Lead              | 2025-10-30   |
| Gaps & recommendations backlog | [gaps-and-recommendations.md](gaps-and-recommendations.md) | Program Manager      | Rolling      |

## 2. Operational Runbooks

| Artifact                   | Location                                                             | Owner                | Notes                        |
| -------------------------- | -------------------------------------------------------------------- | -------------------- | ---------------------------- |
| Production checklist       | [production-checklist.md](production-checklist.md)                   | DevOps               | Mandatory sign-off           |
| Deployment runbook         | [deployment-runbook.md](deployment-runbook.md)                       | DevOps               | Includes rollback plan       |
| Supabase go-live checklist | [supabase-go-live-checklist.md](supabase-go-live-checklist.md)       | Platform Engineering | Supabase-specific gating     |
| Post-deployment validation | [../POST_DEPLOYMENT_VALIDATION.md](../POST_DEPLOYMENT_VALIDATION.md) | QA                   | Smoke validation & telemetry |

## 3. Observability & Metrics

| Artifact                    | Location                                                 | Owner  | Retention               |
| --------------------------- | -------------------------------------------------------- | ------ | ----------------------- |
| Grafana dashboard export    | `attached_assets/observability/grafana-vX.Y.Z.json`      | DevOps | 90 days                 |
| Prometheus snapshot         | `attached_assets/observability/prometheus-vX.Y.Z.tar.gz` | DevOps | 30 days                 |
| Log drain validation report | `attached_assets/observability/log-drain-vX.Y.Z.md`      | SRE    | Keep until next release |
| Error budget report         | `attached_assets/quality/error-budget-vX.Y.Z.pdf`        | QA     | Rolling 90-day window   |

## 4. CI/CD Evidence

| Artifact                | Location                                                   | Owner        | Notes                        |
| ----------------------- | ---------------------------------------------------------- | ------------ | ---------------------------- |
| CI pipeline run         | GitHub Actions → `.github/workflows/ci.yml`                | Platform Eng | Required to be green         |
| Pre-merge quality suite | GitHub Actions → `.github/workflows/pre-merge-quality.yml` | QA           | Must be green before release |
| Node quality checks     | GitHub Actions → `.github/workflows/node-quality.yml`      | Platform Eng | Lint + typecheck             |
| Supabase deploy log     | GitHub Actions → `.github/workflows/supabase-deploy.yml`   | DevOps       | Attach log to release issue  |

## 5. Communication Assets

| Artifact                   | Location                                   | Owner             | Notes                        |
| -------------------------- | ------------------------------------------ | ----------------- | ---------------------------- |
| Stakeholder email template | `attached_assets/launch-email-template.md` | Product Ops       | Update recipients per launch |
| Support playbook           | `attached_assets/support-handoff.md`       | Support Lead      | Align with release tag       |
| Release announcement copy  | `announcements/` folder                    | Product Marketing | Publish after verification   |

## 6. Compliance & Legal

| Artifact               | Location                                                | Owner              | Notes                   |
| ---------------------- | ------------------------------------------------------- | ------------------ | ----------------------- |
| Privacy policy         | `attached_assets/compliance/privacy-policy-vX.Y.Z.docx` | Legal              | Publish within 72 hours |
| Cookie consent records | `attached_assets/compliance/cookie-consent-vX.Y.Z.csv`  | Legal              | Archive for 24 months   |
| Waiver log             | `attached_assets/compliance/waivers-vX.Y.Z.md`          | Compliance Officer | For approved exceptions |

## Update Process

1. Duplicate this inventory when preparing a release (append version number).
2. Populate “Owner” and “Location” fields for all required artifacts.
3. Attach exported assets to the release tracking issue.
4. After deployment, archive assets in the `attached_assets/` tree and link from
   this document.

Maintaining this inventory keeps audits straightforward and ensures stakeholders
can locate evidence quickly.
