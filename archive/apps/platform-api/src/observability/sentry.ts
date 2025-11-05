import * as Sentry from "@sentry/node";
import { scrubSentryEvent } from "@ibimina/lib";

let initialized = false;

export function initSentry(): typeof Sentry {
  if (initialized) {
    return Sentry;
  }

  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  Sentry.init({
    dsn: dsn?.length ? dsn : undefined,
    tracesSampleRate: 0.5,
    profilesSampleRate: 0.1,
    beforeSend(event, hint) {
      return scrubSentryEvent(event, hint);
    },
    environment: process.env.NODE_ENV ?? "development",
  });

  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
  });

  initialized = true;

  return Sentry;
}

export { Sentry };
