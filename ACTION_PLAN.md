# Final Action Plan — SACCO+ Production Readiness

This plan captures the closing tasks required to sustain the deployed Ibimina
architecture. All foundational workstreams reached "green" status; the remaining
items focus on continuous verification and operational cadence.

## 1. Architecture & Platform Governance

| Objective | Actions | Owner | Evidence |
| --- | --- | --- | --- |
| Lock final topology | Baseline `ARCHITECTURE.md` with Vercel ↔ Supabase ↔ Edge Function diagram; mirror in docs portal index. | Platform | `ARCHITECTURE.md`, `docs/REPORT.md` |
| Preserve RLS guarantees | Keep `pnpm --filter @ibimina/testing run test:rls` in daily cron; persist CI artifacts for audit evidence. | Data | GitHub Actions `ci.yml` logs |
| Publish environment matrix | Maintain `docs/ENVIRONMENT.md` with deploy lanes, secrets, and database links; review monthly. | DevOps | `docs/ENVIRONMENT.md` |

## 2. Deployments & Release Cadence

| Objective | Actions | Owner | Evidence |
| --- | --- | --- | --- |
| Vercel mainline | Use `GO_LIVE_CHECKLIST.md` before each promotion; confirm preview → staging → production pipeline with run command `pnpm run check:deploy`. | Platform | Checklist sign-off in release PRs |
| Supabase migrations | Merge migrations via `supabase db remote commit` and capture drift reports; attach output to release notes. | Data | `docs/RLS_TESTS.md`, release PR attachments |
| Mobile channel parity | Follow `docs/MOBILE_RELEASE.md` for Expo EAS channel promotions and store submissions. | Mobile | EAS build logs |

## 3. Operations & Incident Response

| Objective | Actions | Owner | Evidence |
| --- | --- | --- | --- |
| Log drain health | Review Grafana dashboards weekly, verify alert webhooks, and update `docs/runbooks/SECURITY.md` after each drill. | SRE | Grafana audit trail |
| On-call readiness | Ensure runbooks remain accessible, rotate secrets as per `SECURITY.md`, and test fallback Supabase branch monthly. | Security | Rotation ledger entries |
| Support runway | Keep `docs/go-live/deployment-runbook.md` and `operations-runbook.md` synchronized after each change. | Program | Runbook diff approvals |

## 4. Communication & Reporting

- Publish release notes for each sprint to `docs/releases/` with checklist
  confirmations.
- Summarize verification steps in `CHANGELOG.md` aligned to Vercel deploys and
  Supabase migration batches.
- Circulate monthly status updates with links to latest environment matrix,
  mobile release cadence, and RLS proof exports.

With these controls in place the Ibimina platform remains audit-ready and aligned
with the finalized production architecture.
