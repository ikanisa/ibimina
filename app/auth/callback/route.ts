import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type AuthCallbackPayload = {
  event: string;
  session: Session | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const requestCookies = await cookies();
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return requestCookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const payload = (await request.json().catch(() => null)) as AuthCallbackPayload | null;

  if (!payload?.event) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (payload.event === "SIGNED_OUT") {
    await supabase.auth.signOut();
    return response;
  }

  if (!payload.session) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  await supabase.auth.setSession(payload.session);
  return response;
}
