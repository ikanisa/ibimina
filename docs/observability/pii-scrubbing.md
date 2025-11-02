# PII Scrubbing Policy

The observability stack now enforces consistent masking rules across web apps,
workers, and Supabase Edge Functions.

## Redaction rules

All structured loggers and Sentry interceptors share the same sanitizer located
in `packages/lib/src/observability/pii.ts`. The helper masks:

- Email usernames (`ab*****@example.com`).
- Phone numbers (`+25••••89`).
- UUIDs (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
- Long digit sequences (`12••••34`).

The same scrubber is used by:

- Next.js Sentry configs (`apps/client/sentry.*.config.ts`,
  `apps/admin/sentry.*.config.ts`).
- Platform API logger and Sentry/PostHog bridge
  (`apps/platform-api/src/observability.ts`).
- Supabase Edge runtime wrapper (`supabase/functions/_shared/observability.ts`).

## Edge function behaviour

`supabase/functions/_shared/observability.ts` wraps every function with:

- Structured JSON logging (`edge.request.*` events).
- Automatic console proxying so existing `console.*` calls become masked JSON
  output.
- Sentry capture using environment-driven DSNs and sampling
  (`SENTRY_DSN_SUPABASE`, `SENTRY_TRACES_SAMPLE_RATE`,
  `SENTRY_PROFILES_SAMPLE_RATE`).
- Optional PostHog capture (`POSTHOG_API_KEY`, `POSTHOG_HOST`).

## Platform API behaviour

`apps/platform-api/src/observability.ts` instruments API handlers and workers
with:

- JSON structured logs using the shared scrubber.
- Sentry context tags per service (`service`, `request_id`).
- PostHog events per request/worker run when `POSTHOG_API_KEY` is configured.

## Front-end behaviour

The Next.js apps initialize Sentry in `sentry.client.config.ts`,
`sentry.server.config.ts`, and `sentry.edge.config.ts`, using the shared
scrubber and environment-driven sampling. Middleware logs are emitted with
request metadata and masked payloads.

## Required environment variables

Production builds must supply:

- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` for each Next.js app.
- `SENTRY_DSN_SUPABASE` for Edge Functions.
- Optional `POSTHOG_API_KEY` and `POSTHOG_HOST` for analytics capture.
- Optional `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE` to
  override defaults.
