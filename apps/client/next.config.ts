import type { NextConfig } from "next";
import path from "path";
import { createWithPwa } from "../../config/next/withPwa";

/**
 * Next.js configuration for SACCO+ Client App
 *
 * This configuration enables:
 * - React strict mode for better development experience
 * - Optimized production builds with tree-shaking
 * - PWA capabilities with service worker and aggressive caching
 * - Performance optimizations for images and bundles
 * - Cloudflare Pages deployment support
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

// Remote image patterns for client app
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

// Add Supabase storage pattern if configured
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

const withPWA = createWithPwa();

const nextConfig: NextConfig = {
  // Use standalone for Docker/Node deployments, but not for Cloudflare
  output: process.env.CLOUDFLARE_BUILD === "1" ? undefined : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // For monorepo: always set to match turbopack.root
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Ignore ESLint errors during build (known issues in client app)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Performance: Image optimization
  // Cloudflare Pages requires unoptimized images
  images: {
    remotePatterns,
    unoptimized: process.env.CLOUDFLARE_BUILD === "1" ? true : false,
    formats: ["image/avif", "image/webp"],
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

  // Webpack configuration for Node.js modules in browser
  webpack: (config, { isServer, webpack }) => {
    // Handle node: protocol imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

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
        async_hooks: false,
      };
    }
    return config;
  },

  // Enable Turbopack for Next.js 16 - always use monorepo root for dependencies
  turbopack: {
    root: path.join(__dirname, "../../"),
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

  // Performance: Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackBuildWorker: true,
    serverExternalPackages: ["posthog-node"],
    // Force webpack for Cloudflare builds (Turbopack has issues with monorepos)
    ...(process.env.CLOUDFLARE_BUILD === "1" && {
      turbo: false,
    }),
  },
};

// Apply PWA wrapper (skipped for Cloudflare builds)
const finalConfig =
  process.env.CLOUDFLARE_BUILD === "1" ? nextConfig : withPWA(nextConfig);

export default finalConfig;
