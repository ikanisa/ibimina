import type { NextConfig } from "next";
import path from "path";
import { HSTS_HEADER, SECURITY_HEADERS } from "./lib/security/headers";

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

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const { hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns.push({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    });
  } catch (error) {
    console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL", error);
  }
}

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
  });
} catch {
  console.warn("next-pwa not available during local build; proceeding without service worker bundling.");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "./"),
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
  },
  poweredByHeader: false,
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

export default withPWA(nextConfig);
