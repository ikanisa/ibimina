import type { Event, EventHint } from "@sentry/types";
import { scrubPII } from "./pii.js";

/**
 * Scrubs PII from Sentry events before sending them
 */
export function scrubSentryEvent<T extends Event>(event: T, _hint?: EventHint): T {
  if (!event) {
    return event;
  }

  const scrubbed: T = { ...event };

  if (scrubbed.request?.data) {
    scrubbed.request = {
      ...scrubbed.request,
      data: scrubPII(scrubbed.request.data),
    };
  }

  if (scrubbed.user) {
    scrubbed.user = scrubPII(scrubbed.user);
  }

  if (scrubbed.extra) {
    scrubbed.extra = scrubPII(scrubbed.extra);
  }

  if (scrubbed.contexts) {
    scrubbed.contexts = scrubPII(scrubbed.contexts);
  }

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message ? scrubPII(breadcrumb.message) : breadcrumb.message,
      data: breadcrumb.data ? scrubPII(breadcrumb.data) : breadcrumb.data,
    }));
  }

  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map((value) => ({
        ...value,
        value: value.value ? scrubPII(value.value) : value.value,
        stacktrace: value.stacktrace ? scrubPII(value.stacktrace) : value.stacktrace,
      })),
    };
  }

  return scrubbed;
}
