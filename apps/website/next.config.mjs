import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Next.js configuration for SACCO+ Website
 *
 * Marketing and promotional website for Ibimina platform.
 * Optimized for static generation and Cloudflare Pages deployment.
 */

// Security headers
const SECURITY_HEADERS = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Static export for marketing site
  output: "export",

  // Performance: Enable Next.js image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true, // Required for static export
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
        source: "/images/:path*",
        headers: staticAssetHeaders,
      },
      {
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },

  // Performance: Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackBuildWorker: true,
  },
};

export default nextConfig;
