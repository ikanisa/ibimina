# Release Testing Cadence & Quality Gates

This document defines the validation activities that must complete before
promoting a change to production. It focuses on staging and pre-production
environments shared across the monorepo.

## Testing Calendar

| Frequency                              | Window                                                   | Owner             | Scope                                                                         |
| -------------------------------------- | -------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| Per commit                             | CI pipeline (`lint`, `typecheck`, `unit`, `integration`) | Feature author    | All packages touched by the change                                            |
| Daily (Mon–Sat)                        | 09:00 & 16:00 EAT                                        | Release captain   | Smoke tests against staging admin/client apps; Supabase migration drift check |
| Twice weekly (Tue & Thu)               | 14:00 EAT                                                | QA lead           | Regression suite (`pnpm test:e2e`, accessibility spot-check, mobile sanity)   |
| Weekly (Fri)                           | 11:00 EAT                                                | Platform SRE      | Load & chaos suite (`pnpm test:performance`) targeting ingestion/edge flows   |
| Monthly (First Wed)                    | 15:00 EAT                                                | Security champion | Auth hardening checks, secret rotation review, backlog audit                  |
| Quarterly (Aligned with release train) | Kick-off week                                            | CTO & Product     | Penetration test read-out, compliance attestations                            |

## Release Gate Checklist

A release candidate may proceed to production only if all criteria below are
satisfied:

1. **CI Green** – All pipeline steps succeed (`pnpm run check:deploy`).
2. **Database migrations** – Drift report clean, migration replay executed on
   staging within last 48 hours.
3. **Observability baselines** – No unresolved alerts in Grafana (`ibimina`
   folder) for the past 24 hours; log drain ingestion healthy.
4. **Load & chaos** – Latest `pnpm test:performance` run stored in
   `/docs/testing/reports` with success rate ≥97% and p99 latency ≤ 2.5s.
5. **Security regressions** – No open critical/high findings in
   `FINDINGS_REGISTER.yaml`; pending medium items have mitigation owners and
   dates.
6. **Product sign-off** – Release captain confirms demo checklist, translations,
   and feature flag notes in release issue template.
7. **Support readiness** – Changelog updated, runbook entries validated, on-call
   briefed on notable risks.

## Success Criteria

- **Unit/Integration:** 100% pass rate. Failures block release until resolved.
- **E2E:** Minimum 95% pass rate with documented rationale for any skipped
  tests.
- **Load:** Success rate ≥97%, p99 latency ≤2.5s, zero hard failures from edge
  functions.
- **Chaos:** Expected failure scenarios must return non-2xx status codes;
  recovery paths verified within 60 seconds.
- **Security:** New findings triaged within 24 hours, retest tickets scheduled
  within the next sprint.

## Reporting & Evidence Storage

- Store raw command output under
  `docs/testing/reports/<YYYY-MM-DD>-<suite>.log`.
- Release captain compiles summary in release issue template referencing stored
  logs.
- Metrics snapshots (Grafana, Sentry) exported as PNG and attached to the
  release issue.

## Escalation

- **Blocking issues** – Escalate in `#release-warroom`, tag CTO if ETA exceeds 4
  hours.
- **Performance regressions** – Open incident if success rate <95% or latency
  budgets exceeded for two consecutive runs.
- **Security deviations** – Trigger playbook `SOP-SEC-04` and pause deploys
  until resolved.

## Tooling References

- Load/chaos scripts:
  [`apps/platform-api/tests/performance`](../../apps/platform-api/tests/performance)
- CI pipeline definition: [`CI_WORKFLOWS.md`](../CI_WORKFLOWS.md)
- Operations runbook: [`docs/operations-runbook.md`](../operations-runbook.md)
- Security plan:
  [`docs/security/penetration-test-plan.md`](../security/penetration-test-plan.md)
