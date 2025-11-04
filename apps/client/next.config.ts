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

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : process.env.SUPABASE_URL
    ? new URL(process.env.SUPABASE_URL).hostname
    : undefined;

const remotePatterns = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "storage.googleapis.com" },
] as const;

if (supabaseHost) {
  (remotePatterns as Array<{ protocol: string; hostname: string }>).push({
    protocol: "https",
    hostname: supabaseHost,
  });
}

const nextConfig: NextConfig = {
  // Use standalone for Docker/Node deployments, but not for Cloudflare
  output: process.env.CLOUDFLARE_BUILD === "1" ? undefined : "standalone",
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
    remotePatterns,
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
  },

  transpilePackages: ["@ibimina/config", "@ibimina/lib", "@ibimina/locales", "@ibimina/ui"],

  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },

  // Enable Turbopack for Next.js 15+ - always use monorepo root for dependencies
  turbopack: {
    root: path.join(__dirname, "../../"),
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Performance: Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackBuildWorker: true,
    // Force webpack for Cloudflare builds (Turbopack can have issues with adapters)
    ...(process.env.CLOUDFLARE_BUILD === "1" && {
      turbo: false,
    }),
  },

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

// Disable PWA wrapper for Cloudflare builds (service worker is built separately)
const enhancedConfig = process.env.CLOUDFLARE_BUILD === "1" ? nextConfig : withPWA(nextConfig);

export default withSentryConfig(enhancedConfig, sentryPluginOptions, sentryBuildOptions);
