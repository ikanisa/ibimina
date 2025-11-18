# Observability Dashboards & On-call Escalation

This guide documents the Grafana dashboards provisioned under `infra/metrics`
and how alerts flow to the on-call rotation. Keep it alongside the primary
[operations runbook](../operations-runbook.md) when responding to incidents.

## Stack topology

| Component    | Location                          | Purpose                                                  |
| ------------ | --------------------------------- | -------------------------------------------------------- |
| Prometheus   | `infra/metrics/prometheus.yml`    | Scrapes Supabase edge metrics and evaluates alert rules. |
| Alertmanager | `infra/metrics/alertmanager.yml`  | Routes alerts to Slack and PagerDuty based on severity.  |
| Grafana      | `infra/metrics/dashboards/*.json` | Renders operational dashboards for the Ibimina platform. |

Start the stack locally with:

```bash
cd infra/metrics
SLACK_WEBHOOK_URL=... PAGERDUTY_ROUTING_KEY=... docker compose up -d
```

Prometheus listens on `http://localhost:9090`, Grafana on
`http://localhost:3001`, and Alertmanager on `http://localhost:9093`.

## Dashboards

### Edge Functions Health

File: `infra/metrics/dashboards/edge-functions.json`

- **Metrics exporter health** stat shows `ibimina_health_up`; it should be `1`.
- **Throughput (5 min)** graphs the increase of key function counters
  (`sms_ingested`, `sms_reprocessed`, `payment_action`, `mfa_email_sent`). Use
  it to confirm deploys and retries are flowing.
- **Failure counts (30 min)** surfaces error events such as `mfa_email_failure`,
  `sms_reprocess_failed`, and `momo_poll_failure`. Spikes should trigger alert
  investigation.
- **SMS gateway availability** tracks `ibimina_sms_gateway_up` and correlates
  connectivity failures with escalations from the field teams.

### Supabase Health

File: `infra/metrics/dashboards/supabase-health.json`

- **Pending SMS / notifications / payments** stat cards watch queue gauges and
  mirror the backlog thresholds captured in the go-live checklist.
- **MoMo poller latency & availability** panels trend
  `ibimina_momo_poller_latency_seconds` and `ibimina_momo_poller_up` for each
  configured worker.
- **Anomalies detected (1 h)** aggregates
  `ibimina_system_metric_total{event=~"anomaly_detected.*"}` to verify the
  anomaly detector is sampling and alerting.

### CI Observability

File: `infra/metrics/dashboards/ci-observability.json`

- **Pipeline success/failure totals** sum the last 24 h of `ci.pipeline.success`
  and `ci.pipeline.failure` events from the metrics exporter. Ensure GitHub
  Actions call the `increment_metric` RPC during each deployment job to keep
  these panels populated.
- **Playwright success/failure totals** chart 24 h windows of
  `ci.playwright.success` and `ci.playwright.failure`. The Playwright CI job
  should increment these counters when tests finish.
- **CI event volume** provides a 6 h trend of all `ci.*` events so you can spot
  anomalies, while the **Top CI signals** table highlights the noisiest labels
  over the last day.

## Alert rules & notification routing

Alert definitions live in `infra/metrics/rules/ibimina.rules.yml` and are loaded
by Prometheus (`rule_files` directive). The key rules are:

- **EdgeFunctionLatencyHigh** — fires when the 5 min max of
  `ibimina_momo_poller_latency_seconds` exceeds 5 s for 10 min.
- **EdgeFunctionErrorRate** — fires when the 15 min error ratio across Supabase
  functions stays above 10 % (failures vs. successes).
- **PlaywrightFailures** — fires when any `ci.playwright.failure` event is
  observed within 30 min.

Alertmanager fans out notifications as follows:

- Warnings (`severity="warning"`) post to `#ibimina-alerts` via the Slack
  webhook.
- Critical alerts fan out to Slack **and** PagerDuty (`PAGERDUTY_ROUTING_KEY`).
  The payload links back to this document for context.

### Auth & admin monitoring

- Import `infra/metrics/dashboards/supabase-health.json` to watch queue gauges
  and overlay auth-specific panels for MFA delivery and login flow health. Add a
  stat panel for
  `increase(ibimina_system_metric_total{event="mfa_email_sent"}[15m])` vs.
  `increase(...{event="mfa_email_failure"}[15m])` to spot degraded OTP delivery.
- Enable the new Prometheus alerts in `infra/metrics/rules/ibimina.rules.yml`:
  - `SupabaseMfaFailureRate` (warning if failures >5% for 10 min) to catch
    Resend/SMTP issues early.
  - `SupabaseMfaSendStall` (critical if zero sends for 30 min) to flag frozen
    auth flows.
  - `AdminAppHealthDown` (critical if the metrics-exporter is unreachable for
    5 min) as a proxy for admin route outages; pair with the staff app
    `/api/healthz` check in external uptime monitors.
- Route these alerts to the same Slack/PagerDuty channels as edge-function
  alerts so the on-call rotation is paged for login or staff-console failures.

## On-call escalation path

1. **Slack acknowledgement (Primary)**
   - The primary engineer for the week must acknowledge Slack alerts within
     10 min.
   - Use the dashboard panels above to validate impact and gather context.
2. **PagerDuty escalation (Secondary)**
   - If a critical alert is not acknowledged in Slack within 10 min, PagerDuty
     will page the secondary on-call.
   - Secondary reviews dashboards, Prometheus queries, and Supabase logs, then
     coordinates mitigation with the primary.
3. **Incident command handoff**
   - For production-impacting incidents >30 min, assign an incident commander
     and start a shared notes doc (include relevant Grafana panels and
     Prometheus query links).
   - Notify leadership via the existing incident channel once impact and ETA are
     understood.
4. **Resolution & follow-up**
   - Document the timeline, root cause, and permanent corrective actions in
     `docs/operations/incidents.md`.
   - Update alert thresholds or dashboard annotations if tuning was required.

## Validating instrumentation

- Run the local Prometheus stack and execute a sample query, e.g.:
  `increase(ibimina_system_metric_total{event="ci.playwright.failure"}[5m])`.
- Trigger synthetic metrics by invoking `supabase functions invoke` for the
  relevant edge functions or by running CI workflows with the metrics RPC calls
  enabled.
- Confirm alerts appear in the Alertmanager UI under
  `http://localhost:9093/#/alerts` when thresholds are artificially breached.

## Troubleshooting

- **No data points:** verify Prometheus can reach the Supabase metrics exporter
  (check `ibimina_health_up`).
- **Slack notifications missing:** ensure `SLACK_WEBHOOK_URL` is exported before
  starting the stack; Alertmanager logs errors to stdout.
- **PagerDuty not paging:** confirm the routing key is valid and the service is
  configured to auto-acknowledge resolved events.
