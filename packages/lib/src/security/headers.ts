/**
 * Shared security headers library for all Next.js applications
 *
 * This module provides secure HTTP headers including:
 * - Content Security Policy (CSP)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options, X-Content-Type-Options, etc.
 */

type DirectiveMap = Record<string, string[]>;

/**
 * Base CSP directives for all applications
 */
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
  // Note: 'unsafe-inline' is commonly used for CSS-in-JS libraries and Next.js styled-jsx
  // Consider using nonce or hash-based styles for stricter CSP in the future
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
};

/**
 * Static security headers applied to all responses
 */
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

/**
 * HSTS header for production environments
 */
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

/**
 * Serialize CSP directives into a policy string
 */
function serializeDirectives(map: DirectiveMap): string {
  return Object.entries(map)
    .map(([key, values]) => {
      const uniqueValues = Array.from(new Set(values)).filter((value) => value.trim().length > 0);
      return uniqueValues.length > 0 ? `${key} ${uniqueValues.join(" ")}` : key;
    })
    .join("; ");
}

/**
 * Encode bytes to base64
 */
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

/**
 * Sanitize UUID by removing dashes
 */
function sanitizeUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

/**
 * Create a cryptographically secure nonce for CSP
 *
 * @param size - The number of random bytes to generate (default: 16)
 * @returns A base64-encoded string of cryptographically secure random bytes
 * @throws Error if secure random number generation is unavailable
 */
export function createNonce(size = 16): string {
  const cryptoImpl = globalThis.crypto;

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

/**
 * Create a unique request ID
 */
export function createRequestId(): string {
  const cryptoImpl = globalThis.crypto;

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

/**
 * Create a Content Security Policy with nonce-based script execution
 */
export function createContentSecurityPolicy({
  nonce,
  isDev = false,
  supabaseUrl,
}: CspOptions): string {
  const directives: DirectiveMap = JSON.parse(JSON.stringify(baseDirectives));

  // Configure script-src with nonce and strict-dynamic
  directives["script-src"] = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];

  // Note: 'unsafe-eval' is required for Next.js development mode (HMR, Fast Refresh)
  // This is automatically disabled in production builds
  if (isDev) {
    directives["script-src"].push("'unsafe-eval'");
    directives["connect-src"].push("ws://localhost:3000", "ws://127.0.0.1:3000");
  }

  // Add Supabase URL to allowed origins if provided
  if (supabaseUrl) {
    try {
      const { origin } = new URL(supabaseUrl);
      const websocketOrigin = origin.replace(/^https:/, "wss:");
      directives["connect-src"].push(origin, websocketOrigin);
      directives["img-src"].push(`${origin}/storage/v1/object/public`);
    } catch (error) {
      console.warn("Invalid Supabase URL provided for CSP", error);
    }
  }

  // Add additional style and image sources
  directives["style-src"].push("https://rsms.me/inter/inter.css");
  directives["img-src"].push("https://avatars.githubusercontent.com");

  // Force upgrade insecure requests in production
  directives["upgrade-insecure-requests"] = [""];

  return serializeDirectives(directives);
}

/**
 * Create secure headers for Next.js configuration
 *
 * @returns Array of header configuration objects for Next.js
 */
export function createSecureHeaders(): Array<{ key: string; value: string }> {
  return [...SECURITY_HEADERS];
}
