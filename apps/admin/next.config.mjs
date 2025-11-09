const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
  {
    protocol: "https",
    hostname: "*.supabase.in",
    pathname: "/storage/v1/object/public/**",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl);
    if (hostname && !remotePatterns.some((pattern) => pattern.hostname === hostname)) {
      remotePatterns.push({
        protocol: "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      });
    }
  } catch (error) {
    console.warn(
      "[next.config] Failed to parse NEXT_PUBLIC_SUPABASE_URL for remotePatterns",
      error
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns,
  },
  experimental: {
    serverActions: false,
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

export default nextConfig;
