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
  resolveEnvironment,
  scrubPII,
} from "@ibimina/lib";
import { defaultLocale } from "./i18n";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const middlewareImpl = (request: NextRequest) => {
  const startedAt = Date.now();
  const environment = resolveEnvironment();
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  // Set default locale in request headers for next-intl
  requestHeaders.set("x-next-intl-locale", defaultLocale);

  let response: NextResponse;
  const requestId = requestHeaders.get("x-request-id") ?? createRequestId();

  try {
    response = NextResponse.next({
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

    response.headers.set("X-Request-ID", requestId);

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

    console.log(JSON.stringify(scrubPII(logPayload)));
  }
};

export const middleware = withSentryMiddleware(middlewareImpl, {
  captureResponse: true,
  waitForTransaction: true,
});

Sentry.setTag("middleware", "client");

// Middleware runs on all routes except static assets and API routes
// This pattern is standard for Next.js middleware matchers
export const config = {
  matcher: [
    // Run middleware on everything EXCEPT these paths
    "/((?!_next/static|_next/image|favicon.ico|icons/|robots.txt|manifest.json|manifest.webmanifest|service-worker.js|assets|offline|api).*)",
  ],
};
