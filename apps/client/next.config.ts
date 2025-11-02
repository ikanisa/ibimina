import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { featureFlagDefinitions } from "@ibimina/config";
import { HSTS_HEADER, createSecureHeaders } from "@ibimina/lib";

/**
 * Next.js configuration for SACCO+ Client App
 *
 * This configuration enables:
 * - React strict mode for better development experience
 * - Optimized production builds
 * - PWA capabilities with service worker
 */

let withPWA = (config: NextConfig) => config;

const fallbackFeatureDefault = featureFlagDefinitions.pwaFallback.defaultValue;
const shouldEnablePwaFallback =
  process.env.ENABLE_PWA_FALLBACK === "1" ||
  (process.env.DISABLE_PWA_FALLBACK !== "1" && fallbackFeatureDefault);

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWAInit = require("next-pwa");
  withPWA = withPWAInit({
    dest: "public",
    disable:
      process.env.NODE_ENV === "development" ||
      process.env.DISABLE_PWA === "1" ||
      !shouldEnablePwaFallback,
    register: true,
    skipWaiting: true,
    sw: "service-worker.js",
    swSrc: "workers/service-worker.ts",
    buildExcludes: [/middleware-manifest\.json$/],
  });
} catch {
  console.warn(
    "next-pwa not available during local build; proceeding without service worker bundling."
  );
}

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
  reactStrictMode: true,
  poweredByHeader: false,
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

  async headers() {
    const securityHeaders = createSecureHeaders();
    const dnsPrefetchHeader = { key: "X-DNS-Prefetch-Control", value: "on" } as const;

    const baseHeaders = [
      ...securityHeaders,
      dnsPrefetchHeader,
      ...(process.env.NODE_ENV === "production" ? [HSTS_HEADER] : []),
    ];

    const immutableAssetHeaders = [
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
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },
};

const sentryPluginOptions = { silent: true } as const;
const sentryBuildOptions = { hideSourceMaps: true, disableLogger: true } as const;

export default withSentryConfig(withPWA(nextConfig), sentryPluginOptions, sentryBuildOptions);
