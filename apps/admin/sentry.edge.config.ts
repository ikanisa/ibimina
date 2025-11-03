import * as Sentry from "@sentry/nextjs";

import { createSentryOptions, resolveDsn, resolveEnvironment, resolveRelease } from "@ibimina/lib";

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
