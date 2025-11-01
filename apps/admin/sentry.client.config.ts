import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@ibimina/lib";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn?.length ? dsn : undefined,
  tracesSampleRate: 1.0,
  enableTracing: true,
  beforeSend(event, hint) {
    return scrubSentryEvent(event, hint);
  },
  integrations: [
    Sentry.browserTracingIntegration({ tracePropagationTargets: [/^https:\/\//, /^\//] }),
    Sentry.replayIntegration({
      maskAllInputs: true,
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  sendClientReports: false,
});
