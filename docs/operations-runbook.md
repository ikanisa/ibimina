# Operations Runbook — Observability & Preview Deployments

This runbook complements the go-live checklist by documenting how structured logs, preview builds, and regression signals flow through the Ibimina stack. Keep it close during launch rehearsals and real incidents.

## 1. Structured log forwarding
- The runtime logger serialises every event (level, timestamp, request/user context, payload) and forwards it to an external drain **whenever `LOG_DRAIN_URL` is configured**.【F:apps/admin/lib/observability/logger.ts†L16-L170】
- The payload inherits values from `withLogContext`/`updateLogContext`, so request IDs, SACCO IDs, and user IDs are embedded alongside the event name.【F:apps/admin/lib/observability/logger.ts†L8-L14】【F:apps/admin/lib/observability/logger.ts†L107-L124】
- Forwarding happens asynchronously via `fetch` with a guard timeout (default 2000 ms, configurable via `LOG_DRAIN_TIMEOUT_MS`); failures are logged with `console.warn` unless `LOG_DRAIN_SILENT=1` is set for noisy drains.【F:apps/admin/lib/observability/logger.ts†L71-L125】

### Configuration steps
1. Add the following secrets to your deployment environment (and any CI context) before deploying:
   ```
   LOG_DRAIN_URL=https://logs.example.com/ingest
   LOG_DRAIN_TOKEN=<bearer token>
   LOG_DRAIN_SOURCE=ibimina-staff
   LOG_DRAIN_TIMEOUT_MS=2000
   LOG_DRAIN_ALERT_WEBHOOK=https://hooks.example.com/logs
   LOG_DRAIN_ALERT_TOKEN=<optional bearer token>
   ```
   These keys are listed in `.env.example` for convenience.【F:.env.example†L21-L36】
2. Ensure the receiving service accepts JSON payloads with arbitrary keys; each entry includes `environment`, `forwarderSource`, `event`, `level`, and any structured payload fields supplied by the caller.【F:apps/admin/lib/observability/logger.ts†L79-L125】
3. Optional: set `LOG_DRAIN_SILENT=1` during local development to suppress warning spam when the drain is unreachable.

### Verification checklist
- Run the dedicated unit test to confirm the logger emits to the drain when configured:
  ```
  pnpm exec tsx --test tests/unit/logger.test.ts
  ```
  The suite asserts both the HTTP contract and the contextual fields.【F:apps/admin/tests/unit/logger.test.ts†L1-L115】
- Run the CI parity check locally to assert both forwarding and alerting logic work end-to-end:
  ```
  pnpm run verify:log-drain
  ```
  This spins up a stub drain, emits a log entry, and fails if the webhook is not invoked on error.【F:apps/admin/scripts/verify-log-drain.ts†L1-L132】
- Archive the terminal output in the operations reports directory; the latest run is captured in [2025-10-26-log-drain-verification](operations/reports/2025-10/2025-10-26-log-drain-verification.md).【F:docs/operations/reports/2025-10/2025-10-26-log-drain-verification.md†L1-L13】
- After deploying, trigger a representative action (e.g., complete an offline queue sync) and confirm the drain captures the `queue_processed` event with the correct environment tag.
- Verify that the alert webhook receives a `log_drain_failure` payload if the drain endpoint intentionally returns a 500—alerts are throttled by `LOG_DRAIN_ALERT_COOLDOWN_MS` (default 5 minutes).【F:apps/admin/lib/observability/logger.ts†L88-L170】
- If the drain is unreachable, expect `log_drain_failure` warnings in the application logs—investigate network access, credentials, or the downstream service.

## 2. Preview deployments & Supabase data
- The `Preview Deploy` GitHub Action builds the app with pnpm, runs the deployment CLI for the configured self-hosted environment, and comments the preview URL on each pull request once the required secrets are present.【F:.github/workflows/preview.yml†L1-L52】
- Supabase previews should reuse the same logger configuration when credentials are available; unset `LOG_DRAIN_URL` to disable forwarding for throwaway branches.
- Attach Supabase branch database URLs to preview comments manually until Supabase Preview Branches are automated.

## 3. Incident triage tips
- During an outage, start with the latest drain events filtered by `environment` and `requestId` to correlate with Supabase audit rows (`logAudit` writes still run for every privileged action).【F:apps/admin/lib/audit.ts†L1-L29】
- If the drain is silent, verify the GitHub Action/CI logs to confirm secrets are present, then fall back to the application logs while remediating the drain.
- Keep this runbook and the QA checklist linked in release notes so on-call staff can quickly retrace logging, preview, and smoke-test steps.
