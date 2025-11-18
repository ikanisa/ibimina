import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSecurityMiddlewareContext } from "@ibimina/lib";
import { getSupabaseMiddlewareClient } from "@/src/lib/supabaseClient";

const PUBLIC_API_PATHS = [/^\/api\/health/, /^\/api\/healthz/, /^\/api\/__e2e/];

function isProtectedApiPath(pathname: string) {
  return (
    pathname.startsWith("/api/") && !PUBLIC_API_PATHS.some((pattern) => pattern.test(pathname))
  );
}

export async function middleware(request: NextRequest) {
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

  if (isProtectedApiPath(request.nextUrl.pathname)) {
    const supabase = getSupabaseMiddlewareClient(request, response);
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  security.applyResponseHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
