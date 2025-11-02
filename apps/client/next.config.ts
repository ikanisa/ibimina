import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";
import { featureFlagDefinitions } from "@ibimina/config";
import { HSTS_HEADER, createSecureHeaders } from "@ibimina/lib";
import { createWithPwa } from "../../config/next/withPwa";

/**
 * Next.js configuration for SACCO+ Client App
 *
 * This configuration enables:
 * - React strict mode for better development experience
 * - Optimized production builds
 * - PWA capabilities with service worker
 */

const fallbackFeatureDefault = featureFlagDefinitions.pwaFallback.defaultValue;
const shouldEnablePwaFallback =
  process.env.ENABLE_PWA_FALLBACK === "1" ||
  (process.env.DISABLE_PWA_FALLBACK !== "1" && fallbackFeatureDefault);

const withPWA = createWithPwa({
  fallbackEnabled: shouldEnablePwaFallback,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  publicRuntimeConfig: {
    featureFlags: {
      pwaFallback: shouldEnablePwaFallback,
      nfcReferenceCards: featureFlagDefinitions.nfcReferenceCards.defaultValue,
      memberVouchers: featureFlagDefinitions.memberVouchers.defaultValue,
      memberLoans: featureFlagDefinitions.memberLoans.defaultValue,
    },
  },

  // Enable optimized image handling
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
  },

  transpilePackages: ["@ibimina/config", "@ibimina/lib", "@ibimina/locales", "@ibimina/ui"],

  async headers() {
    const securityHeaders = createSecureHeaders();
    const dnsPrefetchHeader = { key: "X-DNS-Prefetch-Control", value: "on" } as const;

    const baseHeaders = [
      ...securityHeaders,
      dnsPrefetchHeader,
      ...(process.env.NODE_ENV === "production" ? [HSTS_HEADER] : []),
    ];

    const staticAssetHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];

    const immutableAssetHeaders = [...staticAssetHeaders];

    const manifestHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
    ];

    const serviceWorkerHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
    ];

    const assetLinksHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
      { key: "Content-Type", value: "application/json" },
    ];

    return [
      {
        source: "/_next/static/:path*",
        headers: staticAssetHeaders,
      },
      {
        source: "/fonts/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/icons/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/manifest.json",
        headers: manifestHeaders,
      },
      {
        source: "/service-worker.js",
        headers: serviceWorkerHeaders,
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: assetLinksHeaders,
      },
      {
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },
};

const sentryPluginOptions = { silent: true } as const;
const sentryBuildOptions = { hideSourceMaps: true, disableLogger: true } as const;

export default withSentryConfig(withPWA(nextConfig), sentryPluginOptions, sentryBuildOptions);
