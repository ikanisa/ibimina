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

export function createNonce() {
  throw new Error("Not implemented - inline from @ibimina/lib if needed");
}

export function createRequestId() {
  throw new Error("Not implemented - inline from @ibimina/lib if needed");
}
