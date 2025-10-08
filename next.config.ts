import type { NextConfig } from "next";
import path from "path";

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "./"),
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
