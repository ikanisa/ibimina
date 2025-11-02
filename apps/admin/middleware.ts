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

const middlewareImpl = (request: NextRequest) => {
  const startedAt = Date.now();
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

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
