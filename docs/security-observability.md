# Security, Observability & Automation Enhancements

## Field-Level Encryption

- Sensitive member and payment identifiers (MSISDN, National ID) are encrypted
  using AES-GCM prior to storage.
- Hash columns (SHA-256) back masked values for deterministic lookups without
  exposing plaintext.
- Masked views are returned to the UI, ensuring only obfuscated data is rendered
  client-side.
- Encryption keys are sourced from `FIELD_ENCRYPTION_KEY` (32-byte base64) and
  provisioned via Terraform secrets.

## Rate Limiting

- `consume_rate_limit` Postgres function tracks windowed counters per key in
  `rate_limit_counters`.
- Edge functions wrap business logic with `enforceRateLimit`, defaulting to 200
  SMS/min and 100 statement rows/minute.
- Rate limit configuration is controlled through environment variables
  (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`).

## Audit Trail

- All privileged actions write structured entries to `audit_logs` via the shared
  `writeAuditLog` helper.
- New `/admin/audit` page provides filtering, search, and JSON diff inspection
  for system administrators.
- System-generated actions fall back to a zero UUID actor identifier for
  traceability.

## Metrics & Alerting

- `system_metrics` table aggregates key counters (SMS ingestion, escalations,
  payment actions) via the `increment_metric` helper.
- Dashboard renders “Operational telemetry” cards and highlights flagged SMS
  volume for admins.
- CloudWatch log group and Terraform-managed S3 bucket centralise edge function
  output and report archives.

## Multi-factor Authentication (TOTP)

- Enrollment happens via Profile → Security; the server issues an otpauth URI,
  encrypted secret, and validates two consecutive codes before persisting.
- Secrets are stored with AES-GCM (`KMS_DATA_KEY`), backup codes are PBKDF2
  hashed with a pepper (`BACKUP_PEPPER`), and never displayed again after
  enrollment.
- Verification supports ±30s drift, caches the last successful timestep to
  prevent replay, and throttles attempts through `consume_rate_limit`.
- Trusted-device cookies (signed by `TRUSTED_COOKIE_SECRET`) bind to the user
  agent and /24 IP prefix, and can be revoked from the security page; they
  refresh the MFA session cookie automatically.
- Audit events: `MFA_ENROLLMENT_STARTED`, `MFA_ENROLLED`, `MFA_FAILED`,
  `MFA_SUCCESS`, `MFA_BACKUP_SUCCESS`, `MFA_EMAIL_CODE_SENT`,
  `MFA_EMAIL_VERIFIED`, `MFA_EMAIL_FAILED`, `MFA_PASSKEY_ENROLLMENT_STARTED`,
  `MFA_PASSKEY_ENROLLED`, `MFA_PASSKEY_SUCCESS`, `MFA_PASSKEY_FAILED`,
  `MFA_PASSKEY_DELETED`, `MFA_DISABLED`, `MFA_RESET`,
  `MFA_TRUSTED_DEVICE_REVOKE`.
- Admins can reset MFA via the new break-glass API, which clears secrets, backup
  hashes, trusted devices, and records the action in `audit_logs`.

### Local Prometheus/Grafana stack

1. Serve the metrics exporter locally:
   ```
   supabase functions serve metrics-exporter --env-file supabase/.env.production
   ```
   The endpoint exposes Prometheus-compatible text at
   `http://localhost:54321/functions/v1/metrics-exporter`; include `x-timestamp`
   (UTC ISO) and
   `x-signature = HMAC_SHA256(HMAC_SHARED_SECRET, <ts>GET:/functions/v1/metrics-exporter)`
   headers when scraping.
2. Bootstrap Prometheus + Grafana (ships with scrape/dashboards pre-wired):

   ```
   cd infra/metrics
   docker compose up -d
   ```

   - Prometheus: http://localhost:9090 (scrapes `ibimina_*` metrics)
   - Grafana: http://localhost:3001 (default admin/admin) → Dashboard “Ibimina
     Operations Overview”.

New gauges include:

- `ibimina_sms_queue_pending` / `_failed` – monitors SMS ingestion backlog.
- `ibimina_notification_queue_pending` / `_failed` – surfacing automation queue
  saturation.
- `ibimina_payments_pending` – highlights unallocated or pending payments.
- `ibimina_system_metric_total{event="…"}` – counters map back to
  `system_metrics` events (e.g. `sms_ingested`, `recon_escalations`).

### Alert thresholds

- **SMS backlog**: warn at >25 pending for 5 minutes; page at >50
  (`ibimina_sms_queue_pending`).
- **Notification backlog**: warn at >10 pending or any failed
  (`ibimina_notification_queue_*`).
- **Reconciliation backlog**: alert if `ibimina_payments_pending` exceeds 20
  for >15 minutes.
- **Health check**: alert if `ibimina_health_up` reports 0 (metrics exporter
  failing).

Configure the thresholds in Grafana or downstream alert manager after the
Prometheus datasource is provisioned
(`infra/metrics/datasources/datasource.yml`).

## Automation Hooks

- `scheduled-reconciliation` edge function escalates aged pending payments into
  the `notification_queue` for follow-up.
- SMS review tooling allows manual reprocessing or flagging with audit and
  metric capture.
- Infrastructure-as-code blueprint seeds secret rotation, encrypted storage, and
  log retention policies.
- Regex-first SMS parsing now falls back to OpenAI Responses API structured
  outputs (`OPENAI_RESPONSES_MODEL`) to ensure deterministic JSON with auditable
  model provenance captured in metrics.

Refer to `supabase/functions/_shared/*.ts` for reusable primitives and
`infra/terraform/main.tf` for deployment hardening.

## Future Enhancements

- Planned WhatsApp and email notification adapters will subscribe to the
  `notification_queue` events to broadcast reconciliations and settlement
  reminders once policy approvals are in place.
- MoMo statement polling workers and GSM heartbeat monitors are slated for
  future phases to further automate ingestion without manual intervention.
- Anomaly detection experiments (variance spikes, contribution lapses) remain
  optional, leveraging the existing metrics pipeline for alert thresholds rather
  than introducing new AI services prematurely.

## Feature Flag Operations

- Flags live in Supabase `configuration` table (JSONB `feature_flags` key).
  Toggle via SQL or the `/admin` panel once exposed.
- Always stage toggles by environment: update staging first, verify, then apply
  to production; capture the change in `audit_logs`.
- Document every toggle in release notes and link to the Grafana dashboard
  section tracking backlog/automation so operations know which metrics validate
  the change.
- CI pipeline should include a smoke test to ensure mandatory flags have
  explicit values before deployment (follow-up automation tracked in Phase 4).
