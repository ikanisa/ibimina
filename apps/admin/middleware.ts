import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withSentryMiddleware } from "@sentry/nextjs/middleware";

import { resolveEnvironment, scrubPII } from "@ibimina/lib";
import { createSecurityMiddlewareContext } from "@ibimina/lib/security";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const middlewareImpl = (request: NextRequest) => {
  const startedAt = Date.now();
  const securityContext = createSecurityMiddlewareContext({
    requestHeaders: request.headers,
    isDev,
    supabaseUrl,
  });

  try {
    const response = NextResponse.next({
      request: {
        headers: securityContext.requestHeaders,
      },
    });

    securityContext.applyResponseHeaders(response.headers);

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      data: {
        requestId: securityContext.requestId,
        path: request.nextUrl.pathname,
        method: request.method,
      },
    });
    throw error;
  } finally {
    const logPayload = {
      event: "admin.middleware.complete",
      environment: resolveEnvironment(),
      requestId: securityContext.requestId,
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
