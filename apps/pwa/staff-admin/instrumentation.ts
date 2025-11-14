export async function register() {
  // Skip in browser
  if (typeof window !== "undefined") {
    return;
  }

  // Skip in edge runtime (middleware)
  if (typeof EdgeRuntime !== "undefined") {
    return;
  }

  // Skip in development
  if (process.env.NODE_ENV === "development") {
    console.log("Instrumentation skipped in development");
    return;
  }

  // Production only - load Sentry
  try {
    await import("./sentry.server.config");
    console.log("Instrumentation initialized");
  } catch (error) {
    console.error("Failed to initialize instrumentation:", error);
  }
}
