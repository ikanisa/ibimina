export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@sentry/nextjs");
  }

  if (process.env.NODE_ENV === "production") {
    console.log("[instrumentation] observability bootstrapped");
  }
}
