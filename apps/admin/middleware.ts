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

type DeepLinkType = "join" | "invite";

interface DeepLinkResolution {
  status: string;
  scheme?: string;
  type?: DeepLinkType;
  targetId?: string;
  groupName?: string | null;
  token?: string | null;
}

const DEEP_LINK_MATCHER = /^\/(join|invite)\/([^/?#]+)/;

const isMobileAgent = (userAgent: string | null) => {
  if (!userAgent) return false;
  const lowered = userAgent.toLowerCase();
  if (lowered.includes("ipad")) return true;
  if (lowered.includes("iphone")) return true;
  if (lowered.includes("android")) return true;
  if (lowered.includes("mobile")) return true;
  return false;
};

const resolveDeepLink = async (
  type: DeepLinkType,
  identifier: string
): Promise<DeepLinkResolution | null> => {
  const supabaseRestUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseRestUrl || !serviceKey) {
    console.warn("Deep link resolution skipped: Supabase credentials missing");
    return null;
  }

  const endpoint = `${supabaseRestUrl}/rest/v1/rpc/resolve_deep_link`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ route: type, identifier }),
    });

    if (!response.ok) {
      console.error("Failed to resolve deep link", type, identifier, response.status);
      return null;
    }

    const payload = (await response.json()) as DeepLinkResolution | null;
    return payload;
  } catch (error) {
    console.error("Deep link resolution error", error);
    return null;
  }
};

const middlewareImpl = async (request: NextRequest) => {
  const startedAt = Date.now();
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  try {
    const requestId = requestHeaders.get("x-request-id") ?? createRequestId();

    let response: NextResponse | null = null;

    const deepLinkMatch = request.nextUrl.pathname.match(DEEP_LINK_MATCHER);

    if (deepLinkMatch) {
      const [, type, identifier] = deepLinkMatch as [string, DeepLinkType, string];
      const resolved = await resolveDeepLink(type, identifier);

      if (resolved?.scheme) {
        requestHeaders.set("x-ibimina-deep-link", resolved.scheme);
        requestHeaders.set("x-ibimina-deep-link-meta", JSON.stringify(resolved));

        const shouldRedirect =
          !request.nextUrl.searchParams.has("fallback") &&
          isMobileAgent(requestHeaders.get("user-agent"));

        if (shouldRedirect) {
          const fallbackUrl = new URL(request.nextUrl.toString());
          fallbackUrl.searchParams.set("fallback", "1");

          response = NextResponse.redirect(resolved.scheme);
          response.headers.set("X-Request-ID", requestId);
          response.headers.set("X-Deep-Link-Fallback", fallbackUrl.toString());
        }
      }
    }

    // Initialize response properly
    if (!response) {
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

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

    if (!response.headers.has("X-Request-ID")) {
      response.headers.set("X-Request-ID", requestId);
    }

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
