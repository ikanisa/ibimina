import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  HSTS_HEADER,
  SECURITY_HEADERS,
  createContentSecurityPolicy,
  createNonce,
} from "@/lib/security/headers";

const isDev = process.env.NODE_ENV !== "production";

export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const csp = createContentSecurityPolicy({ nonce, isDev });
  response.headers.set("Content-Security-Policy", csp);

  for (const header of SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }

  if (!isDev) {
    response.headers.set(HSTS_HEADER.key, HSTS_HEADER.value);
  }

  const requestId = requestHeaders.get("x-request-id") ?? (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  response.headers.set("X-Request-ID", requestId);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|robots.txt|manifest.json|service-worker.js).*)",
  ],
};
