/* eslint-disable ibimina/structured-logging, no-console */
const DEFAULT_SOURCE = "admin-cli";

function normalize(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value === undefined || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, item]) => {
      accumulator[key] = normalize(item);
      return accumulator;
    }, {});
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  return value;
}

function resolveEnvironment() {
  return process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
}

function emit(level, event, payload) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    environment: resolveEnvironment(),
    source: DEFAULT_SOURCE,
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

export function logInfo(event, payload) {
  emit("info", event, payload);
}

export function logWarn(event, payload) {
  emit("warn", event, payload);
}

export function logError(event, payload) {
  emit("error", event, payload);
}

export function logResult(event, result) {
  emit(result.ok ? "info" : "error", event, result);
}
