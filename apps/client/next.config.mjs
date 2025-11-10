import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { withSentryConfig } from "@sentry/nextjs";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_FEATURE_FLAGS = Object.freeze({
  pwaFallback: { defaultValue: true },
  nfcReferenceCards: { defaultValue: false },
  memberVouchers: { defaultValue: false },
  memberLoans: { defaultValue: false },
});

let featureFlagDefinitions = FALLBACK_FEATURE_FLAGS;
try {
  const configModule = await import("@ibimina/config");
  if (configModule?.featureFlagDefinitions) {
    featureFlagDefinitions = configModule.featureFlagDefinitions;
  }
} catch (error) {
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "@ibimina/config is not available; falling back to default feature flag values.",
      error
    );
  }
}

const FALLBACK_SECURITY_HEADERS = Object.freeze([
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), xr-spatial-tracking=()",
  },
]);

const FALLBACK_HSTS_HEADER = Object.freeze({
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
});

let createSecureHeaders = () => [...FALLBACK_SECURITY_HEADERS];
let HSTS_HEADER = FALLBACK_HSTS_HEADER;
try {
  const libModule = await import("@ibimina/lib");
  if (libModule?.createSecureHeaders) {
    createSecureHeaders = libModule.createSecureHeaders;
  }
  if (libModule?.HSTS_HEADER) {
    HSTS_HEADER = libModule.HSTS_HEADER;
  }
} catch (error) {
  if (process.env.NODE_ENV !== "test") {
    console.warn("@ibimina/lib is not available; using fallback security headers.", error);
  }
}

function createWithPwa({
  fallbackEnabled = true,
  serviceWorkerSource = "workers/service-worker.ts",
} = {}) {
  let withPWA = (config) => config;

  try {
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
      console.warn("next-pwa not available; continuing without service worker bundling.", error);
    }
  }

  return withPWA;
}

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
];

if (supabaseHost) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHost,
  });
}

const nextConfig = {
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
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackBuildWorker: true,
    ...(process.env.CLOUDFLARE_BUILD === "1" && {
      turbo: false,
    }),
  },
  async headers() {
    const securityHeaders = createSecureHeaders();
    const dnsPrefetchHeader = { key: "X-DNS-Prefetch-Control", value: "on" };

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

const sentryPluginOptions = { silent: true };
const sentryBuildOptions = { hideSourceMaps: true, disableLogger: true };

const enhancedConfig = process.env.CLOUDFLARE_BUILD === "1" ? nextConfig : withPWA(nextConfig);

export default withSentryConfig(enhancedConfig, sentryPluginOptions, sentryBuildOptions);
