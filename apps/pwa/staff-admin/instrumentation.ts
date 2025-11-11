export async function register() {
  if (typeof window !== "undefined") {
    return;
  }

  // Skip Sentry in development and also avoid importing the module
  if (process.env.NODE_ENV === "development") {
    console.log("[instrumentation] Skipped in development");
    return;
  }

  // Production only
  await import("./sentry.server.config");

  const environment = process.env.APP_ENV || process.env.NODE_ENV || "unknown";
  console.log(
    JSON.stringify({
      event: "admin.instrumentation.boot",
      environment,
      timestamp: new Date().toISOString(),
    })
  );
}
