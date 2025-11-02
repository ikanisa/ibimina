import { randomUUID } from "node:crypto";
import type { VercelRequest } from "@vercel/node";
import pino from "pino";

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "test" ? "silent" : "info");

export const logger = pino({
  level,
  base: {
    service: "platform-api",
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true,
  },
});

const normaliseHeaderValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

export const createRequestLogger = (req: Pick<VercelRequest, "headers" | "method" | "url">) => {
  const requestId =
    normaliseHeaderValue(req.headers?.["x-request-id"]) ??
    normaliseHeaderValue(req.headers?.["x-correlation-id"]) ??
    randomUUID();

  return logger.child({
    requestId,
    req: {
      method: req.method,
      url: req.url,
    },
  });
};
