"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/performance/cache";
import { instrumentServerAction } from "@/lib/observability/server-action";
import { logError, logInfo, logWarn, updateLogContext } from "@/lib/observability/logger";

export type AdminActionResult = {
  status: "success" | "error";
  message?: string;
};

async function updateUserAccessInternal({
  userId,
  role,
  saccoId,
}: {
  userId: string;
  role: Database["public"]["Enums"]["app_role"];
  saccoId: string | null;
}): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_update_access_denied", { targetUserId: userId, actorRole: profile.role });
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
    logError("admin_update_access_failed", { targetUserId: userId, error });
    return { status: "error", message: error.message ?? "Failed to update user" };
  }

  await revalidatePath("/admin");
  logInfo("admin_update_access_success", { targetUserId: userId, role, saccoId });
  return { status: "success", message: "User access updated" };
}

export const updateUserAccess = instrumentServerAction("admin.updateUserAccess", updateUserAccessInternal);

async function queueNotificationInternal({
  saccoId,
  templateId,
  event = "SMS_TEMPLATE_TEST",
}: {
  saccoId: string;
  templateId: string;
  event?: string;
}): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_queue_notification_denied", { saccoId, actorRole: profile.role });
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
    logError("admin_queue_notification_failed", { saccoId, templateId, event, error });
    return { status: "error", message: error.message ?? "Failed to queue notification" };
  }

  logInfo("admin_queue_notification_success", { saccoId, templateId, event });
  return { status: "success", message: "Notification queued" };
}

async function queueMfaReminderInternal({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_queue_mfa_reminder_denied", { targetUserId: userId, actorRole: profile.role });
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
    logError("admin_queue_mfa_reminder_failed", { targetUserId: userId, error });
    return { status: "error", message: error.message ?? "Failed to queue reminder" };
  }

  logInfo("admin_queue_mfa_reminder_success", { targetUserId: userId });
  return { status: "success", message: "Reminder queued" };
}

async function createSmsTemplateInternal({
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
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_template_create_denied", { saccoId, actorRole: profile.role });
    return { status: "error", message: "Only system administrators can create templates." };
  }

  if (!name.trim() || !body.trim()) {
    logWarn("admin_template_create_invalid_payload", { saccoId, hasName: Boolean(name.trim()), hasBody: Boolean(body.trim()) });
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
  if (error) {
    logError("admin_template_create_failed", { saccoId, error });
    return { status: "error", message: error.message ?? "Failed to create template" };
  }
  await revalidatePath("/admin");
  logInfo("admin_template_create_success", { saccoId, templateId: (data as { id?: string } | null)?.id });
  return { status: "success", message: "Template created", template: data };
}

async function setSmsTemplateActiveInternal({
  templateId,
  isActive,
}: {
  templateId: string;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_template_toggle_denied", { templateId, actorRole: profile.role });
    return { status: "error", message: "Only system administrators can update templates." };
  }
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("sms_templates")
    .update({ is_active: isActive })
    .eq("id", templateId);
  if (error) {
    logError("admin_template_toggle_failed", { templateId, error, isActive });
    return { status: "error", message: error.message ?? "Failed to update template" };
  }
  await revalidatePath("/admin");
  logInfo("admin_template_toggle_success", { templateId, isActive });
  return { status: "success", message: isActive ? "Template activated" : "Template deactivated" };
}

async function deleteSmsTemplateInternal({
  templateId,
}: { templateId: string }): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_template_delete_denied", { templateId, actorRole: profile.role });
    return { status: "error", message: "Only system administrators can delete templates." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sms_templates").delete().eq("id", templateId);
  if (error) {
    logError("admin_template_delete_failed", { templateId, error });
    return { status: "error", message: error.message ?? "Failed to delete template" };
  }
  await revalidatePath("/admin");
  logInfo("admin_template_delete_success", { templateId });
  return { status: "success", message: "Template deleted" };
}

async function upsertSaccoInternal({
  mode,
  sacco,
}: {
  mode: "create" | "update";
  sacco: Database["app"]["Tables"]["saccos"]["Insert"] | (Database["app"]["Tables"]["saccos"]["Update"] & { id: string });
}): Promise<AdminActionResult & { sacco?: Database["app"]["Tables"]["saccos"]["Row"] }> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_sacco_upsert_denied", { mode, actorRole: profile.role });
    return { status: "error", message: "Only system administrators can modify SACCO registry." };
  }
  const supabase = await createSupabaseServerClient();
  let result: Database["app"]["Tables"]["saccos"]["Row"] | null = null;

  if (mode === "create") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .schema("app")
      .from("saccos")
      .insert(sacco as Database["app"]["Tables"]["saccos"]["Insert"])
      .select("*")
      .single();
    if (error) {
      logError("admin_sacco_create_failed", { error });
      return { status: "error", message: error.message ?? "Failed to create SACCO" };
    }
    result = data as Database["app"]["Tables"]["saccos"]["Row"];
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .schema("app")
      .from("saccos")
      .update(sacco as Database["app"]["Tables"]["saccos"]["Update"])
      .eq("id", (sacco as unknown as { id: string }).id)
      .select("*")
      .single();
    if (error) {
      logError("admin_sacco_update_failed", { error, saccoId: (sacco as { id: string }).id });
      return { status: "error", message: error.message ?? "Failed to update SACCO" };
    }
    result = data as Database["app"]["Tables"]["saccos"]["Row"];
  }

  const saccoId = result?.id ?? null;
  await revalidatePath("/admin");
  await revalidateTag(CACHE_TAGS.ikiminaDirectory);
  if (saccoId) {
    await revalidateTag(CACHE_TAGS.sacco(saccoId));
  }
  await revalidateTag(CACHE_TAGS.dashboardSummary);

  logInfo("admin_sacco_upsert_success", { mode, saccoId });
  return { status: "success", sacco: result ?? undefined };
}

async function removeSaccoInternal({ id }: { id: string }): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_sacco_delete_denied", { saccoId: id, actorRole: profile.role });
    return { status: "error", message: "Only system administrators can delete SACCOs." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("app").from("saccos").delete().eq("id", id);
  if (error) {
    logError("admin_sacco_delete_failed", { saccoId: id, error });
    return { status: "error", message: error.message ?? "Failed to delete SACCO" };
  }
  await revalidatePath("/admin");
  await revalidateTag(CACHE_TAGS.ikiminaDirectory);
  await revalidateTag(CACHE_TAGS.sacco(id));
  await revalidateTag(CACHE_TAGS.dashboardSummary);
  logInfo("admin_sacco_delete_success", { saccoId: id });
  return { status: "success", message: "SACCO deleted" };
}

async function resetMfaForAllEnabledInternal({
  reason = "bulk_reset",
}: {
  reason?: string;
}): Promise<AdminActionResult & { count: number }> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });
  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_mfa_bulk_reset_denied", { actorRole: profile.role });
    return { status: "error", message: "Only system administrators can reset 2FA in bulk.", count: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("mfa_enabled", true);

  if (selectError) {
    logError("admin_mfa_bulk_reset_select_failed", { error: selectError });
    return { status: "error", message: selectError.message ?? "Failed to enumerate users", count: 0 };
  }

  const ids = (rows ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) {
    logInfo("admin_mfa_bulk_reset_noop", { reason });
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
    logError("admin_mfa_bulk_reset_update_failed", { error: updateError });
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
  logInfo("admin_mfa_bulk_reset_success", { count: ids.length, reason });
  return { status: "success", message: "2FA reset for all enabled users", count: ids.length };
}

export const queueNotification = instrumentServerAction("admin.queueNotification", queueNotificationInternal);
export const queueMfaReminder = instrumentServerAction("admin.queueMfaReminder", queueMfaReminderInternal);
export const createSmsTemplate = instrumentServerAction("admin.createSmsTemplate", createSmsTemplateInternal);
export const setSmsTemplateActive = instrumentServerAction("admin.setSmsTemplateActive", setSmsTemplateActiveInternal);
export const deleteSmsTemplate = instrumentServerAction("admin.deleteSmsTemplate", deleteSmsTemplateInternal);
export const upsertSacco = instrumentServerAction("admin.upsertSacco", upsertSaccoInternal);
export const removeSacco = instrumentServerAction("admin.removeSacco", removeSaccoInternal);
export const resetMfaForAllEnabled = instrumentServerAction(
  "admin.resetMfaForAllEnabled",
  resetMfaForAllEnabledInternal,
);
