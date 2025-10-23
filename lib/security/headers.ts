import { getRuntimeConfig } from "../../src/lib/runtime-config";

type DirectiveMap = Record<string, string[]>;

const runtimeCrypto = globalThis.crypto;

const baseDirectives: DirectiveMap = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "frame-src": ["'self'"],
  "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://api.qrserver.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
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
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
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
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (supabaseUrl) {
  try {
    const { origin } = new URL(supabaseUrl);
    const websocketOrigin = origin.replace(/^https:/, "wss:");
    baseDirectives["connect-src"].push(origin, websocketOrigin);
    baseDirectives["img-src"].push(`${origin}/storage/v1/object/public`);
  } catch (error) {
    console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL provided for CSP", error);
  }
}

if (runtimeConfig?.siteUrl) {
  try {
    const { origin } = new URL(runtimeConfig.siteUrl);
    baseDirectives["connect-src"].push(origin);
    baseDirectives["img-src"].push(origin);
  } catch (error) {
    console.warn("Invalid siteUrl provided in runtime config for CSP allowlist", error);
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

export function createContentSecurityPolicy({ nonce, isDev }: CspOptions): string {
  const directives: DirectiveMap = JSON.parse(JSON.stringify(baseDirectives));
  directives["script-src"] = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) {
    directives["script-src"].push("'unsafe-eval'");
    directives["connect-src"].push("ws://localhost:3000", "ws://127.0.0.1:3000");
  }

  directives["style-src"].push("https://rsms.me/inter/inter.css");
  directives["img-src"].push("https://avatars.githubusercontent.com");

  directives["upgrade-insecure-requests"] = [""];

  return serializeDirectives(directives);
}
