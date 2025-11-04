import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withSentryMiddleware } from "@sentry/nextjs/middleware";

// Conditionally import lib functions
let createSecurityMiddlewareContext: any;
let resolveEnvironment: any;
let scrubPII: any;

if (process.env.NODE_ENV !== "development") {
  const lib = require("@ibimina/lib");
  createSecurityMiddlewareContext = lib.createSecurityMiddlewareContext;
  resolveEnvironment = lib.resolveEnvironment;
  scrubPII = lib.scrubPII;
} else {
  // Stubs for development
  createSecurityMiddlewareContext = () => ({});
  resolveEnvironment = () => process.env.APP_ENV || process.env.NODE_ENV || "development";
  scrubPII = (obj: any) => obj;
}

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
  const supabaseRestUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
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
  const securityContext = createSecurityMiddlewareContext({
    requestHeaders: request.headers,
    isDev,
    supabaseUrl,
  });
  const { requestHeaders, requestId } = securityContext;

  try {
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

// Export middleware - wrap with Sentry in production only
export const middleware = process.env.NODE_ENV === "development"
  ? middlewareImpl
  : withSentryMiddleware(middlewareImpl, {
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
