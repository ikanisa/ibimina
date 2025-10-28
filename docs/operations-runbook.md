# Operations Runbook — Observability & Preview Deployments

This runbook complements the go-live checklist by documenting how structured
logs, preview builds, and regression signals flow through the Ibimina stack.
Keep it close during launch rehearsals and real incidents.

## 1. Structured log forwarding

- The runtime logger serialises every event (level, timestamp, request/user
  context, payload) and forwards it to an external drain **whenever
  `LOG_DRAIN_URL` is
  configured**.【F:apps/admin/lib/observability/logger.ts†L16-L170】
- The payload inherits values from `withLogContext`/`updateLogContext`, so
  request IDs, SACCO IDs, and user IDs are embedded alongside the event
  name.【F:apps/admin/lib/observability/logger.ts†L8-L14】【F:apps/admin/lib/observability/logger.ts†L107-L124】
- Forwarding happens asynchronously via `fetch` with a guard timeout (default
  2000 ms, configurable via `LOG_DRAIN_TIMEOUT_MS`); failures are logged with
  `console.warn` unless `LOG_DRAIN_SILENT=1` is set for noisy
  drains.【F:apps/admin/lib/observability/logger.ts†L71-L125】

### Configuration steps

1. Add the following secrets to your deployment environment (and any CI context)
   before deploying:
   ```
   LOG_DRAIN_URL=https://logs.example.com/ingest
   LOG_DRAIN_TOKEN=<bearer token>
   LOG_DRAIN_SOURCE=ibimina-staff
   LOG_DRAIN_TIMEOUT_MS=2000
   LOG_DRAIN_ALERT_WEBHOOK=https://hooks.example.com/logs
   LOG_DRAIN_ALERT_TOKEN=<optional bearer token>
   ```
   These keys are listed in `.env.example` for
   convenience.【F:.env.example†L21-L36】
2. Ensure the receiving service accepts JSON payloads with arbitrary keys; each
   entry includes `environment`, `forwarderSource`, `event`, `level`, and any
   structured payload fields supplied by the
   caller.【F:apps/admin/lib/observability/logger.ts†L79-L125】
3. Optional: set `LOG_DRAIN_SILENT=1` during local development to suppress
   warning spam when the drain is unreachable.

### Verification checklist

- Run the dedicated unit test to confirm the logger emits to the drain when
  configured:
  ```
  pnpm exec tsx --test tests/unit/logger.test.ts
  ```
  The suite asserts both the HTTP contract and the contextual
  fields.【F:apps/admin/tests/unit/logger.test.ts†L1-L115】
- Run the CI parity check locally to assert both forwarding and alerting logic
  work end-to-end:
  ```
  pnpm run verify:log-drain
  ```
  This spins up a stub drain, emits a log entry, and fails if the webhook is not
  invoked on error.【F:apps/admin/scripts/verify-log-drain.ts†L1-L132】
- Archive the terminal output in the operations reports directory; the latest
  run is captured in
  [2025-10-26-log-drain-verification](operations/reports/2025-10/2025-10-26-log-drain-verification.md).【F:docs/operations/reports/2025-10/2025-10-26-log-drain-verification.md†L1-L13】
- After deploying, trigger a representative action (e.g., complete an offline
  queue sync) and confirm the drain captures the `queue_processed` event with
  the correct environment tag.
- Verify that the alert webhook receives a `log_drain_failure` payload if the
  drain endpoint intentionally returns a 500—alerts are throttled by
  `LOG_DRAIN_ALERT_COOLDOWN_MS` (default 5
  minutes).【F:apps/admin/lib/observability/logger.ts†L88-L170】
- If the drain is unreachable, expect `log_drain_failure` warnings in the
  application logs—investigate network access, credentials, or the downstream
  service.

## 2. Preview deployments & Supabase data

- The `Preview Deploy` GitHub Action builds the app with pnpm, runs the
  deployment CLI for the configured self-hosted environment, and comments the
  preview URL on each pull request once the required secrets are
  present.【F:.github/workflows/preview.yml†L1-L52】
- Supabase previews should reuse the same logger configuration when credentials
  are available; unset `LOG_DRAIN_URL` to disable forwarding for throwaway
  branches.
- Attach Supabase branch database URLs to preview comments manually until
  Supabase Preview Branches are automated.

## 3. Incident triage tips

- During an outage, start with the latest drain events filtered by `environment`
  and `requestId` to correlate with Supabase audit rows (`logAudit` writes still
  run for every privileged action).【F:apps/admin/lib/audit.ts†L1-L29】
- If the drain is silent, verify the GitHub Action/CI logs to confirm secrets
  are present, then fall back to the application logs while remediating the
  drain.
- Keep this runbook and the QA checklist linked in release notes so on-call
  staff can quickly retrace logging, preview, and smoke-test steps.

## 4. Metric anomaly detectors

The anomaly detector Supabase function (`metrics-anomaly-detector`) samples
counters from `system_metrics` to build rolling baselines, then emits
`anomaly_detected.<signal>` events and webhook alerts when activity deviates
from normal
ranges.【F:supabase/functions/metrics-anomaly-detector/index.ts†L1-L260】【F:supabase/functions/metrics-anomaly-detector/index.ts†L262-L394】 The
detector ships with two env knobs:

- `METRIC_SAMPLE_RETENTION_HOURS` (default **168**) – how long to retain the
  rolling window samples used for z-score
  detection.【F:supabase/functions/metrics-anomaly-detector/index.ts†L11-L14】【F:supabase/migrations/20250203120000_metrics_anomaly_samples.sql†L1-L15】
- `ANOMALY_ALERT_SUPPRESSION_MINUTES` (default **60**) – cooldown window before
  the same `signal` raises another webhook
  notification.【F:supabase/functions/metrics-anomaly-detector/index.ts†L15-L20】【F:supabase/functions/metrics-anomaly-detector/index.ts†L222-L244】

### Signals and thresholds

| Signal                       | What it watches                   | Trigger rule                                                                                                                                                                                                                               |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sms_ingested_rate`          | Inbound SMS processing throughput | Z-score spike/drop on a 12-sample (≈1 h) window; alerts if rate drops >85 % or spikes >3× baseline.【F:supabase/functions/metrics-anomaly-detector/index.ts†L42-L115】【F:supabase/functions/metrics-anomaly-detector/index.ts†L274-L356】 |
| `sms_reprocess_failure_rate` | SMS retry failures                | Spike detection when retries exceed historical mean by >3σ (minimum 1 message).【F:supabase/functions/metrics-anomaly-detector/index.ts†L47-L115】【F:supabase/functions/metrics-anomaly-detector/index.ts†L274-L335】                     |
| `payment_action_rate`        | Payment settlement automation     | Zero-activity + spike detection over the same rolling window to surface stalls or bursts.【F:supabase/functions/metrics-anomaly-detector/index.ts†L52-L115】【F:supabase/functions/metrics-anomaly-detector/index.ts†L274-L356】           |
| `sms_queue_backlog`          | Pending SMS awaiting parsing      | Absolute threshold ≥200 queued rows (critical).【F:supabase/functions/metrics-anomaly-detector/index.ts†L117-L153】【F:supabase/functions/metrics-anomaly-detector/index.ts†L358-L394】                                                    |
| `notification_failures`      | Failed automation webhooks        | Absolute threshold ≥5 failed notifications (warning).【F:supabase/functions/metrics-anomaly-detector/index.ts†L137-L153】【F:supabase/functions/metrics-anomaly-detector/index.ts†L358-L394】                                              |
| `payments_pending`           | Unallocated or pending payments   | Absolute threshold ≥25 open items (warning).【F:supabase/functions/metrics-anomaly-detector/index.ts†L145-L153】【F:supabase/functions/metrics-anomaly-detector/index.ts†L358-L394】                                                       |

Each anomaly increments `anomaly_detected.<signal>` in `system_metrics` (exposed
as `ibimina_system_metric_total{event="anomaly_detected.*"}`) and enqueues an
`ANOMALY_DETECTED` notification payload for downstream webhooks, keeping Grafana
and incident tooling in
sync.【F:supabase/functions/metrics-anomaly-detector/index.ts†L205-L220】【F:supabase/functions/metrics-anomaly-detector/index.ts†L246-L271】【F:infra/metrics/dashboards/ibimina-operations.json†L1-L236】

### Scheduling & verification

1. Deploy the function and create a Supabase cron job (5-minute cadence
   recommended) once `metrics-anomaly-detector` is available:
   ```bash
   supabase functions deploy metrics-anomaly-detector
   supabase functions schedule metrics-anomaly-detector "*/5 * * * *"
   ```
2. Seed baseline samples before enabling paging by invoking the function
   manually (either via
   `supabase functions invoke metrics-anomaly-detector --no-verify-jwt` or by
   hitting the HTTPS endpoint with an HMAC-signed request). Confirm new rows
   appear in `system_metric_samples` to validate
   sampling.【F:supabase/functions/metrics-anomaly-detector/index.ts†L187-L220】【F:supabase/migrations/20250203120000_metrics_anomaly_samples.sql†L1-L15】
3. Inspect the Grafana “Anomalies (1h)” stat and per-signal timeseries panels to
   ensure Prometheus is ingesting `anomaly_detected.*`
   counters.【F:infra/metrics/dashboards/ibimina-operations.json†L182-L236】 Import
   the dashboard via `infra/metrics/dashboards/ibimina-operations.json` if it is
   not already
   provisioned.【F:infra/metrics/dashboards/ibimina-operations.json†L1-L236】

### Response playbook

- **SMS backlog**: clear parsing failures in the admin console, re-run
  `sms-ai-parse`, and monitor `sms_ingested_rate` returning to baseline before
  clearing the alert.
- **Notification failures**: check `notification_queue` for stuck jobs and
  retry; confirm downstream webhooks responded 2xx before acking.
- **Payment stalls**: review reconciliation automation logs, ensure banks
  processed statements, and re-run the `scheduled-reconciliation` function if
  required.
- **Detector tuning**: adjust thresholds or window sizes by editing
  `RATE_DETECTORS`/`buildThresholdDetectors` if the environment’s normal load
  changes appreciably; bump `METRIC_SAMPLE_RETENTION_HOURS` for slower-moving
  signals.【F:supabase/functions/metrics-anomaly-detector/index.ts†L42-L153】【F:supabase/functions/metrics-anomaly-detector/index.ts†L115-L153】 Document
  any overrides in release notes and share updated values with the on-call
  rotation.
