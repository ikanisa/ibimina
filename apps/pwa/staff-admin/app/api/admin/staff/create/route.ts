import { NextResponse } from "next/server";
import { logWarn } from "@/lib/observability/logger";
import crypto from "node:crypto";
import { guardAdminAction } from "@/lib/admin/guard";
import type { Database } from "@/lib/supabase/types";
import { isMissingRelationError } from "@/lib/supabase/errors";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const {
    email,
    role,
    sacco_id: saccoId,
    org_type: orgType,
    org_id: orgId,
    send_email: sendEmail = true,
  } = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: Database["public"]["Enums"]["app_role"];
    sacco_id?: string | null;
    org_type?: "SACCO" | "MFI" | "DISTRICT" | null;
    org_id?: string | null;
    send_email?: boolean;
  };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  const normalizedRole = role as Database["public"]["Enums"]["app_role"];
  const requiresSacco =
    normalizedRole === "SACCO_MANAGER" ||
    normalizedRole === "SACCO_STAFF" ||
    normalizedRole === "SACCO_VIEWER";
  const requiresDistrict = normalizedRole === "DISTRICT_MANAGER";
  const requiresMfi = normalizedRole === "MFI_MANAGER" || normalizedRole === "MFI_STAFF";

  if (normalizedRole !== "SYSTEM_ADMIN") {
    if (requiresSacco && !saccoId) {
      return NextResponse.json({ error: "sacco_id is required for SACCO roles" }, { status: 400 });
    }

    if (requiresDistrict && (!orgType || orgType !== "DISTRICT" || !orgId)) {
      return NextResponse.json(
        { error: "org_id is required for district managers" },
        { status: 400 }
      );
    }

    if (requiresMfi && (!orgType || orgType !== "MFI" || !orgId)) {
      return NextResponse.json({ error: "org_id is required for MFI roles" }, { status: 400 });
    }
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

  const { supabase, user: actor } = guard.context;
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
    .update({
      role: normalizedRole,
      sacco_id: normalizedRole === "SYSTEM_ADMIN" ? null : (saccoId ?? null),
    })
    .eq("id", userId);
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update user" },
      { status: 500 }
    );
  }

  // Optional: reflect in org_memberships if table exists (Phase 2)
  try {
    const orgIdToUse = requiresSacco ? saccoId : orgId;
    if (orgIdToUse) {
      const res = await (supabase as any)
        .schema("app")
        .from("org_memberships")
        .upsert(
          { user_id: userId, org_id: orgIdToUse, role: normalizedRole },
          { onConflict: "user_id,org_id" }
        );
      if (res.error && !isMissingRelationError(res.error)) {
        logWarn("org_memberships upsert failed", res.error);
      }
    }
  } catch {}

  // Email
  let inviteMethod: "webhook" | "supabase" | "skipped" = sendEmail ? "supabase" : "skipped";
  let inviteError: string | null = null;
  if (sendEmail) {
    try {
      const url = process.env.EMAIL_WEBHOOK_URL;
      const key = process.env.EMAIL_WEBHOOK_KEY;
      if (url) {
        inviteMethod = "webhook";
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
        });
      } else {
        const { error: inviteErr } = await admin.inviteUserByEmail(email);
        if (inviteErr) inviteError = inviteErr.message ?? "Failed to send invite";
      }
    } catch (error) {
      inviteError = error instanceof Error ? error.message : "Failed to dispatch invitation";
    }
  }

  try {
    await logAudit({
      action: "INVITE_USER",
      entity: "users",
      entityId: userId,
      diff: {
        email,
        role: normalizedRole,
        sacco_id: saccoId ?? null,
        org_type: orgType ?? null,
        org_id: orgId ?? null,
        invite_method: inviteMethod,
        invite_status: inviteError ? "error" : sendEmail ? "sent" : "skipped",
        invite_error: inviteError,
        actor: actor.id,
      },
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    user_id: userId,
    password_sent: sendEmail,
    temporary_password: password,
    invite_error: inviteError,
    invite_method: inviteMethod,
  });
}
