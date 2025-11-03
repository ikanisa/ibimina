import type { NextConfig } from "next";

export interface CreateWithPwaOptions {
  /**
   * When false the plugin is still registered but the service worker bundle
   * is disabled. This is helpful for environments where the offline fallback
   * should be opt-in (e.g. canary deploys).
   */
  fallbackEnabled?: boolean;
  /**
   * Allows custom service worker entrypoints per application.
   */
  serviceWorkerSource?: string;
}

/**
 * Shared helper that lazily loads `next-pwa` and applies the Ibimina defaults
 * across admin, client and staff applications. The helper avoids hard
 * importing the dependency so that local development continues to work when
 * the package is not installed (e.g. optional peer in CI containers).
 */
export function createWithPwa({
  fallbackEnabled = true,
  serviceWorkerSource = "workers/service-worker.ts",
}: CreateWithPwaOptions = {}) {
  let withPWA = (config: NextConfig) => config;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const withPWAInit = require("next-pwa");
    withPWA = withPWAInit({
      dest: "public",
      disable:
        process.env.NODE_ENV === "development" ||
        process.env.DISABLE_PWA === "1" ||
        !fallbackEnabled,
      register: true,
      skipWaiting: true,
      sw: "service-worker.js",
      swSrc: serviceWorkerSource,
      buildExcludes: [/middleware-manifest\.json$/],
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "next-pwa not available; continuing without service worker bundling.",
        error
      );
    }
  }

  return withPWA;
}
