import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { HSTS_HEADER, createSecureHeaders } from "@ibimina/lib";
import { createWithPwa } from "../../config/next/withPwa";

const withPWA = createWithPwa();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: false,
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  transpilePackages: ["@ibimina/config", "@ibimina/lib", "@ibimina/locales", "@ibimina/ui"],
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  async headers() {
    const baseHeaders = [...createSecureHeaders(), { key: "X-DNS-Prefetch-Control", value: "on" }];

    if (process.env.NODE_ENV === "production") {
      baseHeaders.push(HSTS_HEADER);
    }

    const staticAssetHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];

    const manifestHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
    ];

    const serviceWorkerHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
    ];

    return [
      {
        source: "/_next/static/:path*",
        headers: staticAssetHeaders,
      },
      {
        source: "/icons/:path*",
        headers: staticAssetHeaders,
      },
      {
        source: "/fonts/:path*",
        headers: staticAssetHeaders,
      },
      {
        source: "/manifest.webmanifest",
        headers: manifestHeaders,
      },
      {
        source: "/service-worker.js",
        headers: serviceWorkerHeaders,
      },
      {
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackBuildWorker: true,
  },
};

// Only apply Sentry build-time configuration when DSN is available
// This prevents DNS/network errors when Sentry is not configured or blocked
const hasSentryDsn = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

const enhancedConfig = withPWA(nextConfig);

let finalConfig: NextConfig;

if (hasSentryDsn) {
  const sentryPluginOptions = { silent: true } as const;
  const sentryBuildOptions = { hideSourceMaps: true, disableLogger: true } as const;
  finalConfig = withSentryConfig(enhancedConfig, sentryPluginOptions, sentryBuildOptions);
} else {
  console.log("[next.config] Sentry DSN not configured - skipping Sentry build integration");
  finalConfig = enhancedConfig;
}

export default finalConfig;
