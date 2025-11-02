import { getRuntimeConfig } from "../../src/lib/runtime-config";

type DirectiveMap = Record<string, string[]>;

const runtimeCrypto = globalThis.crypto;

const baseDirectives: DirectiveMap = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "frame-src": ["'self'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    "https://api.qrserver.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
  "prefetch-src": ["'self'"],
};

const runtimeConfig = (() => {
  try {
    return getRuntimeConfig();
  } catch {
    return null;
  }
})();

const staticSecurityHeaders: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), xr-spatial-tracking=()",
  },
];

const hstsHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
} as const;

export const SECURITY_HEADERS = staticSecurityHeaders;
export const HSTS_HEADER = hstsHeader;

export type CspOptions = {
  nonce: string;
  isDev?: boolean;
  supabaseUrl?: string;
};

type AllowlistOptions = {
  connect?: boolean;
  image?: boolean;
  script?: boolean;
  style?: boolean;
};

function normalizeUrl(candidate: string): string {
  if (!candidate) {
    return "";
  }

  if (/^https?:/i.test(candidate)) {
    return candidate;
  }

  return `https://${candidate}`;
}

function allowUrl(
  directives: DirectiveMap,
  candidate: string | undefined,
  { connect = true, image = false, script = false, style = false }: AllowlistOptions = {}
): void {
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

    if (style) {
      directives["style-src"].push(origin);
    }
  } catch (error) {
    console.warn("Invalid URL provided for CSP allowlist", candidate, error);
  }
}

function serializeDirectives(map: DirectiveMap): string {
  return Object.entries(map)
    .map(([key, values]) => {
      const uniqueValues = Array.from(new Set(values)).filter((value) => value.trim().length > 0);
      return uniqueValues.length > 0 ? `${key} ${uniqueValues.join(" ")}` : key;
    })
    .join("; ");
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  if (typeof btoa === "function") {
    return btoa(binary);
  }

  return Buffer.from(binary, "binary").toString("base64");
}

function sanitizeUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

export function createNonce(size = 16): string {
  const cryptoImpl = globalThis.crypto ?? runtimeCrypto;

  if (typeof cryptoImpl?.getRandomValues === "function") {
    const buffer = new Uint8Array(size);
    cryptoImpl.getRandomValues(buffer);
    return encodeBase64(buffer);
  }

  if (typeof cryptoImpl?.randomUUID === "function") {
    return sanitizeUuid(cryptoImpl.randomUUID());
  }

  throw new Error("Secure random number generation is unavailable in this runtime");
}

export function createRequestId(): string {
  const cryptoImpl = globalThis.crypto ?? runtimeCrypto;

  if (typeof cryptoImpl?.randomUUID === "function") {
    return cryptoImpl.randomUUID();
  }

  if (typeof cryptoImpl?.getRandomValues === "function") {
    const buffer = new Uint8Array(16);
    cryptoImpl.getRandomValues(buffer);
    return Array.from(buffer)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  throw new Error("Secure random number generation is unavailable in this runtime");
}

export function createContentSecurityPolicy({ nonce, isDev, supabaseUrl }: CspOptions): string {
  const directives: DirectiveMap = JSON.parse(JSON.stringify(baseDirectives));
  directives["script-src"] = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) {
    directives["script-src"].push("'unsafe-eval'");
    directives["connect-src"].push("ws://localhost:3000", "ws://127.0.0.1:3000");
  }

  const resolvedSupabaseUrl =
    supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (resolvedSupabaseUrl) {
    try {
      const { origin } = new URL(resolvedSupabaseUrl);
      const websocketOrigin = origin.replace(/^https:/, "wss:");
      directives["connect-src"].push(origin, websocketOrigin);
      directives["img-src"].push(`${origin}/storage/v1/object/public`);
    } catch (error) {
      console.warn("Invalid Supabase URL provided for CSP", error);
    }
  }

  allowUrl(directives, runtimeConfig?.siteUrl, { connect: true, image: true });
  allowUrl(directives, process.env.NEXT_PUBLIC_SITE_URL, { connect: true, image: true });
  allowUrl(directives, process.env.SITE_URL, { connect: true, image: true });
  allowUrl(directives, process.env.NEXT_PUBLIC_POSTHOG_HOST ?? process.env.POSTHOG_HOST, {
    connect: true,
    image: true,
    script: true,
  });

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  allowUrl(directives, sentryDsn, { connect: true });

  directives["style-src"].push("https://rsms.me/inter/inter.css");
  directives["img-src"].push("https://avatars.githubusercontent.com");

  directives["upgrade-insecure-requests"] = [""];

  return serializeDirectives(directives);
}
