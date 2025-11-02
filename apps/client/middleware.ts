import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withSentryMiddleware } from "@sentry/nextjs/middleware";

import { resolveEnvironment, scrubPII } from "@ibimina/lib";
import { createSecurityMiddlewareContext } from "@ibimina/lib/security";
import { defaultLocale } from "./i18n";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const middlewareImpl = (request: NextRequest) => {
  const startedAt = Date.now();
  const environment = resolveEnvironment();
  const securityContext = createSecurityMiddlewareContext({
    requestHeaders: request.headers,
    defaultLocale,
    isDev,
    supabaseUrl,
  });
  let response: NextResponse;
  const { requestId } = securityContext;

  try {
    response = NextResponse.next({
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
