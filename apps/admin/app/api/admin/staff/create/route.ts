import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { guardAdminAction } from "@/lib/admin/guard";
import type { Database } from "@/lib/supabase/types";
import { supabaseSrv } from "@/lib/supabase/server";
import { isMissingRelationError } from "@/lib/supabase/errors";

export async function POST(request: Request) {
  const {
    email,
    role,
    sacco_id: saccoId,
    send_email: sendEmail = true,
  } = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: Database["public"]["Enums"]["app_role"];
    sacco_id?: string | null;
    send_email?: boolean;
  };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }
  if (role !== "SYSTEM_ADMIN" && !saccoId) {
    return NextResponse.json(
      { error: "sacco_id is required for non-admin roles" },
      { status: 400 }
    );
  }

  const guard = await guardAdminAction(
    {
      action: "admin_staff_create",
      reason: "Only system administrators can create staff.",
      logEvent: "admin_staff_create_denied",
      metadata: { email, role },
    },
    (error) => NextResponse.json({ error: error.message }, { status: 403 })
  );
  if (guard.denied) return guard.result;

  const supabase = supabaseSrv();
  const password = crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);

  const admin = (supabase as any).auth.admin;
  const { data: created, error: createError } = await admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { pw_reset_required: true },
  });
  if (createError || !created?.user?.id) {
    return NextResponse.json(
      { error: createError?.message ?? "Unable to create user" },
      { status: 500 }
    );
  }
  const userId = created.user.id as string;

  const { error: updateError } = await (supabase as any)
    .from("users")
    .update({ role, sacco_id: role === "SYSTEM_ADMIN" ? null : (saccoId ?? null) })
    .eq("id", userId);
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update user" },
      { status: 500 }
    );
  }

  // Optional: reflect in org_memberships if table exists (Phase 2)
  try {
    const res = await (supabase as any)
      .schema("app")
      .from("org_memberships")
      .upsert({ user_id: userId, org_id: saccoId, role }, { onConflict: "user_id,org_id" });
    if (res.error && !isMissingRelationError(res.error)) {
      console.warn("org_memberships upsert failed", res.error);
    }
  } catch {}

  // Email
  if (sendEmail) {
    try {
      const url = process.env.EMAIL_WEBHOOK_URL;
      const key = process.env.EMAIL_WEBHOOK_KEY;
      if (url) {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(key ? { Authorization: `Bearer ${key}` } : {}),
          },
          body: JSON.stringify({
            to: email,
            subject: "Welcome to the Staff Console",
            html: `<p>Welcome.</p><p>Temporary password: <b>${password}</b></p><p>Set a new password at first login.</p>`,
          }),
        }).catch(() => void 0);
      } else {
        await admin.inviteUserByEmail(email).catch(() => void 0);
      }
    } catch {}
  }

  return NextResponse.json({ ok: true, user_id: userId, password_sent: sendEmail });
}
