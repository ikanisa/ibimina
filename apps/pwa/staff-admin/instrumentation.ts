import { logInfo } from "./lib/observability/logger";

export async function register() {
  if (typeof window !== "undefined") {
    return;
  }

  // Skip Sentry in development and also avoid importing the module
  if (process.env.NODE_ENV === "development") {
    logInfo("admin.instrumentation.skipped", { reason: "development" });
    return;
  }

  // Production only
  await import("./sentry.server.config");

  const environment = process.env.APP_ENV || process.env.NODE_ENV || "unknown";
  logInfo("admin.instrumentation.boot", { environment });
}
