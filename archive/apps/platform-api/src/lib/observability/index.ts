import * as Sentry from "@sentry/node";
import { Counter, Histogram, Registry } from "prom-client";

const SERVICE_NAME = "platform-api" as const;

const registry = new Registry();

function registerMetric(metric: Counter | Histogram) {
  if (!registry.getSingleMetric(metric.name)) {
    registry.registerMetric(metric);
  }
}

const momoRuns = new Counter({
  name: "ibimina_momo_poller_runs_total",
  help: "Total MoMo poller executions partitioned by result.",
  labelNames: ["result"],
});
registerMetric(momoRuns);

const momoProcessed = new Histogram({
  name: "ibimina_momo_poller_processed_batch_size",
  help: "Number of MoMo statements processed per poller run.",
  buckets: [0, 1, 10, 25, 50, 75, 100, 200, 500, 1000],
});
registerMetric(momoProcessed);

const gsmRuns = new Counter({
  name: "ibimina_gsm_heartbeat_runs_total",
  help: "Total GSM heartbeat executions partitioned by result.",
  labelNames: ["result"],
});
registerMetric(gsmRuns);

const whatsappOutcomes = new Counter({
  name: "ibimina_whatsapp_webhook_events_total",
  help: "Outcomes of WhatsApp webhook ingestion runs.",
  labelNames: ["result"],
});
registerMetric(whatsappOutcomes);

const whatsappFailures = new Counter({
  name: "ibimina_whatsapp_webhook_failures_total",
  help: "Failure reasons encountered while handling WhatsApp webhooks.",
  labelNames: ["reason"],
});
registerMetric(whatsappFailures);

let observabilityInitialised = false;
let sentryEnabled = false;

function addBreadcrumb(
  level: Sentry.SeverityLevel,
  message: string,
  data?: Record<string, unknown>
) {
  if (!sentryEnabled) {
    return;
  }

  Sentry.addBreadcrumb({
    level,
    category: SERVICE_NAME,
    message,
    data,
  });
}

function consoleFor(level: "info" | "warn" | "error") {
  switch (level) {
    case "info":
      return console.info.bind(console);
    case "warn":
      return console.warn.bind(console);
    default:
      return console.error.bind(console);
  }
}

function log(
  level: "info" | "warn" | "error",
  event: string,
  payload: Record<string, unknown> = {}
) {
  ensureObservability();
  const metadata = { ...payload, event, service: SERVICE_NAME };
  consoleFor(level)(event, metadata);
  addBreadcrumb(level === "warn" ? "warning" : level, event, payload);
}

export function ensureObservability() {
  if (observabilityInitialised) {
    return;
  }

  observabilityInitialised = true;
  const dsn =
    process.env.PLATFORM_API_SENTRY_DSN ??
    process.env.SENTRY_DSN ??
    process.env.PLATFORM_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "development",
    tracesSampleRate: 0,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });

  Sentry.setTag("service", SERVICE_NAME);
  sentryEnabled = true;
}

export function logInfo(event: string, payload: Record<string, unknown> = {}) {
  log("info", event, payload);
}

export function logWarn(event: string, payload: Record<string, unknown> = {}) {
  log("warn", event, payload);
}

export function logError(event: string, payload: Record<string, unknown> = {}) {
  log("error", event, payload);
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  ensureObservability();
  if (!sentryEnabled) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
    tags: { service: SERVICE_NAME },
  });
}

export interface MomoPollerMetrics {
  status: "success" | "failure";
  processed?: number;
  inserted?: number;
  jobs?: number;
}

export function recordMomoPollerMetrics(metrics: MomoPollerMetrics) {
  ensureObservability();
  momoRuns.inc({ result: metrics.status });

  if (metrics.status === "success") {
    momoProcessed.observe(metrics.processed ?? 0);
  }
}

export interface GsmHeartbeatMetrics {
  status: "success" | "failure";
  checked?: number;
}

export function recordGsmHeartbeatMetrics(metrics: GsmHeartbeatMetrics) {
  ensureObservability();
  gsmRuns.inc({ result: metrics.status });
}

export interface WhatsappIngestMetrics {
  result: "processed" | "cached" | "failed";
  inboundMessages: number;
  statuses: number;
  failures: number;
}

export function recordWhatsappIngestMetrics(metrics: WhatsappIngestMetrics) {
  ensureObservability();
  whatsappOutcomes.inc({ result: metrics.result });

  if (metrics.result === "failed" && metrics.failures > 0) {
    whatsappFailures.inc({ reason: "processing" }, metrics.failures);
  }
}

export function recordWhatsappFailure(reason: string) {
  ensureObservability();
  whatsappFailures.inc({ reason });
}

export function resetObservabilityMetrics() {
  registry.resetMetrics();
}

export function getObservabilityRegistry() {
  return registry;
}
