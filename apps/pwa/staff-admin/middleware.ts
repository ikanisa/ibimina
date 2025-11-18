import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSecurityMiddlewareContext } from "@ibimina/lib";

const PUBLIC_ROUTES = new Set([
  "/", // marketing splash
  "/login",
  "/auth/first-login",
  "/auth/device-login",
  "/auth/mfa",
  "/offline",
  "/privacy",
  "/invite",
]);

const PUBLIC_PREFIXES = [
  "/api",
  "/_next",
  "/icons",
  "/manifest",
  "/favicon.ico",
  "/.well-known",
  "/invite",
  "/auth/callback",
];

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name, value }) => {
    if (!value) return false;
    if (name === "supabase-auth-token" || name === "sb-access-token") {
      return true;
    }
    return /^sb-.*-auth-token$/i.test(name) || /^supabase-session/.test(name);
  });
}

function shouldAllowPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const defaultLocale = process.env.NEXT_PUBLIC_LOCALE ?? undefined;
  const security = createSecurityMiddlewareContext({
    requestHeaders: request.headers,
    defaultLocale,
    isDev: process.env.NODE_ENV !== "production",
    supabaseUrl,
  });

  const response = NextResponse.next({
    request: {
      headers: security.requestHeaders,
    },
  });

  if (!hasSupabaseSessionCookie(request) && !shouldAllowPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Remove legacy auth cookies that may interfere with Supabase session handling
  ["supabase-auth-token", "sb-access-token", "sb-refresh-token"].forEach((name) => {
    if (request.cookies.has(name)) {
      response.cookies.set({ name, value: "", maxAge: 0, path: "/" });
    }
  });

  security.applyResponseHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
