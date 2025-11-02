import * as Sentry from "@sentry/nextjs";
import type { Event, EventHint } from "@sentry/types";

import {
  parseSampleRate,
  resolveDsn,
  resolveEnvironment,
  resolveRelease,
  scrubPII,
} from "@ibimina/lib";

const environment = resolveEnvironment();
const dsn = resolveDsn({ browser: true });

const tracesSampleRate = parseSampleRate(
  process.env.SENTRY_TRACES_SAMPLE_RATE,
  environment === "production" ? 0.2 : 1
);

const profilesSampleRate = parseSampleRate(
  process.env.SENTRY_PROFILES_SAMPLE_RATE,
  environment === "production" ? 0.1 : 1
);

const scrubEvent = (event: Event, _hint?: EventHint) => scrubPII(event) as Event;

Sentry.init({
  dsn: dsn || undefined,
  environment,
  release: resolveRelease(),
  enabled: Boolean(dsn),
  tracesSampleRate,
  profilesSampleRate,
  beforeSend: scrubEvent,
});
