# Operations Runbook

Use this runbook during day-to-day operations, release windows, and incident
response for the Ibimina platform.

## 1. Service Objectives

| Area                 | SLI/SLO                                            | Alert Source                       |
| -------------------- | -------------------------------------------------- | ---------------------------------- |
| Auth availability    | < 5% failed logins over 15 min                     | Supabase audit logs + logger drain |
| Payment ingest       | No backlog > 30 min in `payments_queue`            | `metrics-anomaly-detector` signal  |
| Staff console uptime | 99.5% availability during business hours           | Vercel checks + Pingdom (external) |
| Error budget         | < 2% requests logged at `error` level per 24 hours | Structured log drain alerts        |

Log drains emit to the configured webhook whenever the admin app sees anomalies
or forwarding failures; Supabase anomaly detectors backstop the payment and SMS
pipelines.【F:apps/admin/lib/observability/logger.ts†L1-L170】【F:supabase/functions/metrics-anomaly-detector/index.ts†L1-L260】

## 2. Daily Checklist

1. **Review Vercel deployments** — confirm `main` is green and matched to the
   latest release tag.
2. **Check Supabase monitors** — verify scheduled functions ran in the last hour
   and no cron jobs are lagging (`supabase functions list`).
3. **Inspect anomaly dashboards** — open Grafana dashboard
   `infra/metrics/dashboards/ibimina-operations.json` to confirm no red
   panels.【F:infra/metrics/dashboards/ibimina-operations.json†L1-L236】
4. **Log drain health** — ensure the structured log webhook last pinged within 5
   minutes (`make test` triggers alert simulations during business hours).

## 3. Release Process

1. Run the preflight pipeline:
   ```bash
   make quickstart
   make ready           # wraps pnpm run check:deploy
   ```
2. Generate release notes in the PR description, include Supabase migration
   status, and capture the preview URL from `pnpm run preview:vercel`.
3. After approvals, deploy to production:
   ```bash
   pnpm run release     # or `make release`
   ```
   The script reruns `check:deploy` before calling `vercel deploy --prod` with
   the `apps/admin` project, guaranteeing the same binaries reach
   production.【F:package.json†L6-L88】【F:Makefile†L1-L104】
4. Post-deploy validation:
   - Hit `/api/healthz` on the staff console and `/api/health` on the member
     PWA.
   - Run `pnpm --filter @ibimina/admin run verify:log-drain` to confirm log
     forwarding.【F:package.json†L6-L80】
   - Spot check Supabase jobs (`supabase db list branches`,
     `supabase functions list`).

## 4. Observability & Alerting

- **Structured logs**: `apps/admin/lib/observability/logger.ts` forwards every
  event (with request/user context) to the configured drain. Failures trigger
  the alert webhook defined in `LOG_DRAIN_ALERT_WEBHOOK`.
- **Metrics**: Supabase functions publish counters to `system_metrics` and the
  anomaly detector generates alerts when baselines drift. Import
  `infra/metrics/dashboards/ibimina-operations.json` into Grafana to visualise
  SMS ingest, reconciliation, and notification health.
- **Tracing**: Next.js instrumentation is wired through
  `apps/admin/instrumentation.ts` to attach request IDs to Supabase
  calls.【F:apps/admin/instrumentation.ts†L1-L6】

## 5. Incident Response

1. **Triage**
   - Check the log drain for `error` or `log_drain_failure` events in the last 5
     minutes.
   - Verify Supabase status and run `supabase logs tail --functions` if Edge
     functions are failing.
2. **Mitigation**
   - For payment backlogs, rerun the worker manually:
     `pnpm --filter @ibimina/platform-api run build && node dist/workers/momo-poller.js`.【F:apps/platform-api/src/index.ts†L1-L26】
   - For auth issues, disable new device enrollment by toggling the
     `trustedDevice` feature flag in the admin console (`/admin/feature-flags`).
   - For PWA caching bugs, redeploy to Vercel with `pnpm run release -- --force`
     to bust service worker caches.
3. **Communication**
   - Update #ops-alerts Slack channel with impact, mitigation, and ETA.
   - File a post-incident note in
     `docs/operations/reports/<YYYY-MM>/<date>-<slug>.md`.

## 6. Runbook Cross-Links

- [Architecture Runbook](ARCHITECTURE.md) — component boundaries and data flow.
- [Security Runbook](SECURITY.md) — hardening requirements and rotation cadence.
- [Mobile Release Runbook](MOBILE_RELEASE.md) — Expo/EAS deployment steps.

Keep this document updated whenever release scripts or alerting contracts
change.
