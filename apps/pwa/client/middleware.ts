import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
// Sentry middleware wrapper not available in this version
// import { withSentryMiddleware } from "@sentry/nextjs/middleware";

import { resolveEnvironment, scrubPII, createSecurityMiddlewareContext } from "@ibimina/lib";
import { defaultLocale } from "./i18n";

export const PUBLIC_ROUTES = new Set([
  "/login",
  "/welcome",
  "/onboard",
  "/offline",
  "/help",
  "/privacy",
  "/terms",
]);

export const PUBLIC_PREFIXES = [
  "/api",
  "/_next",
  "/icons",
  "/manifest",
  "/service-worker.js",
  "/assets",
  "/store-assets",
  "/favicon.ico",
  "/.well-known",
  "/share",
  "/share-target",
];

export function hasSupabaseSessionCookie(request: NextRequest) {
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

export function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const middlewareImpl = (request: NextRequest) => {
  const startedAt = Date.now();
  const environment = resolveEnvironment();
  const securityContext = createSecurityMiddlewareContext({
    requestHeaders: request.headers,
    defaultLocale,
    isDev: environment === "development",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  const requestHeaders = securityContext.requestHeaders;

  const pathname = request.nextUrl.pathname;
  if (!hasSupabaseSessionCookie(request) && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { requestId } = securityContext;

  try {
    const response = NextResponse.next({
      request: { headers: securityContext.requestHeaders },
    });

    securityContext.applyResponseHeaders(response.headers);

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      data: { requestId, path: request.nextUrl.pathname, method: request.method },
    });
    throw error;
  } finally {
    const logPayload = {
      event: "client.middleware.complete",
      environment,
      requestId,
      method: request.method,
      url: request.nextUrl.pathname,
      durationMs: Date.now() - startedAt,
    } as const;

    // Structured JSON logging for middleware
    // eslint-disable-next-line ibimina/structured-logging
    console.log(JSON.stringify(scrubPII(logPayload)));
  }
};

// Export middleware directly with Sentry error capture
export const middleware = (request: NextRequest) => {
  try {
    return middlewareImpl(request);
  } catch (error) {
    // Manually capture errors in Sentry
    Sentry.captureException(error, {
      tags: {
        middleware: "client",
        url: request.nextUrl.pathname,
      },
    });
    // Return error response
    return NextResponse.json({ error: "Middleware error" }, { status: 500 });
  }
};

Sentry.setTag("middleware", "client");

// Middleware runs on all routes except static assets and API routes
// This pattern is standard for Next.js middleware matchers
export const config = {
  matcher: [
    // Run middleware on everything EXCEPT these paths
    "/((?!_next/static|_next/image|favicon.ico|icons/|robots.txt|manifest.json|manifest.webmanifest|service-worker.js|assets|offline|api).*)",
  ],
};
