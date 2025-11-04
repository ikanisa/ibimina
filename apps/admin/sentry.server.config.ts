import * as Sentry from "@sentry/nextjs";

// Skip Sentry initialization in development
if (process.env.NODE_ENV !== "development") {
  // Dynamic import to avoid module resolution issues in dev
  const { createSentryOptions, resolveDsn, resolveEnvironment, resolveRelease } = require("@ibimina/lib");

  const environment = resolveEnvironment();
  const dsn = resolveDsn();

  Sentry.init(
    createSentryOptions({
      dsn,
      environment,
      release: resolveRelease(),
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE,
      profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE,
    })
  );
} else {
  console.log("[sentry.server.config] Skipped in development");
}
