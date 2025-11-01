# Penetration Test & Security Review Plan

## Overview

- **Objective:** Validate the hardened state of ingestion flows, edge functions,
  and privileged Supabase automation before the next major release.
- **Provider:** ShieldGrid Security (NDA executed 2025-02-04).
- **Engagement Window:** **2025-03-10 → 2025-03-21** with retesting the week of
  **2025-04-07**.
- **Stakeholders:**
  - Engineering Lead (owner)
  - Security Champion (coordinator)
  - DevOps & Platform Team (remediation owners)
  - Product Manager (backlog triage)
- **Environments:** Production-like staging (`staging.ibimina.app`) with parity
  Supabase project and feature flags mirroring production defaults.

## Scope

| Area                    | Details                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Supabase Edge Functions | `ingest-sms`, `parse-sms`, `scheduled-reconciliation`, `metrics-exporter`, `momo-statement-poller`, `gsm-heartbeat` |
| Ingestion Pipelines     | Cloudflare Workers invoking Supabase, Supabase queues (`sms_inbox`, `notification_queue`), MoMo poller scheduler    |
| Authentication          | AuthX flows, MFA enrollment/verification, Supabase Row Level Security guards                                        |
| Observability & Secrets | HMAC rotation, log drains, secret storage in Vercel/Cloudflare                                                      |
| Infrastructure          | Cloudflare Pages/Workers routing, Vercel edge middleware, Terraform state                                           |

## Deliverables

1. Daily status note with executed test cases and live findings.
2. Final report (threat model, methodology, detailed findings, reproduction
   steps, CVSS scoring).
3. Retest confirmation of remediated findings.

## Backlog Integration

Penetration test intake feeds directly into the shared **Security & Resilience**
Kanban board.

| Timeline    | Action                                           | Backlog Mapping                             |
| ----------- | ------------------------------------------------ | ------------------------------------------- |
| T-10 days   | Kick-off, confirm scope, freeze deploys          | Jira `SECOPS-201`                           |
| Test window | Log findings within 4 hours, label by severity   | Jira security project (`SECOPS-2xx` series) |
| T+1 day     | Triage meeting, assign owners, set target sprint | Engineering Sprint board (`ENGSEC-*`)       |
| Retest prep | Verify fixes in staging, attach evidence         | Original finding ticket                     |

## Communication Plan

- **Daily:** Async update in `#security-warroom` summarising executed modules,
  open blockers, and ETA for remaining tests.
- **Critical finding:** Page engineering on-call, file incident per SOP-SEC-04.
- **Weekly:** Share summary in leadership update deck with trend of resolved vs.
  outstanding findings.

## Success Criteria

- All critical/high findings remediated or mitigated before production release.
- Medium findings have committed owners and delivery sprints.
- Retest confirms no regressions on previously remediated issues.
- Residual risk register updated with sign-off from CTO and Security Champion.

## Required Inputs

- HMAC secrets rotated within 7 days pre-engagement.
- Test accounts seeded for MoMo, GSM, and SMS ingestion flows.
- Access to Grafana dashboards and alerting webhooks for observability
  validation.
- Latest architecture diagrams and data flow documentation (see
  [`ARCHITECTURE_DOCS_INDEX.md`](../ARCHITECTURE_DOCS_INDEX.md)).

## Exit Criteria

- Final report uploaded to secure drive with restricted access.
- Backlog items created (see `FINDINGS_REGISTER.yaml`) and linked to Jira.
- Lessons learned captured in sprint retro and appended to
  `docs/security/posture-review.md` (to be created after engagement).
