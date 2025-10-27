import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  HSTS_HEADER,
  SECURITY_HEADERS,
  createContentSecurityPolicy,
  createNonce,
  createRequestId,
} from "@ibimina/lib";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const csp = createContentSecurityPolicy({ nonce, isDev, supabaseUrl });
  response.headers.set("Content-Security-Policy", csp);

  for (const header of SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }

  if (!isDev) {
    response.headers.set(HSTS_HEADER.key, HSTS_HEADER.value);
  }

  const requestId = requestHeaders.get("x-request-id") ?? createRequestId();
  response.headers.set("X-Request-ID", requestId);

  return response;
}

// Middleware runs on all routes except static assets and API routes
// This pattern is standard for Next.js middleware matchers
export const config = {
  matcher: [
    // Run middleware on everything EXCEPT these paths
    "/((?!_next/static|_next/image|favicon.ico|icons/|robots.txt|manifest.json|manifest.webmanifest|service-worker.js|assets|offline|api).*)",
  ],
};
