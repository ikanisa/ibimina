import type { NextConfig } from "next";
import path from "path";
import { HSTS_HEADER, SECURITY_HEADERS } from "./lib/security/headers";

if (process.env.AUTH_E2E_STUB === "1") {
  const ensure = (key: string, fallback: string) => {
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

const remotePatterns: Array<{ protocol: "https"; hostname: string; pathname?: string }> = [
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

let withPWA = (config: NextConfig) => config;
let withBundleAnalyzer = (config: NextConfig) => config;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWAInit = require("next-pwa");
  withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development" || process.env.DISABLE_PWA === "1",
    register: true,
    skipWaiting: true,
    sw: "service-worker.js",
  });
} catch {
  console.warn("next-pwa not available during local build; proceeding without service worker bundling.");
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withBundleAnalyzerInit = require("@next/bundle-analyzer");
  withBundleAnalyzer = withBundleAnalyzerInit({
    enabled: process.env.ANALYZE_BUNDLE === "1",
    openAnalyzer: false,
    analyzerMode: "static",
    reportFilename: "client.html",
    generateStatsFile: true,
    statsFilename: "bundle-stats.json",
    defaultSizes: "gzip",
  });
} catch {
  console.warn("@next/bundle-analyzer not available; skip bundle report generation.");
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "./"),
  env: {
    NEXT_PUBLIC_BUILD_ID: resolvedBuildId,
  },
  images: {
    remotePatterns,
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
  },
  poweredByHeader: false,
  transpilePackages: ['@ibimina/config', '@ibimina/ui'],
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },
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

export default withBundleAnalyzer(withPWA(nextConfig));
