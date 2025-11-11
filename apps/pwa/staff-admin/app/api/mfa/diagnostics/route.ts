import { NextRequest, NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isValidBase64Key(b64: string | undefined | null) {
  if (!b64) return false;
  try {
    const buf = Buffer.from(b64, "base64");
    return buf.length === 32;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { user, profile } = await requireUserAndProfile();
  const email = request.nextUrl.searchParams.get("email");

  const isAdmin = profile.role === "SYSTEM_ADMIN";

  const kmsKey = process.env.KMS_DATA_KEY ?? process.env.KMS_DATA_KEY_BASE64 ?? null;
  const hasKmsKey = isValidBase64Key(kmsKey);

  const supabase = createSupabaseAdminClient();
  const targetEmail = isAdmin && email ? email : (user.email ?? null);

  if (!targetEmail) {
    return NextResponse.json({ error: "no_email" }, { status: 400 });
  }

  type UserRow = {
    id: string;
    email: string | null;
    mfa_enabled: boolean | null;
    mfa_secret_enc: string | null;
  };

  const { data, error } = await supabase
    .from("users")
    .select("id, email, mfa_enabled, mfa_secret_enc")
    .eq("email", targetEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const userRow = data as UserRow | null;

  if (!userRow) {
    return NextResponse.json({ error: "user_not_found", email: targetEmail }, { status: 404 });
  }

  const { data: emailCodes } = await supabase
    .schema("app")
    .from("mfa_email_codes")
    .select("id")
    .eq("user_id", userRow.id)
    .is("consumed_at", null)
    .gte("expires_at", new Date().toISOString());

  const diagnostic = {
    env: {
      hasKmsKey,
      // expose whether fallback var exists (no secret values)
      KMS_DATA_KEY_present: Boolean(process.env.KMS_DATA_KEY),
      KMS_DATA_KEY_BASE64_present: Boolean(process.env.KMS_DATA_KEY_BASE64),
    },
    user: {
      id: userRow.id,
      email: userRow.email,
      mfaEnabled: userRow.mfa_enabled,
      mfaSecretPresent: Boolean(userRow.mfa_secret_enc),
      emailCodesActive: emailCodes?.length ?? 0,
    },
    auth: {
      requesterId: user.id,
      requesterIsAdmin: isAdmin,
    },
  };

  return NextResponse.json(diagnostic);
}
