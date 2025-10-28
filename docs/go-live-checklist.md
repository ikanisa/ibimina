# Go-Live Checklist

This guide pulls together everything required to launch Ibimina Connect on
Supabase without additional guessing. Work through the sections in order when
preparing a new environment.

## 1. Prerequisites

- Supabase CLI ≥ v1.189 installed locally (or in CI).
- Supabase access token with **Owner** role on the target project
  (`SUPABASE_ACCESS_TOKEN`).
- Project reference (e.g. `vacltfdslodqybxojytc`) exported as
  `SUPABASE_PROJECT_REF`.
- Deno 1.45+ available for bundling (Supabase CLI handles this automatically).
- Node.js 20+ and npm 10+ for building the Next.js app.

## 2. Link the Supabase project

```
S UPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=...
supabase login
supabase link --project-ref "$SUPABASE_PROJECT_REF"
```

## 3. Apply database migrations

```
supabase migration up --linked --include-all --yes
```

This will create the full schema, run the Umurenge SACCO seed, and install the
derived search helpers.

## 4. Seed static data (optional)

The migration above already ingests the Umurenge list. If you need to re-seed
from the JSON manually:

```
psql "$SUPABASE_DB_URL" -f supabase/migrations/20251008120000_enrich_saccos_with_umurenge_master.sql
```

## 5. Configure secrets

Create a file `supabase/.env.production` by copying the template below and
filling in the values you keep in your secrets manager:

```
# Required
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
SUPABASE_DB_URL=
OPENAI_API_KEY=
OPENAI_RESPONSES_MODEL=gpt-4.1-mini
FIELD_ENCRYPTION_KEY=
KMS_DATA_KEY=
BACKUP_PEPPER=
MFA_SESSION_SECRET=
TRUSTED_COOKIE_SECRET=

# Optional overrides (defaults shown)
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW_SECONDS=60
RECON_AUTO_ESCALATE_HOURS=48
FORECAST_LOOKBACK_DAYS=120
FORECAST_HORIZON_DAYS=21
SMS_AUTOMATION_THRESHOLD_MINUTES=10
SMS_AUTOMATION_BATCH=25
```

Set the secrets with the CLI:

```
supabase secrets set --env-file supabase/.env.production
```

> **Note:** `ingest-sms` no longer checks `SMS_SHARED_SECRET`. The GSM modem
> simply authenticates with the Service Role key.

## 6. Deploy edge functions

Deploy the full batch in one go:

```
./scripts/supabase-go-live.sh deploy-functions
```

This wraps the CLI calls to keep deployments consistent; see the script for
details.

Manual command (if needed):

```
supabase functions deploy analytics-forecast bootstrap-admin export-report export-statement \
  gsm-maintenance import-statement ingest-sms invite-user parse-sms reporting-summary \
  scheduled-reconciliation secure-import-members settle-payment sms-review
```

## 7. Schedule background jobs

Use Supabase cron to run `scheduled-reconciliation` hourly (adjust as desired):

```
supabase functions schedule create recon-hourly \
  --function scheduled-reconciliation \
  --cron "0 * * * *"
```

Verify the schedule:

```
supabase functions schedule list
```

## 8. GSM modem ingestion flow

The modem listener can forward incoming messages in two ways:

1. **Direct insert:** use the service-role key to insert rows into
   `public.sms_inbox`.
2. **Edge function:** submit JSON to `/functions/v1/ingest-sms` with the
   standard Supabase `Authorization: Bearer <service_role_key>` header.

Example payload:

```
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/ingest-sms \
  -d '{
        "rawText": "15000 AIRTEL 2505221230 REF.KIG/NYARUGENGE.G2.M001",
        "receivedAt": "2025-10-09T07:21:12Z",
        "vendorMeta": { "modemPort": "usb0" }
      }'
```

`ingest-sms` handles parsing, deduplication, ledger posting, audit logging, and
metrics.

## 9. Smoke tests

After deployment:

- Invoke `invite-user`, `parse-sms`, and `reporting-summary` with test payloads.
- Ensure RLS policies allow/deny as expected (e.g. using Supabase Studio SQL
  console).
- Run the Next.js app with the Supabase environment to confirm dashboards load.

## 10. CI / automation (recommended)

Use `scripts/supabase-go-live.sh` in your CI pipeline to unify migrations,
secrets, and function deployments. Combine with “Preview Branches” in Supabase
or a GitHub Action to keep environments consistent.

## 11. Monitoring & logging

- CloudWatch log group `/ibimina/<environment>/edge-functions` is provisioned
  via Terraform for function logs.
- Supabase Studio → Logs → Edge Functions offers real-time inspection.
- Consider setting up alerts on `notification_queue` backlog or metrics recorded
  by `_shared/metrics.ts`.
- Configure the application log drain by setting `LOG_DRAIN_URL`,
  `LOG_DRAIN_TOKEN`, `LOG_DRAIN_SOURCE`, and the alert webhook/token pair. Run
  `pnpm run verify:log-drain` to assert forwarding + alerting before tailing the
  external drain during an audit log
  write.【F:lib/observability/logger.ts†L71-L170】【F:scripts/verify-log-drain.ts†L1-L132】
- In Supabase, set `analytics_cache_webhook_url` and
  `analytics_cache_webhook_token` in the `configuration` table (service-role
  insert). Point the URL to the deployed `/api/cache/revalidate` endpoint and
  ensure the same bearer token is configured via the `ANALYTICS_CACHE_TOKEN`
  environment variable in your
  runtime.【F:supabase/migrations/20251011153000_dashboard_materialization.sql†L174-L223】【F:app/api/cache/revalidate/route.ts†L1-L70】

## 12. Metrics exporter & dashboards

- Deploy the `metrics-exporter` edge function alongside the rest of the batch
  (`./scripts/supabase-go-live.sh deploy-functions` already includes it).
- Run Prometheus/Grafana (or connect to your existing stack) and add a scrape
  target for `/functions/v1/metrics-exporter`:
  ```
  job_name: ibimina-metrics-exporter
    metrics_path: /functions/v1/metrics-exporter
    static_configs:
      - targets: ['<project-ref>.functions.supabase.co']
  ```
- Import `infra/metrics/dashboards/ibimina-operations.json` into Grafana and
  configure alert rules:
  - Warn at >25 pending SMS for 5 minutes.
  - Page at >10 failed notifications, or `ibimina_health_up` = 0 for >2 minutes.
- Document dashboard URL + alert contact in runbook before launch.

## 13. Rollback plan

- Database: use `supabase migration down --linked --to-version <timestamp>` to
  revert.
- Edge functions: redeploy previous commit or disable via
  `supabase functions delete <name>`.
- App: redeploy the last known-good build via your deployment platform (e.g.,
  your container host or orchestrator).

Keeping this checklist up to date ensures future environments can be stood up in
minutes rather than hours.

---

## 2025-10-09 Status Snapshot

- Supabase CLI steps (`supabase migration up`, secrets set, edge function
  deploy, cron schedule) **not attempted** in this environment — missing
  `SUPABASE_PROJECT_REF`/credentials and network access prevents remote
  execution.
- Post-deploy smoke tests blocked until a linked Supabase project exists;
  instructions above remain valid once connectivity is available.
- Recommendation: run this checklist end-to-end from a workstation with Supabase
  access tokens configured and network egress enabled, then attach CLI logs to
  release notes.
