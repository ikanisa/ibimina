import { AsyncLocalStorage } from "node:async_hooks";

interface LogContext {
  requestId?: string;
  userId?: string | null;
  saccoId?: string | null;
  source?: string | null;
}

const storage = new AsyncLocalStorage<LogContext>();

type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown> | undefined;

function normalize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (accumulator, [key, item]) => {
        accumulator[key] = normalize(item);
        return accumulator;
      },
      {},
    );
    return entries;
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  return value;
}

function write(level: LogLevel, event: string, payload: LogPayload) {
  const context = storage.getStore() ?? {};
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    requestId: context.requestId ?? null,
    userId: context.userId ?? null,
    saccoId: context.saccoId ?? null,
    source: context.source ?? null,
    payload: payload ? normalize(payload) : undefined,
  };

  const serialized = JSON.stringify(entry);

  switch (level) {
    case "warn":
      console.warn(serialized);
      break;
    case "error":
      console.error(serialized);
      break;
    default:
      console.log(serialized);
  }
}

export function withLogContext<T>(base: LogContext, callback: () => Promise<T> | T): Promise<T> | T {
  const parent = storage.getStore() ?? {};
  const merged = { ...parent, ...base };
  return storage.run(merged, callback);
}

export function updateLogContext(context: Partial<LogContext>) {
  const store = storage.getStore();
  if (store) {
    Object.assign(store, context);
  } else {
    storage.enterWith({ ...context });
  }
}

export function getCurrentLogContext(): LogContext {
  return storage.getStore() ?? {};
}

export function logInfo(event: string, payload?: Record<string, unknown>) {
  write("info", event, payload);
}

export function logWarn(event: string, payload?: Record<string, unknown>) {
  write("warn", event, payload);
}

export function logError(event: string, payload?: Record<string, unknown>) {
  write("error", event, payload);
}
