import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withSentryMiddleware } from "@sentry/nextjs/middleware";

import {
  HSTS_HEADER,
  SECURITY_HEADERS,
  createContentSecurityPolicy,
  createNonce,
  createRequestId,
} from "@/lib/security/headers";
import { resolveEnvironment, scrubPII } from "@ibimina/lib";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const PUBLIC_ROUTES = new Set([
  "/login",
  "/offline",
  "/auth/callback",
  "/auth/first-login",
]);

const PUBLIC_PREFIXES = [
  "/api",
  "/_next",
  "/icons",
  "/manifest",
  "/service-worker.js",
  "/assets",
  "/favicon.ico",
  "/.well-known",
];

function hasSupabaseSessionCookie(request: NextRequest) {
  const cookies = request.cookies.getAll();
  return cookies.some(({ name, value }) => {
    if (!value) {
      return false;
    }
    if (name === "stub-auth" && value === "1") {
      return true;
    }
    if (name === "supabase-auth-token" || name === "sb-access-token") {
      return true;
    }
    return /^sb-.*-auth-token$/i.test(name) || /^supabase-session/.test(name);
  });
}

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

const middlewareImpl = (request: NextRequest) => {
  const startedAt = Date.now();
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const pathname = request.nextUrl.pathname;
  if (!hasSupabaseSessionCookie(request) && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const requestId = requestHeaders.get("x-request-id") ?? createRequestId();

    // Initialize response properly
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Set CSP header
    const csp = createContentSecurityPolicy({ nonce, isDev, supabaseUrl });
    response.headers.set("Content-Security-Policy", csp);

    // Apply security headers
    for (const header of SECURITY_HEADERS) {
      response.headers.set(header.key, header.value);
    }

    // HSTS in production only
    if (!isDev) {
      response.headers.set(HSTS_HEADER.key, HSTS_HEADER.value);
    }

    response.headers.set("X-Request-ID", requestId);

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      data: {
        requestId: requestHeaders.get("x-request-id"),
        path: request.nextUrl.pathname,
        method: request.method,
      },
    });
    throw error;
  } finally {
    const logPayload = {
      event: "admin.middleware.complete",
      environment: resolveEnvironment(),
      requestId: requestHeaders.get("x-request-id"),
      method: request.method,
      url: request.nextUrl.pathname,
      durationMs: Date.now() - startedAt,
    } as const;

    console.log(JSON.stringify(scrubPII(logPayload)));
  }
};

export const middleware = withSentryMiddleware(middlewareImpl, {
  captureResponse: true,
  waitForTransaction: true,
});

Sentry.setTag("middleware", "admin");

export const config = {
  matcher: [
    // Run middleware on everything EXCEPT these paths
    "/((?!_next/static|_next/image|favicon.ico|icons/|robots.txt|manifest.json|manifest.webmanifest|service-worker.js|assets|offline|api).*)",
  ],
};
