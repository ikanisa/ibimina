import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stub environment variables for E2E tests
if (process.env.AUTH_E2E_STUB === "1") {
  const ensure = (key, fallback) => {
    const current = process.env[key];
    if (typeof current !== "string" || current.trim().length === 0) {
      process.env[key] = fallback;
    }
  };

  ensure("NEXT_PUBLIC_SUPABASE_URL", "https://stub.supabase.local");
  ensure("NEXT_PUBLIC_SUPABASE_ANON_KEY", "stub-anon-key");
  ensure("SUPABASE_SERVICE_ROLE_KEY", "stub-service-role-key");
  ensure("BACKUP_PEPPER", "stub-backup-pepper");
  ensure("MFA_SESSION_SECRET", "stub-mfa-session-secret");
  ensure("TRUSTED_COOKIE_SECRET", "stub-trusted-cookie-secret");
  ensure("HMAC_SHARED_SECRET", "stub-hmac-shared-secret");
  ensure("OPENAI_API_KEY", "stub-openai-api-key");
  ensure("KMS_DATA_KEY_BASE64", "ZGV2LWttcy1kYXRhLWtleS0zMi1ieXRlcyEhISEhISE=");
}

const resolvedBuildId =
  process.env.NEXT_PUBLIC_BUILD_ID ??
  process.env.GIT_COMMIT_SHA ??
  `local-${Date.now().toString(36)}`;

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "api.qrserver.com",
    pathname: "/v1/create-qr-code/**",
  },
];

try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns.push({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    });
  }
} catch (error) {
  console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL", error);
}

// Security headers
const SECURITY_HEADERS = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};

// PWA configuration
let withPWA = (config) => config;
try {
  const withPWAInit = (await import("next-pwa")).default;
  withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development" || process.env.DISABLE_PWA === "1",
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

// Bundle analyzer configuration
let withBundleAnalyzer = (config) => config;
try {
  const withBundleAnalyzerInit = (await import("@next/bundle-analyzer")).default;
  withBundleAnalyzer = withBundleAnalyzerInit({
    enabled: process.env.ANALYZE_BUNDLE === "1",
    openAnalyzer: false,
    analyzerMode: "static",
    reportFilename: "admin.html",
    generateStatsFile: true,
    statsFilename: "bundle-stats.json",
    defaultSizes: "gzip",
  });
} catch {
  console.warn("@next/bundle-analyzer not available; skip bundle report generation.");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "./"),
  env: {
    NEXT_PUBLIC_BUILD_ID: resolvedBuildId,
  },

  // Performance: Optimize images
  images: {
    remotePatterns,
    unoptimized: false, // Enable Next.js image optimization
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  poweredByHeader: false,

  // Performance: Transpile workspace packages
  transpilePackages: ["@ibimina/config", "@ibimina/ui"],

  // Performance: Tree-shaking for lucide-react
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },

  // Performance: Optimize builds
  swcMinify: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance: HTTP caching headers
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
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },

  // Performance: Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    webpackBuildWorker: true,
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));
