# GSM Heartbeat Failure Runbook

## Overview

The GSM heartbeat worker (`gsm-heartbeat`) monitors connectivity for SMS
gateways and posts health metrics to Supabase. Interruptions risk missing SMS
ingestion and MoMo parsing alerts.

## Detection

- **Grafana**: `gsm_heartbeat_up` panel showing a drop to `0` for any gateway.
- **Logs**: Look for `gsm-heartbeat` errors in the log drain or missing
  `edge.request.complete` entries.
- **Queues**: Rising backlog in `sms_inbox` or `notification_queue` tables.

## Immediate Actions

1. Identify the failing gateway ID and region from dashboard labels.
2. Check recent deployments or configuration changes on the GSM modem (power,
   SIM balance, network coverage).
3. Validate Supabase reachability from the modem network (DNS, firewall rules).
4. If multiple gateways fail simultaneously, confirm upstream network outages
   with the ISP.

## Remediation Steps

- **Restart the worker**:
  `pnpm --filter @ibimina/platform-api run build && node dist/workers/gsm-heartbeat.js`.
- **Rotate credentials**: Regenerate service-role keys and update the worker
  environment if authentication errors appear in logs.
- **Failover**: Re-route SMS receive numbers to a healthy gateway if available
  while the affected modem is triaged.

## Verification

- Confirm `gsm_heartbeat_up{gateway="..."}` returns `1` within 2 polling
  intervals.
- Validate that new messages are inserted into `sms_inbox` and `parse-sms`
  downstream jobs resume.
- Ensure `edge.request.complete` logs reflect successful heartbeats for the
  affected gateway.
