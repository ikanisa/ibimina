import type { Event, EventHint } from "@sentry/types";

const PII_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, // email addresses
  /\b(?:\+?250|0)(?:7[2389]|78)\d{7}\b/g, // Rwanda phone numbers, common local prefixes
  /\b\d{3}[- ]?\d{3}[- ]?\d{4}\b/g, // generic phone numbers
  /\b[A-Z0-9._%+-]{2,}#\d{3,6}\b/g, // IDs with hash suffixes
];

function scrubValue<T>(value: T): T {
  if (typeof value === "string") {
    let sanitized = value;
    for (const pattern of PII_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[redacted]");
    }
    return sanitized as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item)) as T;
  }

  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = scrubValue(entry);
    }
    return clone as T;
  }

  return value;
}

export function scrubSentryEvent<T extends Event>(event: T, _hint?: EventHint): T {
  if (!event) {
    return event;
  }

  const scrubbed: T = { ...event };

  if (scrubbed.request?.data) {
    scrubbed.request = {
      ...scrubbed.request,
      data: scrubValue(scrubbed.request.data),
    };
  }

  if (scrubbed.user) {
    scrubbed.user = scrubValue(scrubbed.user);
  }

  if (scrubbed.extra) {
    scrubbed.extra = scrubValue(scrubbed.extra);
  }

  if (scrubbed.contexts) {
    scrubbed.contexts = scrubValue(scrubbed.contexts);
  }

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message ? scrubValue(breadcrumb.message) : breadcrumb.message,
      data: breadcrumb.data ? scrubValue(breadcrumb.data) : breadcrumb.data,
    }));
  }

  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map((value) => ({
        ...value,
        value: value.value ? scrubValue(value.value) : value.value,
        stacktrace: value.stacktrace ? scrubValue(value.stacktrace) : value.stacktrace,
      })),
    };
  }

  return scrubbed;
}

export function scrubRecord<T>(record: T): T {
  return scrubValue(record);
}
