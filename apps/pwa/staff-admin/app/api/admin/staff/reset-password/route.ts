import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { guardAdminAction } from "@/lib/admin/guard";
import { supabaseSrv } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { user_id: userId, email } = (await request.json().catch(() => ({}))) as {
    user_id?: string;
    email?: string | null;
  };

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const guard = await guardAdminAction(
    {
      action: "admin_staff_reset_password",
      reason: "Only system administrators can reset staff passwords.",
      logEvent: "admin_staff_reset_password_denied",
      metadata: { targetUserId: userId },
    },
    (error) => NextResponse.json({ error: error.message }, { status: 403 })
  );

  if (guard.denied) return guard.result;

  const supabase = supabaseSrv();
  const temporaryPassword = crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);

  const admin = (supabase as any).auth.admin;
  const { error: updateError } = await admin.updateUserById(userId, {
    password: temporaryPassword,
    user_metadata: { pw_reset_required: true },
  });
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to reset password" },
      { status: 500 }
    );
  }

  // Optional: email webhook
  try {
    const url = process.env.EMAIL_WEBHOOK_URL;
    const key = process.env.EMAIL_WEBHOOK_KEY;
    if (url && email) {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({
          to: email,
          subject: "Your temporary password",
          html: `<p>Temporary password: <b>${temporaryPassword}</b></p><p>Set a new password at first login.</p>`,
        }),
      }).catch(() => void 0);
    }
  } catch {}

  return NextResponse.json({ 
    ok: true, 
    password_sent: Boolean(url && email) 
  });
}
