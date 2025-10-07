# Security, Observability & Automation Enhancements

## Field-Level Encryption
- Sensitive member and payment identifiers (MSISDN, National ID) are encrypted using AES-GCM prior to storage.
- Hash columns (SHA-256) back masked values for deterministic lookups without exposing plaintext.
- Masked views are returned to the UI, ensuring only obfuscated data is rendered client-side.
- Encryption keys are sourced from `FIELD_ENCRYPTION_KEY` (32-byte base64) and provisioned via Terraform secrets.

## Rate Limiting
- `consume_rate_limit` Postgres function tracks windowed counters per key in `rate_limit_counters`.
- Edge functions wrap business logic with `enforceRateLimit`, defaulting to 200 SMS/min and 100 statement rows/minute.
- Rate limit configuration is controlled through environment variables (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`).

## Audit Trail
- All privileged actions write structured entries to `audit_logs` via the shared `writeAuditLog` helper.
- New `/admin/audit` page provides filtering, search, and JSON diff inspection for system administrators.
- System-generated actions fall back to a zero UUID actor identifier for traceability.

## Metrics & Alerting
- `system_metrics` table aggregates key counters (SMS ingestion, escalations, payment actions) via the `increment_metric` helper.
- Dashboard renders “Operational telemetry” cards and highlights flagged SMS volume for admins.
- CloudWatch log group and Terraform-managed S3 bucket centralise edge function output and report archives.

## Automation Hooks
- `scheduled-reconciliation` edge function escalates aged pending payments into the `notification_queue` for follow-up.
- SMS review tooling allows manual reprocessing or flagging with audit and metric capture.
- Infrastructure-as-code blueprint seeds secret rotation, encrypted storage, and log retention policies.
- Regex-first SMS parsing now falls back to OpenAI Responses API structured outputs (`OPENAI_RESPONSES_MODEL`) to ensure deterministic JSON with auditable model provenance captured in metrics.

Refer to `supabase/functions/_shared/*.ts` for reusable primitives and `infra/terraform/main.tf` for deployment hardening.

## Future Enhancements
- Planned WhatsApp and email notification adapters will subscribe to the `notification_queue` events to broadcast reconciliations and settlement reminders once policy approvals are in place.
- MoMo statement polling workers and GSM heartbeat monitors are slated for future phases to further automate ingestion without manual intervention.
- Anomaly detection experiments (variance spikes, contribution lapses) remain optional, leveraging the existing metrics pipeline for alert thresholds rather than introducing new AI services prematurely.
