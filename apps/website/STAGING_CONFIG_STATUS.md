# Staging Configuration Review – Website

**Last reviewed:** 2025-11-02

## Summary

- Added a committed `apps/website/.env.staging` template capturing all required
  staging variables (site URLs, Supabase keys, Sentry + PostHog placeholders).
- Sentry DSN and PostHog keys remain **placeholders** – production values must
  be injected via Cloudflare Pages secrets before running smoke tests.
- Feature flag verification continues to rely on the shared Supabase
  configuration; no website-specific flag gaps were identified, but a staging
  service-role key is still required for validation.
- Deployment still fails because the workspace uses pnpm's built-in `deploy`
  command; a dedicated script (e.g. `pnpm run website:deploy:staging`) should
  wrap `wrangler pages deploy`.

## Environment Variables

| Variable                                | Expected Purpose                         | Status                  |
| --------------------------------------- | ---------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | Canonical staging URL for marketing site | ✅ Template provided    |
| `NEXT_PUBLIC_POSTHOG_KEY`               | Client-side analytics key                | ⚠️ Placeholder value    |
| `POSTHOG_HOST`                          | Analytics ingestion endpoint             | ✅ Defaults configured  |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting DSN for website          | ⚠️ Placeholder value    |
| `FEATURE_FLAGS` (Supabase)              | Feature toggles for staging              | ⚠️ Requires credentials |

_Environment variables now live in `.env.staging`; analytics keys are redacted
and must be populated from the secret manager._

## Deployment Command

- Attempted command: `pnpm deploy --filter website --env staging`
- Outcome: pnpm reported `Unknown option: 'env'`. No workspace `deploy` script
  exists for the website package (pnpm executes its built-in deploy workflow
  instead).
- Recommendation: add a dedicated script (e.g.,
  `"website:deploy:staging": "pnpm --filter @ibimina/website run deploy:staging"`)
  and create an app-level `deploy:staging` script that runs
  `wrangler pages deploy out --branch=staging`.

## Monitoring & Alerts

- Populate Sentry DSN/Auth Token via Cloudflare Pages secrets and trigger a
  manual error to confirm staging ingestion (e.g. `curl` to the Pages preview).
- Populate PostHog public key and verify capture via the PostHog Live Events
  feed while browsing staging.
- Define Sentry alert rules:
  - **P0:** Alert on any unhandled exception with `environment:staging` and
    occurrence count ≥ 1 within 5 minutes (notify #on-call).
  - **P1:** Alert on 5+ errors in 10 minutes for the marketing website (notify
    growth + platform squads).
- Document alert URLs and runbook locations once the rules exist.

## Action Items

1. Store the real Sentry/PostHog/Supabase secrets in Cloudflare Pages staging
   environment variables; confirm ingestion before promoting changes.
2. Expose a workspace deploy script to avoid pnpm's built-in `deploy` invocation
   when following the documented command.
3. Re-run the smoke validation checklist once staging deploy succeeds and
   monitoring hooks are proven.
