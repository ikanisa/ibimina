import type { NextConfig } from "next";

/**
 * Next.js configuration for SACCO+ Client App
 *
 * This configuration enables:
 * - React strict mode for better development experience
 * - Optimized production builds
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enable optimized image handling
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
