"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/performance/cache";
import { instrumentServerAction } from "@/lib/observability/server-action";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import { guardAdminAction } from "@/lib/admin/guard";

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
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_update_access",
      reason: "Only system administrators can modify user access.",
      logEvent: "admin_update_access_denied",
      metadata: { targetUserId: userId },
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_queue_notification",
      reason: "Only system administrators can queue notifications.",
      logEvent: "admin_queue_notification_denied",
      metadata: { saccoId, templateId, event },
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase, user } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_queue_mfa_reminder",
      reason: "Only system administrators can send reminders.",
      logEvent: "admin_queue_mfa_reminder_denied",
      metadata: { targetUserId: userId },
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase, user } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult & { template?: Database["public"]["Tables"]["sms_templates"]["Row"] }>(
    {
      action: "admin_template_create",
      reason: "Only system administrators can create templates.",
      logEvent: "admin_template_create_denied",
      metadata: { saccoId },
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase } = guard.context;

  if (!name.trim() || !body.trim()) {
    logWarn("admin_template_create_invalid_payload", { saccoId, hasName: Boolean(name.trim()), hasBody: Boolean(body.trim()) });
    return { status: "error", message: "Template name and body are required." };
  }
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
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_template_toggle",
      reason: "Only system administrators can update templates.",
      logEvent: "admin_template_toggle_denied",
      metadata: { templateId, isActive },
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }
  const { supabase } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_template_delete",
      reason: "Only system administrators can delete templates.",
      logEvent: "admin_template_delete_denied",
      metadata: { templateId },
      clientFactory: () => createSupabaseServerClient(),
    },
    (error) => ({ status: "error", message: error.message }),
  );
  if (guard.denied) {
    return guard.result;
  }
  const { supabase } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult & { sacco?: Database["app"]["Tables"]["saccos"]["Row"] }>(
    {
      action: "admin_sacco_upsert",
      reason: "Only system administrators can modify SACCO registry.",
      logEvent: "admin_sacco_upsert_denied",
      metadata: { mode },
      clientFactory: () => createSupabaseServerClient(),
    },
    (error) => ({ status: "error", message: error.message }),
  );
  if (guard.denied) {
    return guard.result;
  }
  const { supabase } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_sacco_delete",
      reason: "Only system administrators can delete SACCOs.",
      logEvent: "admin_sacco_delete_denied",
      metadata: { saccoId: id },
      clientFactory: () => createSupabaseServerClient(),
    },
    (error) => ({ status: "error", message: error.message }),
  );
  if (guard.denied) {
    return guard.result;
  }
  const { supabase } = guard.context;
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
  const guard = await guardAdminAction<AdminActionResult & { count: number }>(
    {
      action: "admin_mfa_bulk_reset",
      reason: "Only system administrators can reset 2FA in bulk.",
      logEvent: "admin_mfa_bulk_reset_denied",
      fallbackResult: { count: 0 },
      clientFactory: () => createSupabaseServerClient(),
    },
    (error) => ({
      status: "error",
      message: error.message,
      count: Number(((error.extras as { count?: unknown } | undefined)?.count ?? 0)),
    }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase, user } = guard.context;
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
async function updateTenantSettingsInternal({
  saccoId,
  settings,
}: {
  saccoId: string;
  settings: {
    rules: string;
    feePolicy: string;
    kycThresholds: { enhanced: number; freeze: number };
    integrations: { webhook: boolean; edgeReconciliation: boolean; notifications: boolean };
  };
}): Promise<AdminActionResult & { metadata?: Record<string, unknown> }> {
  const guard = await guardAdminAction<AdminActionResult & { metadata?: Record<string, unknown> }>(
    {
      action: "admin_settings_update",
      reason: "Only system administrators can update tenant settings.",
      logEvent: "admin_settings_update_denied",
      metadata: { saccoId },
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase, user } = guard.context;

  const { data: row, error: selectError } = await supabase
    .schema("app")
    .from("saccos")
    .select("id, metadata")
    .eq("id", saccoId)
    .maybeSingle();

  if (selectError) {
    logError("admin_settings_load_failed", { saccoId, error: selectError });
    return { status: "error", message: selectError.message ?? "Failed to load existing settings" };
  }

  const previousMetadata = (row?.metadata as Record<string, unknown> | null) ?? {};
  const nextMetadata = {
    ...previousMetadata,
    admin_settings: {
      ...(previousMetadata.admin_settings as Record<string, unknown> | undefined),
      rules: settings.rules,
      feePolicy: settings.feePolicy,
      kycThresholds: settings.kycThresholds,
      integrations: settings.integrations,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
  } satisfies Record<string, unknown>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updateResult, error: updateError } = await (supabase as any)
    .schema("app")
    .from("saccos")
    .update({ metadata: nextMetadata })
    .eq("id", saccoId)
    .select("metadata")
    .single();

  if (updateError) {
    logError("admin_settings_update_failed", { saccoId, error: updateError });
    return { status: "error", message: updateError.message ?? "Failed to update tenant settings" };
  }

  await logAudit({
    action: "TENANT_SETTINGS_UPDATED",
    entity: "SACCO",
    entityId: saccoId,
    diff: {
      rules: settings.rules,
      feePolicy: settings.feePolicy,
      kycThresholds: settings.kycThresholds,
      integrations: settings.integrations,
    },
  });

  await revalidatePath("/admin/settings");
  await revalidateTag(CACHE_TAGS.sacco(saccoId));

  logInfo("admin_settings_update_success", { saccoId });
  return { status: "success", message: "Settings updated", metadata: updateResult?.metadata ?? nextMetadata };
}

async function resolveOcrReviewInternal({
  memberUserId,
  decision,
  note,
}: {
  memberUserId: string;
  decision: "accept" | "rescan";
  note?: string;
}): Promise<AdminActionResult> {
  const guard = await guardAdminAction<AdminActionResult>(
    {
      action: "admin_ocr_review",
      reason: "Insufficient permissions for OCR review.",
      logEvent: "admin_ocr_review_denied",
      metadata: { memberUserId, decision },
      allowedRoles: ["SYSTEM_ADMIN", "SACCO_MANAGER"],
    },
    (error) => ({ status: "error", message: error.message }),
  );

  if (guard.denied) {
    return guard.result;
  }

  const { supabase, user } = guard.context;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyClient = supabase as any;
  const { data: profileRow, error: loadError } = await legacyClient
    .from("members_app_profiles")
    .select("ocr_json, is_verified")
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (loadError) {
    logError("admin_ocr_review_load_failed", { memberUserId, error: loadError });
    return { status: "error", message: loadError.message ?? "Failed to load OCR payload" };
  }

  const existingOcr = (profileRow?.ocr_json as Record<string, unknown> | null) ?? {};
  const reviewedAt = new Date().toISOString();
  const nextOcr = {
    ...existingOcr,
    status: decision === "accept" ? "accepted" : "needs_rescan",
    reviewed_at: reviewedAt,
    reviewer: user.id,
    note: note ?? null,
  } satisfies Record<string, unknown>;

  const updatePayload = {
    is_verified: decision === "accept",
    ocr_json: nextOcr,
  };

  const { error: updateError } = await legacyClient
    .from("members_app_profiles")
    .update(updatePayload)
    .eq("user_id", memberUserId);

  if (updateError) {
    logError("admin_ocr_review_update_failed", { memberUserId, decision, error: updateError });
    return { status: "error", message: updateError.message ?? "Failed to update OCR review" };
  }

  await logAudit({
    action: decision === "accept" ? "OCR_ACCEPTED" : "OCR_RESCAN_REQUESTED",
    entity: "MEMBER_PROFILE",
    entityId: memberUserId,
    diff: { decision, note: note ?? null },
  });

  await revalidatePath("/admin/ocr");
  logInfo("admin_ocr_review_success", { memberUserId, decision });
  return { status: "success", message: decision === "accept" ? "Document approved" : "Rescan requested" };
}

export const deleteSmsTemplate = instrumentServerAction("admin.deleteSmsTemplate", deleteSmsTemplateInternal);
export const upsertSacco = instrumentServerAction("admin.upsertSacco", upsertSaccoInternal);
export const removeSacco = instrumentServerAction("admin.removeSacco", removeSaccoInternal);
export const resetMfaForAllEnabled = instrumentServerAction(
  "admin.resetMfaForAllEnabled",
  resetMfaForAllEnabledInternal,
);
export const updateTenantSettings = instrumentServerAction("admin.updateTenantSettings", updateTenantSettingsInternal);
export const resolveOcrReview = instrumentServerAction("admin.resolveOcrReview", resolveOcrReviewInternal);

// ---------- Financial institution management ----------

type FinancialInstitutionPayload = {
  id?: string;
  name: string;
  kind: Database["app"]["Enums"]["financial_institution_kind"];
  district: string;
  saccoId?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function upsertFinancialInstitutionInternal(payload: FinancialInstitutionPayload): Promise<
  AdminActionResult & { record?: Database["app"]["Tables"]["financial_institutions"]["Row"] }
> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });

  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_financial_institution_denied", { actorRole: profile.role });
    return { status: "error", message: "Only system administrators can manage financial institutions." };
  }

  const supabase = await createSupabaseServerClient();
  const table = supabase.schema("app").from("financial_institutions");
  const basePayload: Database["app"]["Tables"]["financial_institutions"]["Insert"] = {
    name: payload.name.trim(),
    kind: payload.kind,
    district: payload.district.trim().toUpperCase(),
    sacco_id: payload.saccoId ?? null,
    metadata: (payload.metadata ?? {}) as Database["app"]["Tables"]["financial_institutions"]["Row"]["metadata"],
  };

  let result;
  if (payload.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (table as any)
      .update(basePayload)
      .eq("id", payload.id)
      .select("*")
      .maybeSingle();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (table as any)
      .insert(basePayload)
      .select("*")
      .single();
  }

  if (result.error) {
    logError("admin_financial_institution_upsert_failed", { error: result.error, payload });
    return { status: "error", message: result.error.message ?? "Failed to save institution" };
  }

  const institutionId = (result.data as { id?: string } | null)?.id ?? "UNKNOWN";

  await logAudit({
    action: payload.id ? "FINANCIAL_INSTITUTION_UPDATED" : "FINANCIAL_INSTITUTION_CREATED",
    entity: "financial_institutions",
    entityId: institutionId,
    diff: { name: payload.name, kind: payload.kind, district: payload.district, saccoId: payload.saccoId ?? null },
  });

  await revalidatePath("/admin");
  return {
    status: "success",
    message: payload.id ? "Institution updated" : "Institution created",
    record: result.data ?? undefined,
  };
}

async function deleteFinancialInstitutionInternal({ id }: { id: string }): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });

  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_financial_institution_delete_denied", { actorRole: profile.role });
    return { status: "error", message: "Only system administrators can manage financial institutions." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("app").from("financial_institutions").delete().eq("id", id);

  if (error) {
    logError("admin_financial_institution_delete_failed", { error, id });
    return { status: "error", message: error.message ?? "Failed to delete institution" };
  }

  await logAudit({
    action: "FINANCIAL_INSTITUTION_DELETED",
    entity: "financial_institutions",
    entityId: id,
    diff: null,
  });

  await revalidatePath("/admin");
  return { status: "success", message: "Institution removed" };
}

export const upsertFinancialInstitution = instrumentServerAction(
  "admin.upsertFinancialInstitution",
  upsertFinancialInstitutionInternal,
);
export const deleteFinancialInstitution = instrumentServerAction(
  "admin.deleteFinancialInstitution",
  deleteFinancialInstitutionInternal,
);

// ---------- MoMo code management ----------

type MomoCodePayload = {
  id?: string;
  provider: string;
  district: string;
  code: string;
  accountName?: string | null;
  description?: string | null;
};

async function upsertMomoCodeInternal(payload: MomoCodePayload): Promise<
  AdminActionResult & { record?: Database["app"]["Tables"]["momo_codes"]["Row"] }
> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });

  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_momo_code_denied", { actorRole: profile.role });
    return { status: "error", message: "Only system administrators can manage MoMo codes." };
  }

  const supabase = await createSupabaseServerClient();
  const table = supabase.schema("app").from("momo_codes");
  const basePayload: Database["app"]["Tables"]["momo_codes"]["Insert"] = {
    provider: (payload.provider ?? "").trim().toUpperCase(),
    district: (payload.district ?? "").trim().toUpperCase(),
    code: (payload.code ?? "").trim(),
    account_name: payload.accountName?.trim() || null,
    description: payload.description?.trim() || null,
  };

  let result;
  if (payload.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (table as any)
      .update(basePayload)
      .eq("id", payload.id)
      .select("*")
      .maybeSingle();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (table as any)
      .insert(basePayload)
      .select("*")
      .single();
  }

  if (result.error) {
    logError("admin_momo_code_upsert_failed", { error: result.error, payload });
    return { status: "error", message: result.error.message ?? "Failed to save MoMo code" };
  }

  const momoCodeId = (result.data as { id?: string } | null)?.id ?? "UNKNOWN";

  await logAudit({
    action: payload.id ? "MOMO_CODE_UPDATED" : "MOMO_CODE_CREATED",
    entity: "momo_codes",
    entityId: momoCodeId,
    diff: {
      provider: payload.provider,
      district: payload.district,
      code: payload.code,
      accountName: payload.accountName ?? null,
      description: payload.description ?? null,
    },
  });

  await revalidatePath("/admin");
  return {
    status: "success",
    message: payload.id ? "MoMo code updated" : "MoMo code created",
    record: result.data ?? undefined,
  };
}

async function deleteMomoCodeInternal({ id }: { id: string }): Promise<AdminActionResult> {
  const { profile, user } = await requireUserAndProfile();
  updateLogContext({ userId: user.id, saccoId: profile.sacco_id ?? null });

  if (profile.role !== "SYSTEM_ADMIN") {
    logWarn("admin_momo_code_delete_denied", { actorRole: profile.role });
    return { status: "error", message: "Only system administrators can manage MoMo codes." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("app").from("momo_codes").delete().eq("id", id);

  if (error) {
    logError("admin_momo_code_delete_failed", { error, id });
    return { status: "error", message: error.message ?? "Failed to delete MoMo code" };
  }

  await logAudit({
    action: "MOMO_CODE_DELETED",
    entity: "momo_codes",
    entityId: id,
    diff: null,
  });

  await revalidatePath("/admin");
  return { status: "success", message: "MoMo code removed" };
}

export const upsertMomoCode = instrumentServerAction("admin.upsertMomoCode", upsertMomoCodeInternal);
export const deleteMomoCode = instrumentServerAction("admin.deleteMomoCode", deleteMomoCodeInternal);
