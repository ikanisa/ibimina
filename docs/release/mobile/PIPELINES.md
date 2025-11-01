# Mobile Delivery Pipelines

## Native Builds

- **EAS** profiles defined in `apps/client/eas.json` cover internal, alpha, and
  production releases with feature flag environment overrides.
- **Fastlane** lanes in `apps/client/fastlane/Fastfile` wrap the EAS commands
  and publish tracks via `fastlane supply` for Android.

## Web/PWA Fallback

- Vercel commands `pnpm --filter @ibimina/client run deploy:vercel:preview` and
  `deploy:vercel:fallback` respect the `pwaFallback` feature flag default.
- `.github/workflows/mobile.yml` runs Detox suites before shipping to ensure
  gating logic is verified.

## Observability

- Telemetry instrumentation is provided by
  `packages/core/src/telemetry/telemetryManager.ts` feeding PostHog/Sentry and
  Supabase tables.
