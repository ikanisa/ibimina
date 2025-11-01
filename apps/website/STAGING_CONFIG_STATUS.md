# Staging Configuration Review – Website

**Date:** 2025-11-01

## Summary

- The repository does not include an `apps/website/.env.staging` file or
  alternative staging secrets reference.
- No Sentry or PostHog environment variables are defined within the codebase or
  checked-in configuration.
- Feature flags for the marketing site are not implemented;
  `scripts/check-feature-flags.mjs` does not reference the website package.

## Environment Variables

| Variable                                | Expected Purpose                         | Status           |
| --------------------------------------- | ---------------------------------------- | ---------------- |
| `NEXT_PUBLIC_SITE_URL`                  | Canonical staging URL for marketing site | ❌ Not defined   |
| `NEXT_PUBLIC_POSTHOG_KEY`               | Client-side analytics key                | ❌ Not defined   |
| `POSTHOG_HOST`                          | Analytics ingestion endpoint             | ❌ Not defined   |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting DSN for website          | ❌ Not defined   |
| `FEATURE_FLAGS` (any)                   | Feature toggles for staging              | ❌ Not available |

_No environment variables were found via repository search (`rg 'POSTHOG'` /
`rg 'SENTRY'`)._

## Deployment Command

- Attempted command: `pnpm deploy --filter website --env staging`
- Outcome: pnpm reported `Unknown option: 'env'`. No workspace `deploy` script
  exists for the website package.
- Recommendation: add a dedicated script (e.g., `deploy:staging`) that wraps the
  actual Cloudflare/Vercel deployment process.

## Monitoring & Alerts

- Sentry DSN missing – cannot validate error ingestion.
- PostHog keys missing – cannot validate event ingestion.
- Alerting rules absent – once Sentry DSN is configured, create P0/P1 alert
  policies in Sentry and document them here.

## Action Items

1. Provide staging secrets via `.env.staging` or secret manager and document
   injection steps.
2. Configure Sentry (server/client DSN) and PostHog keys; verify ingestion after
   deployment.
3. Implement automated deployment script for staging and rerun smoke validation
   checklist.
