import type { NextConfig } from "next";
import path from "path";

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
    disable: process.env.NODE_ENV === "development",
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
};

export default withPWA(nextConfig);
