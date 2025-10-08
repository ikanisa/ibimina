"use server";

import { revalidatePath } from "next/cache";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

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
  const { error } = await supabase
    .from("users")
    .update({ role: role as Database["public"]["Enums"]["app_role"], sacco_id: saccoId })
    .eq("id", userId);

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
  const { error } = await supabase.from("notification_queue").insert({
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
  const { error } = await supabase.from("notification_queue").insert({
    event: "MFA_REMINDER",
    payload: { userId, email, queuedBy: user.id },
    scheduled_for: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: error.message ?? "Failed to queue reminder" };
  }

  return { status: "success", message: "Reminder queued" };
}
