/**
 * Lightweight structured logger with basic PII scrubbing for the client app.
 *
 * The implementation mirrors the admin app's structured logging approach but
 * keeps the dependency surface small for the member client runtime. Sensitive
 * values such as emails, phone numbers, UUIDs, and long numeric strings are
 * masked before being emitted to stdout/stderr to reduce the risk of leaking
 * PII into log drains.
 */

import { AsyncLocalStorage } from "node:async_hooks";

interface LogContext {
  requestId?: string;
  userId?: string | null;
  orgId?: string | null;
  source?: string | null;
}

type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown> | undefined;

const storage = new AsyncLocalStorage<LogContext>();

const EMAIL_REGEX = /([A-Z0-9._%+-]{2})[A-Z0-9._%+-]*(@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
const PHONE_REGEX = /(\+?\d{2})\d{3,8}(\d{2})/g;
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const LONG_NUMBER_REGEX = /(\d{2})\d{4,}(\d{2})/g;

const mask = (value: string, matcher: RegExp, replacer: (match: RegExpExecArray) => string) =>
  value.replace(matcher, (...args) => replacer(args as unknown as RegExpExecArray));

const scrubString = (value: string) => {
  let result = value;
  result = mask(result, EMAIL_REGEX, (match) => `${match[1]}…${match[2]}`);
  result = mask(result, PHONE_REGEX, (match) => `${match[1]}••••${match[2]}`);
  result = mask(result, UUID_REGEX, () => "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
  result = mask(result, LONG_NUMBER_REGEX, (match) => `${match[1]}••••${match[2]}`);
  return result;
};

const scrub = (value: unknown): unknown => {
  if (typeof value === "string") {
    return scrubString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => scrub(entry));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (accumulator, [key, entry]) => {
        accumulator[key] = scrub(entry);
        return accumulator;
      },
      {}
    );
  }

  return value;
};

const normalize = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubString(value.message),
      stack: value.stack,
    };
  }

  return scrub(value);
};

const write = (level: LogLevel, event: string, payload: LogPayload) => {
  const context = storage.getStore() ?? {};
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    requestId: context.requestId ?? null,
    userId: context.userId ?? null,
    orgId: context.orgId ?? null,
    source: context.source ?? null,
    payload: payload ? normalize(payload) : undefined,
  } satisfies Record<string, unknown>;

  const serialized = JSON.stringify(entry);

  switch (level) {
    case "error":
      // eslint-disable-next-line ibimina/structured-logging, no-console
      console.error(serialized);
      break;
    case "warn":
      // eslint-disable-next-line ibimina/structured-logging, no-console
      console.warn(serialized);
      break;
    default:
      // eslint-disable-next-line ibimina/structured-logging, no-console
      console.log(serialized);
  }
};

export const withLogContext = <T>(context: LogContext, callback: () => Promise<T> | T) => {
  const parent = storage.getStore() ?? {};
  const merged = { ...parent, ...context } satisfies LogContext;
  return storage.run(merged, callback);
};

export const updateLogContext = (context: Partial<LogContext>) => {
  const store = storage.getStore();
  if (store) {
    Object.assign(store, context);
  } else {
    storage.enterWith({ ...context });
  }
};

export const logInfo = (event: string, payload?: Record<string, unknown>) => {
  write("info", event, payload);
};

export const logWarn = (event: string, payload?: Record<string, unknown>) => {
  write("warn", event, payload);
};

export const logError = (event: string, payload?: Record<string, unknown>) => {
  write("error", event, payload);
};

export const getCurrentLogContext = (): LogContext => storage.getStore() ?? {};
