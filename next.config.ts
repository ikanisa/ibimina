import type { NextConfig } from "next";
import path from "path";
import { HSTS_HEADER, SECURITY_HEADERS } from "./lib/security/headers";
import { env } from "./src/env.server";

const resolvedBuildId =
  env.NEXT_PUBLIC_BUILD_ID ??
  env.GIT_COMMIT_SHA ??
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
  const { hostname } = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  remotePatterns.push({
    protocol: "https",
    hostname,
    pathname: "/storage/v1/object/public/**",
  });
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
    disable: env.NODE_ENV === "development" || env.DISABLE_PWA === "1",
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
    enabled: env.ANALYZE_BUNDLE === "1",
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
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
  },
  poweredByHeader: false,
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },
  async headers() {
    const baseHeaders = [...SECURITY_HEADERS];
    if (env.NODE_ENV === "production") {
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
