# Go-Live Documentation Hub

Centralised references for the Ibimina SACCO+ production launch. Use this index
to navigate the audit collateral, checklists, and governance material that now
live under `docs/go-live/`.

## Quick Start

| Audience                  | Start Here                                                                                    | Why                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Executive / Product Owner | [Go-Live Executive Summary](executive-summary.md)                                             | Decision-ready overview, readiness score, and risks  |
| Engineering Leads         | [Go-Live Readiness Audit Narrative](readiness-audit.md)                                       | Detailed evidence behind security, QA, and ops gates |
| DevOps / Operations       | [Production Checklist](production-checklist.md) & [Deployment Runbook](deployment-runbook.md) | Step-by-step validation and rollback procedures      |
| Compliance / PMO          | [Gaps & Recommendations](gaps-and-recommendations.md)                                         | Post-launch backlog with owners and timelines        |

## Document Map

### Launch Decision Artifacts

- [Go-Live Executive Summary](executive-summary.md)
- [Readiness audit narrative](readiness-audit.md)
- [Current production status deep-dive](current-status.md)
- [Readiness scorecard](readiness-summary.md)

### Operational Playbooks

- [Production checklist](production-checklist.md)
- [Deployment runbook](deployment-runbook.md)
- [Final validation record](final-validation.md)
- [Implementation completion report](implementation-complete.md)

### Governance & Compliance

- [Release governance & branch protection](release-governance.md)
- [Release checklist](release-checklist.md)
- [Release artifacts inventory](artifacts-inventory.md)
- [Audit issues register](audit-issues.yaml)
- [Visual overview of audit collateral](visual-overview.md)
- [Quick reference cheat sheet](quick-reference.md)

### Supporting Analysis

- [Gaps & recommendations](gaps-and-recommendations.md)
- [Gap summary dashboard](gap-summary.md)

## How This Hub Is Maintained

- New go-live documentation should live inside `docs/go-live/`.
- When adding a new guide, update the table above and link it from the relevant
  section.
- Use Markdown filenames in `kebab-case` for consistency.
- The [release-governance](release-governance.md) guide defines CODEOWNERS
  responsibilities and review expectations for this folder.

## Related Resources

- [CI workflows overview](../CI_WORKFLOWS.md)
- [Security hardening guide](../SECURITY_HARDENING.md)
- [Operational readiness playbook](../OPERATIONAL_READINESS.md)

All previous executive summaries have been deduplicated into
[executive-summary.md](executive-summary.md) to keep stakeholders aligned on a
single source of truth.
