# MoMo Statement Poller Failure Runbook

## Overview

The MoMo statement poller runs as a Supabase Edge Function
(`momo-statement-poller`) and creates reconciliation jobs from provider
transaction feeds. Recent changes add retry + circuit breaker protections and
structured JSON logging (via `serveWithObservability`) to support Grafana/Loki
dashboards and Prometheus metrics.

## Detection

- **Grafana dashboards**: `ibimina_momo_poller_up` and
  `ibimina_momo_poller_latency_seconds` panels under Operations.
- **Alerts**: `ibimina_momo_poller_latency_seconds` or `momo_poll_failure`
  metric spikes.
- **Logs**: Search for `poller.run.failure` or `poller.circuit_open` in the log
  drain.

## Immediate Actions

1. Confirm the alerting poller ID from the log payload or metric labels.
2. Check recent logs for `poller.fetch.retry_failed` and
   `poller.fetch.exhausted` to see if the circuit breaker opened.
3. Validate upstream provider availability (status page/API ping) if retries are
   exhausted.
4. If the provider is healthy, clear stale cursors for the affected poller row
   in `app.momo_statement_pollers` (set `cursor` to `null`) to trigger a full
   re-scan.

## Remediation Steps

- **Circuit breaker open**: Wait for the cooldown (60s backoff) to lapse; if
  urgent, temporarily disable the poller by setting `status` to `PAUSED` and
  re-enable once upstream is stable.
- **Repeated failures**: Rotate credentials (`auth_header`) and redeploy the
  function with updated secrets; monitor `poller.run.success` logs afterward.
- **Stuck jobs**: Use `app.reconciliation_jobs` to find jobs stuck in `PENDING`
  and re-queue via the admin CLI if necessary.

## Verification

- Trigger the function manually:
  - `supabase functions invoke momo-statement-poller --local`
  - Confirm the response includes non-zero `processed/inserted/jobs` when data
    exists.
- Verify logs show `poller.run.success` and metrics `momo_statements_polled`
  increment for the affected poller.
