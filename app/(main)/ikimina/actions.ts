"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserAndProfile } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string | undefined>;
};

const INITIAL_STATE: SettingsActionState = { status: "idle" };

const FREQUENCY_OPTIONS = ["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"] as const;

type Frequency = (typeof FREQUENCY_OPTIONS)[number];

type ParsedForm = {
  ikiminaId: string;
  contributionFrequency: Frequency;
  contributionFixedAmount: number | null;
  allowPartialPayments: boolean;
  gracePeriodDays: number;
  lateFeePercent: number;
  smsReminders: boolean;
  reminderDaysBefore: number;
};

function extractString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function toNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function validate(formData: FormData): { data?: ParsedForm; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};

  const ikiminaId = extractString(formData.get("ikiminaId"));
  if (!ikiminaId) {
    errors.ikiminaId = "Missing ikimina identifier";
  }

  const frequencyRaw = extractString(formData.get("contributionFrequency"));
  const contributionFrequency = FREQUENCY_OPTIONS.includes(frequencyRaw as Frequency)
    ? (frequencyRaw as Frequency)
    : undefined;
  if (!contributionFrequency) {
    errors.contributionFrequency = "Select a contribution frequency";
  }

  const fixedAmountRaw = formData.get("contributionFixedAmount");
  const contributionFixedAmount = toNumber(fixedAmountRaw);
  if (fixedAmountRaw !== null && contributionFixedAmount === null) {
    errors.contributionFixedAmount = "Enter a valid amount";
  }
  if (contributionFixedAmount !== null && contributionFixedAmount < 0) {
    errors.contributionFixedAmount = "Amount must be 0 or greater";
  }

  const grace = toNumber(formData.get("gracePeriodDays"));
  const gracePeriodDays = grace ?? 0;
  if (grace === null || gracePeriodDays < 0 || gracePeriodDays > 60) {
    errors.gracePeriodDays = "Grace period must be between 0 and 60";
  }

  const lateFee = toNumber(formData.get("lateFeePercent"));
  const lateFeePercent = lateFee ?? 0;
  if (lateFee === null || lateFeePercent < 0 || lateFeePercent > 100) {
    errors.lateFeePercent = "Late fee must be between 0 and 100";
  }

  const reminder = toNumber(formData.get("reminderDaysBefore"));
  const reminderDaysBefore = reminder ?? 0;
  if (reminder === null || reminderDaysBefore < 0 || reminderDaysBefore > 30) {
    errors.reminderDaysBefore = "Reminder window must be between 0 and 30";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      ikiminaId,
      contributionFrequency: contributionFrequency!,
      contributionFixedAmount,
      allowPartialPayments: toBoolean(formData.get("allowPartialPayments")),
      gracePeriodDays,
      lateFeePercent,
      smsReminders: toBoolean(formData.get("smsReminders")),
      reminderDaysBefore,
    },
  };
}

export async function updateIkiminaSettings(
  _prevState: SettingsActionState = INITIAL_STATE,
  formData: FormData
): Promise<SettingsActionState> {
  void _prevState;
  const validation = validate(formData);
  if (validation.errors) {
    return { status: "error", message: "Please correct the highlighted fields", fieldErrors: validation.errors };
  }

  const { data } = validation;
  if (!data) {
    return { status: "error", message: "Unable to parse form submission" };
  }

  const { user, profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("ibimina")
    .select("id, sacco_id")
    .eq("id", data.ikiminaId)
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return { status: "error", message: "Failed to load ikimina record" };
  }

  type IkiminaRow = Database["public"]["Tables"]["ibimina"]["Row"];
  const typedExisting = existing as IkiminaRow | null;

  if (!typedExisting) {
    return { status: "error", message: "Ikimina not found" };
  }

  if (profile.role !== "SYSTEM_ADMIN" && profile.sacco_id && profile.sacco_id !== typedExisting.sacco_id) {
    return { status: "error", message: "You do not have permission to update this ikimina." };
  }

  const settingsPayload = {
    contribution: {
      fixedAmount: data.contributionFixedAmount,
      frequency: data.contributionFrequency,
    },
    enforcement: {
      allowPartialPayments: data.allowPartialPayments,
      gracePeriodDays: data.gracePeriodDays,
      lateFeePercent: data.lateFeePercent,
    },
    notifications: {
      smsReminders: data.smsReminders,
      reminderDaysBefore: data.reminderDaysBefore,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("ibimina")
    .update({ settings_json: settingsPayload })
    .eq("id", data.ikiminaId);

  if (updateError) {
    console.error(updateError);
    return { status: "error", message: updateError.message ?? "Unable to update settings" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: auditError } = await (supabase as any).from("audit_logs").insert({
    actor_id: user.id,
    action: "IKIMINA_SETTINGS_UPDATE",
    entity: "ibimina",
    entity_id: data.ikiminaId,
    diff_json: settingsPayload,
  });
  if (auditError) {
    console.warn("Failed to write audit log", auditError);
  }

  await revalidatePath(`/ikimina/${data.ikiminaId}`);
  await revalidatePath(`/ikimina/${data.ikiminaId}/settings`);

  return {
    status: "success",
    message: "Ikimina settings updated",
  };
}

export { INITIAL_STATE as IKIMINA_SETTINGS_INITIAL_STATE };
