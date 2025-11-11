import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import PWA configuration conditionally
let withPWA = (config) => config;
try {
  const pwaModule = await import("./next.config.pwa.mjs");
  withPWA = pwaModule.default;
} catch {
  // PWA config not available, continue without it
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Ensure output tracing resolves from the monorepo root
  outputFileTracingRoot: path.join(__dirname, "../../.."),
  images: {
    unoptimized: true,
  },
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint configuration - ignore during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack fallbacks for node: protocol and edge runtime
  webpack: (config, { isServer, webpack }) => {
    // Handle node: protocol imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
        async_hooks: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);
