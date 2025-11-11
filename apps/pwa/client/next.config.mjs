// ESM configuration for Next.js
import path from "path";
import { fileURLToPath } from "url";
import { featureFlagDefinitions } from "@ibimina/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Next.js configuration for SACCO+ Client App
 *
 * This configuration enables:
 * - React strict mode for better development experience
 * - Optimized production builds with tree-shaking
 * - PWA capabilities with service worker and aggressive caching
 * - Performance optimizations for images and bundles
 */

// Security headers
const SECURITY_HEADERS = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};

const fallbackFeatureDefault = featureFlagDefinitions.pwaFallback.defaultValue;
const shouldEnablePwaFallback =
  process.env.ENABLE_PWA_FALLBACK === "1" ||
  (process.env.DISABLE_PWA_FALLBACK !== "1" && fallbackFeatureDefault);

let withPWA = (config) => config;
try {
  const withPWAInit = (await import("next-pwa")).default;
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../.."),

  // Ignore ESLint errors during build (known issues in client app)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance: Enable Next.js image optimization with responsive loading
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: false, // Enable Next.js image optimization
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance: Transpile workspace packages
  transpilePackages: ["@ibimina/config", "@ibimina/lib", "@ibimina/locales", "@ibimina/ui"],

  // Performance: Tree-shaking for lucide-react
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },

  // Performance: Optimize builds
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Performance: HTTP caching headers for static assets
  async headers() {
    const baseHeaders = [...SECURITY_HEADERS];
    if (process.env.NODE_ENV === "production") {
      baseHeaders.push(HSTS_HEADER);
    }

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

    const staticAssetHeaders = [
      ...baseHeaders,
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
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
        source: "/icons/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/fonts/:path*",
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

  // Webpack configuration for Node.js modules in browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide fallbacks for node modules in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        readline: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
        util: false,
        os: false,
        path: false,
      };
    }
    return config;
  },

  // Performance: Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackBuildWorker: true,
    serverExternalPackages: ["posthog-node"],
  },
};

export default withPWA(nextConfig);
