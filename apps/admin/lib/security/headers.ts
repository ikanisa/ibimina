// Temporarily inlining to avoid build dependency issues
const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
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

const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
} as const;

export { HSTS_HEADER, SECURITY_HEADERS };

export function createSecureHeaders(): Array<{ key: string; value: string }> {
  return [...SECURITY_HEADERS];
}

// Stub exports for compatibility - implement if needed
export function createContentSecurityPolicy() {
  throw new Error("Not implemented - inline from @ibimina/lib if needed");
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
