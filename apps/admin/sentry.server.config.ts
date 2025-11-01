import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@ibimina/lib";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn?.length ? dsn : undefined,
  tracesSampleRate: 1.0,
  profilesSampleRate: 0.2,
  beforeSend(event, hint) {
    return scrubSentryEvent(event, hint);
  },
  sendClientReports: false,
});
