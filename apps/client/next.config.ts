import type { NextConfig } from "next";

/**
 * Next.js configuration for SACCO+ Client App
 * 
 * This configuration enables:
 * - React strict mode for better development experience
 * - Optimized production builds
 * - PWA capabilities with service worker
 */

let withPWA = (config: NextConfig) => config;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWAInit = require("next-pwa");
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
  console.warn("next-pwa not available during local build; proceeding without service worker bundling.");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Enable optimized image handling
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
    minimumCacheTTL: 3600,
    deviceSizes: [360, 414, 640, 768, 828, 1080, 1280, 1440, 1920],
  },
  
  async headers() {
    const baseHeaders = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
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

export default withPWA(nextConfig);
