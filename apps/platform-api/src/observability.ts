import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/node";
import type { NodeOptions } from "@sentry/node";
import { PostHog } from "posthog-node";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  normalizeError,
  parseSampleRate,
  resolveDsn,
  resolveEnvironment,
  resolveRelease,
  scrubPII,
} from "@ibimina/lib";

const environment = resolveEnvironment();
const release = resolveRelease();
const sentryDsn = process.env.SENTRY_DSN_PLATFORM ?? resolveDsn();

const tracesSampleRate = parseSampleRate(
  process.env.SENTRY_TRACES_SAMPLE_RATE,
  environment === "production" ? 0.2 : 1
);

const profilesSampleRate = parseSampleRate(
  process.env.SENTRY_PROFILES_SAMPLE_RATE,
  environment === "production" ? 0.1 : 1
);

const sentryOptions: NodeOptions = {
  dsn: sentryDsn || undefined,
  environment,
  release,
  enabled: Boolean(sentryDsn),
  tracesSampleRate,
  profilesSampleRate,
  beforeSend: ((event) => scrubPII(event) as typeof event) as NodeOptions["beforeSend"],
};

Sentry.init(sentryOptions);

const posthogApiKey = process.env.POSTHOG_API_KEY;
const posthogHost = process.env.POSTHOG_HOST ?? "https://app.posthog.com";

const posthog = posthogApiKey
  ? new PostHog(posthogApiKey, {
      host: posthogHost,
      flushAt: 1,
      flushInterval: 0,
    })
  : null;

export interface StructuredLogger {
  info(event: string, payload?: Record<string, unknown>): void;
  warn(event: string, payload?: Record<string, unknown>): void;
  error(event: string, payload?: Record<string, unknown>): void;
}

const writeLog = (
  level: "info" | "warn" | "error",
  service: string,
  requestId: string,
  payload: Record<string, unknown>
) => {
  const entry = {
    level,
    service,
    requestId,
    environment,
    timestamp: new Date().toISOString(),
    ...payload,
  } as const;

  const serialized = JSON.stringify(scrubPII(entry));

  switch (level) {
    case "error":
      console.error(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    default:
      console.log(serialized);
  }
};

const createLogger = (service: string, requestId: string): StructuredLogger => ({
  info(event, payload) {
    writeLog("info", service, requestId, { event, payload: scrubPII(payload ?? {}) });
  },
  warn(event, payload) {
    writeLog("warn", service, requestId, { event, payload: scrubPII(payload ?? {}) });
  },
  error(event, payload) {
    writeLog("error", service, requestId, { event, payload: scrubPII(payload ?? {}) });
  },
});

const hasFlushAsync = (
  client: PostHog | null
): client is PostHog & { flushAsync: () => Promise<void> } => {
  return Boolean(client && typeof (client as { flushAsync?: unknown }).flushAsync === "function");
};

const flushTelemetry = async () => {
  const tasks: Array<Promise<unknown>> = [Sentry.flush(2000)];

  if (posthog) {
    const flushPromise = hasFlushAsync(posthog)
      ? posthog.flushAsync()
      : new Promise<void>((resolve) => {
          (posthog as unknown as { flush: (callback: (err?: Error) => void) => void }).flush(
            (err) => {
              if (err) {
                console.warn("[observability] PostHog flush error", normalizeError(err));
              }
              resolve();
            }
          );
        });

    tasks.push(flushPromise);
  }

  await Promise.all(tasks);
};

const captureWithScope = (cb: (scope: Sentry.Scope) => void, action: () => void) => {
  Sentry.withScope((scope) => {
    cb(scope);
    action();
  });
};

const captureException = (
  service: string,
  requestId: string,
  error: unknown,
  extras?: Record<string, unknown>
) => {
  if (!sentryDsn) {
    return;
  }

  captureWithScope(
    (scope) => {
      scope.setTag("service", service);
      scope.setTag("request_id", requestId);
      scope.setContext("details", scrubPII(extras ?? {}));
    },
    () => Sentry.captureException(error)
  );
};

const captureMessage = (
  service: string,
  requestId: string,
  message: string,
  extras?: Record<string, unknown>
) => {
  if (!sentryDsn) {
    return;
  }

  captureWithScope(
    (scope) => {
      scope.setTag("service", service);
      scope.setTag("request_id", requestId);
      scope.setContext("details", scrubPII(extras ?? {}));
    },
    () => Sentry.captureMessage(message)
  );
};

const capturePosthog = async (
  service: string,
  requestId: string,
  event: string,
  properties?: Record<string, unknown>
) => {
  if (!posthog) {
    return;
  }

  posthog.capture({
    distinctId: requestId,
    event,
    properties: {
      service,
      environment,
      ...scrubPII(properties ?? {}),
    },
  });
};

export interface ObservabilityContext {
  readonly requestId: string;
  readonly logger: StructuredLogger;
  captureException(error: unknown, extras?: Record<string, unknown>): void;
  captureMessage(message: string, extras?: Record<string, unknown>): void;
  track(event: string, properties?: Record<string, unknown>): Promise<void>;
}

type HttpHandler = (
  request: VercelRequest,
  response: VercelResponse,
  context: ObservabilityContext
) => Promise<void> | void;

export const withHttpObservability = (service: string, handler: HttpHandler) => {
  return async (request: VercelRequest, response: VercelResponse) => {
    const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
    const logger = createLogger(service, requestId);
    const startedAt = Date.now();

    const context: ObservabilityContext = {
      requestId,
      logger,
      captureException(error, extras) {
        captureException(service, requestId, error, extras);
      },
      captureMessage(message, extras) {
        captureMessage(service, requestId, message, extras);
      },
      async track(event, properties) {
        await capturePosthog(service, requestId, event, properties);
      },
    };

    try {
      logger.info("request.start", {
        method: request.method,
        path: request.url,
      });

      await handler(request, response, context);

      logger.info("request.complete", {
        status: response.statusCode ?? 200,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      logger.error("request.error", {
        error: normalizeError(error),
      });
      captureException(service, requestId, error, {
        method: request.method,
        path: request.url,
      });
      await capturePosthog(service, requestId, "request.error", {
        method: request.method,
        path: request.url,
      });
      if (!response.headersSent) {
        response.status(500).json({ error: "internal_error" });
      }
    } finally {
      await flushTelemetry();
    }
  };
};

type WorkerRunner<T> = (context: ObservabilityContext) => Promise<T> | T;

export const runWorker = async <T>(service: string, runner: WorkerRunner<T>): Promise<T> => {
  const requestId = randomUUID();
  const logger = createLogger(service, requestId);
  const startedAt = Date.now();

  const context: ObservabilityContext = {
    requestId,
    logger,
    captureException(error, extras) {
      captureException(service, requestId, error, extras);
    },
    captureMessage(message, extras) {
      captureMessage(service, requestId, message, extras);
    },
    async track(event, properties) {
      await capturePosthog(service, requestId, event, properties);
    },
  };

  logger.info("worker.start", { startedAt: new Date(startedAt).toISOString() });

  try {
    const result = await runner(context);
    logger.info("worker.complete", { durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    logger.error("worker.error", { error: normalizeError(error) });
    captureException(service, requestId, error);
    await capturePosthog(service, requestId, "worker.error");
    throw error;
  } finally {
    await flushTelemetry();
  }
};
