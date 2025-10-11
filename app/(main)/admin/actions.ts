"use server";

import { revalidatePath } from "next/cache";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { logAudit } from "@/lib/audit";

export type AdminActionResult = {
  status: "success" | "error";
  message?: string;
};

export async function updateUserAccess({
  userId,
  role,
  saccoId,
}: {
  userId: string;
  role: Database["public"]["Enums"]["app_role"];
  saccoId: string | null;
}): Promise<AdminActionResult> {
  const { profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can modify user access." };
  }

  const supabase = await createSupabaseServerClient();
  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    role,
    sacco_id: saccoId,
  };

  // The Supabase JS client currently narrows update payloads to `never` when schema includes
  // custom views; cast locally until the generated types catch up.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("users").update(updatePayload).eq("id", userId);

  if (error) {
    return { status: "error", message: error.message ?? "Failed to update user" };
  }

  await revalidatePath("/admin");
  return { status: "success", message: "User access updated" };
}

export async function queueNotification({
  saccoId,
  templateId,
  event = "SMS_TEMPLATE_TEST",
}: {
  saccoId: string;
  templateId: string;
  event?: string;
}): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can queue notifications." };
  }

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("notification_queue").insert({
    event,
    sacco_id: saccoId,
    payload: { templateId, queuedBy: user.id },
    scheduled_for: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: error.message ?? "Failed to queue notification" };
  }

  return { status: "success", message: "Notification queued" };
}

export async function queueMfaReminder({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can send reminders." };
  }

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("notification_queue").insert({
    event: "MFA_REMINDER",
    payload: { userId, email, queuedBy: user.id },
    scheduled_for: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: error.message ?? "Failed to queue reminder" };
  }

  return { status: "success", message: "Reminder queued" };
}

export async function createSmsTemplate({
  saccoId,
  name,
  body,
  description,
  tokens,
}: {
  saccoId: string;
  name: string;
  body: string;
  description?: string | null;
  tokens?: string[];
}): Promise<AdminActionResult & { template?: Database["public"]["Tables"]["sms_templates"]["Row"] }> {
  const { profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can create templates." };
  }

  if (!name.trim() || !body.trim()) {
    return { status: "error", message: "Template name and body are required." };
  }

  const supabase = await createSupabaseServerClient();
  const payload: Database["public"]["Tables"]["sms_templates"]["Insert"] = {
    sacco_id: saccoId,
    name: name.trim(),
    body: body.trim(),
    description: description?.trim() || null,
    tokens: tokens ?? null,
    version: 1,
    is_active: false,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("sms_templates")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { status: "error", message: error.message ?? "Failed to create template" };
  await revalidatePath("/admin");
  return { status: "success", message: "Template created", template: data };
}

export async function setSmsTemplateActive({
  templateId,
  isActive,
}: {
  templateId: string;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can update templates." };
  }
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("sms_templates")
    .update({ is_active: isActive })
    .eq("id", templateId);
  if (error) return { status: "error", message: error.message ?? "Failed to update template" };
  await revalidatePath("/admin");
  return { status: "success", message: isActive ? "Template activated" : "Template deactivated" };
}

export async function deleteSmsTemplate({
  templateId,
}: { templateId: string }): Promise<AdminActionResult> {
  const { profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can delete templates." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sms_templates").delete().eq("id", templateId);
  if (error) return { status: "error", message: error.message ?? "Failed to delete template" };
  await revalidatePath("/admin");
  return { status: "success", message: "Template deleted" };
}

export async function upsertSacco({
  mode,
  sacco,
}: {
  mode: "create" | "update";
  sacco: Database["public"]["Tables"]["saccos"]["Insert"] | (Database["public"]["Tables"]["saccos"]["Update"] & { id: string });
}): Promise<AdminActionResult & { sacco?: Database["public"]["Tables"]["saccos"]["Row"] }> {
  const { profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can modify SACCO registry." };
  }
  const supabase = await createSupabaseServerClient();
  if (mode === "create") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("saccos")
    .insert(sacco as Database["public"]["Tables"]["saccos"]["Insert"])
    .select("*")
    .single();
    if (error) return { status: "error", message: error.message ?? "Failed to create SACCO" };
    await revalidatePath("/admin");
    return { status: "success", sacco: data };
  }
  // update path
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("saccos")
    .update(sacco as Database["public"]["Tables"]["saccos"]["Update"])
    .eq("id", (sacco as unknown as { id: string }).id)
    .select("*")
    .single();
  if (error) return { status: "error", message: error.message ?? "Failed to update SACCO" };
  await revalidatePath("/admin");
  return { status: "success", sacco: data };
}

export async function removeSacco({ id }: { id: string }): Promise<AdminActionResult> {
  const { profile } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can delete SACCOs." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("saccos").delete().eq("id", id);
  if (error) return { status: "error", message: error.message ?? "Failed to delete SACCO" };
  await revalidatePath("/admin");
  return { status: "success", message: "SACCO deleted" };
}

export async function resetMfaForAllEnabled({
  reason = "bulk_reset",
}: {
  reason?: string;
}): Promise<AdminActionResult & { count: number }> {
  const { profile, user } = await requireUserAndProfile();
  if (profile.role !== "SYSTEM_ADMIN") {
    return { status: "error", message: "Only system administrators can reset 2FA in bulk.", count: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("mfa_enabled", true);

  if (selectError) {
    return { status: "error", message: selectError.message ?? "Failed to enumerate users", count: 0 };
  }

  const ids = (rows ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) {
    return { status: "success", message: "No users with 2FA enabled", count: 0 };
  }

  // Reset MFA flags for all matching users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("users")
    .update({
      mfa_enabled: false,
      mfa_secret_enc: null,
      mfa_backup_hashes: [],
      mfa_enrolled_at: null,
      last_mfa_step: null,
      last_mfa_success_at: null,
      failed_mfa_count: 0,
    })
    .in("id", ids);

  if (updateError) {
    return { status: "error", message: updateError.message ?? "Failed to reset 2FA", count: 0 };
  }

  // Clear trusted devices
  await supabase.from("trusted_devices").delete().in("user_id", ids);

  await logAudit({
    action: "MFA_RESET_BULK",
    entity: "USER",
    entityId: "BULK",
    diff: { actor: user.id, count: ids.length, reason },
  });

  await revalidatePath("/admin");
  return { status: "success", message: "2FA reset for all enabled users", count: ids.length };
}
