import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardingPayloadSchema, upsertMemberOnboardingProfile } from "@/lib/member/onboarding";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // Member app tables are optional; use untyped client to accommodate missing local schema

  const legacyClient = supabase as any;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logError("Failed to validate auth", authError);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const payload = onboardingPayloadSchema.safeParse(json);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const data = payload.data;
  const result = await upsertMemberOnboardingProfile(legacyClient, user.id, data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
