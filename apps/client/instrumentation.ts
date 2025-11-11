import { resolveEnvironment } from "@ibimina/lib";

export async function register() {
  if (typeof window !== "undefined") {
    return;
  }

  await import("./sentry.server.config");

  if (process.env.NODE_ENV === "production") {
    const environment = resolveEnvironment();
    // Using console.log for structured JSON output during instrumentation boot
    // eslint-disable-next-line ibimina/structured-logging
    console.log(
      JSON.stringify({
        event: "client.instrumentation.boot",
        environment,
        timestamp: new Date().toISOString(),
      })
    );
  }
}
