import { resolveEnvironment } from "@ibimina/lib";

export async function register() {
  if (typeof window !== "undefined") {
    return;
  }

  await import("./sentry.server.config");

  if (process.env.NODE_ENV === "production") {
    const environment = resolveEnvironment();
    console.log(
      JSON.stringify({
        event: "admin.instrumentation.boot",
        environment,
        timestamp: new Date().toISOString(),
      })
    );
  }
}
