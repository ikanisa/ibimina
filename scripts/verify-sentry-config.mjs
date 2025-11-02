#!/usr/bin/env node
const service = process.env.SENTRY_SERVICE ?? "unknown";
const isProductionBuild =
  (process.env.NODE_ENV ?? "").toLowerCase() === "production" ||
  (process.env.APP_ENV ?? "").toLowerCase() === "production" ||
  (process.env.VERCEL_ENV ?? "").toLowerCase() === "production";

if (!isProductionBuild) {
  console.log(`[verify-sentry-config] Skipping check for ${service} (non-production build).`);
  process.exit(0);
}

const required = [];

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    required.push(key);
  }
};

requireEnv("SENTRY_DSN");
if ((process.env.SENTRY_EXPECTS_PUBLIC_DSN ?? "1") !== "0") {
  requireEnv("NEXT_PUBLIC_SENTRY_DSN");
}

if (required.length > 0) {
  console.error(
    `Missing Sentry configuration for ${service}: ${required.join(", ")}. Set the required environment variables before deploying.`
  );
  process.exit(1);
}

console.log(`[verify-sentry-config] Sentry DSN validated for ${service}.`);
