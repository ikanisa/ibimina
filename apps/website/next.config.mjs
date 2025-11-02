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
const baseDirectives = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
  "prefetch-src": ["'self'"],
};

const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};

const PERMISSIONS_POLICY_VALUE =
  "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), xr-spatial-tracking=()";

const staticSecurityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY_VALUE },
];

function normalizeUrl(candidate) {
  if (!candidate) {
    return "";
  }

  if (/^https?:/i.test(candidate)) {
    return candidate;
  }

  return `https://${candidate}`;
}

function allowUrl(directives, candidate, { connect = true, image = false, script = false } = {}) {
  if (!candidate) {
    return;
  }

  try {
    const url = new URL(normalizeUrl(candidate));
    const origin = url.origin;

    if (connect) {
      directives["connect-src"].push(origin);
      if (url.protocol === "https:") {
        directives["connect-src"].push(origin.replace(/^https:/, "wss:"));
      }
    }

    if (image) {
      directives["img-src"].push(origin);
    }

    if (script) {
      directives["script-src"] = directives["script-src"] ?? [];
      directives["script-src"].push(origin);
    }
  } catch (error) {
    console.warn("[website] Invalid URL provided for CSP allowlist", candidate, error);
  }
}

function serializeDirectives(map) {
  return Object.entries(map)
    .map(([key, values]) => {
      const uniqueValues = Array.from(new Set(values)).filter((value) => value.trim().length > 0);
      return uniqueValues.length > 0 ? `${key} ${uniqueValues.join(" ")}` : key;
    })
    .join("; ");
}

function createContentSecurityPolicy() {
  const directives = JSON.parse(JSON.stringify(baseDirectives));
  directives["script-src"] = ["'self'", "'unsafe-inline'"];

  allowUrl(directives, process.env.NEXT_PUBLIC_SITE_URL, { connect: true, image: true });
  allowUrl(directives, process.env.NEXT_PUBLIC_APP_URL, { connect: true, image: true });
  allowUrl(directives, process.env.NEXT_PUBLIC_POSTHOG_HOST ?? process.env.POSTHOG_HOST, {
    connect: true,
    image: true,
    script: true,
  });
  allowUrl(directives, process.env.NEXT_PUBLIC_SUPABASE_URL, {
    connect: true,
    image: true,
  });

  directives["style-src"].push("https://rsms.me/inter/inter.css");
  directives["img-src"].push("https://api.qrserver.com");
  directives["upgrade-insecure-requests"] = [""];

  return serializeDirectives(directives);
}

function buildSecurityHeaders() {
  const headers = [
    ...staticSecurityHeaders,
    { key: "Content-Security-Policy", value: createContentSecurityPolicy() },
  ];

  if (process.env.NODE_ENV === "production") {
    headers.push(HSTS_HEADER);
  }

  return headers;
}

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
    const baseHeaders = buildSecurityHeaders();

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
