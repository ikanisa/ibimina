"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/providers/toast-provider";
import {
  IKIMINA_SETTINGS_INITIAL_STATE,
  SettingsActionState,
  updateIkiminaSettings,
} from "@/app/(main)/ikimina/actions";
import { useProfileContext } from "@/providers/profile-provider";
import { canManageSettings } from "@/lib/permissions";

const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom" },
] as const;

type IkiminaSettings = {
  contribution?: {
    fixedAmount?: number | null;
    frequency?: string | null;
  } | null;
  enforcement?: {
    allowPartialPayments?: boolean | null;
    gracePeriodDays?: number | null;
    lateFeePercent?: number | null;
  } | null;
  notifications?: {
    smsReminders?: boolean | null;
    reminderDaysBefore?: number | null;
  } | null;
};

interface IkiminaSettingsEditorProps {
  ikiminaId: string;
  ikiminaName: string;
  saccoId: string | null;
  initialSettings: Record<string, unknown> | null;
  history?: Array<{
    id: string;
    action: string;
    actorLabel: string;
    createdAt: string;
    diff: Record<string, unknown> | null;
  }>;
}

type FieldState = {
  contributionFixedAmount: string;
  contributionFrequency: string;
  allowPartialPayments: boolean;
  gracePeriodDays: string;
  lateFeePercent: string;
  smsReminders: boolean;
  reminderDaysBefore: string;
};

export function IkiminaSettingsEditor({
  ikiminaId,
  ikiminaName,
  saccoId,
  initialSettings,
  history = [],
}: IkiminaSettingsEditorProps) {
  const { profile } = useProfileContext();
  const { success, error } = useToast();
  const { t } = useTranslation();

  const defaults = useMemo(() => {
    const settings = (initialSettings as IkiminaSettings | null) ?? null;
    const contribution = settings?.contribution ?? {};
    const enforcement = settings?.enforcement ?? {};
    const notifications = settings?.notifications ?? {};

    const fixedAmount = contribution?.fixedAmount ?? null;
    const frequency = contribution?.frequency ?? "MONTHLY";

    return {
      contributionFixedAmount: fixedAmount != null ? String(fixedAmount) : "",
      contributionFrequency: FREQUENCIES.some((item) => item.value === frequency)
        ? frequency
        : "MONTHLY",
      allowPartialPayments: enforcement?.allowPartialPayments ?? true,
      gracePeriodDays: String(enforcement?.gracePeriodDays ?? 5),
      lateFeePercent: String(enforcement?.lateFeePercent ?? 0),
      smsReminders: notifications?.smsReminders ?? true,
      reminderDaysBefore: String(notifications?.reminderDaysBefore ?? 2),
    } satisfies FieldState;
  }, [initialSettings]);

  const [fields, setFields] = useState<FieldState>(defaults);
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateIkiminaSettings,
    IKIMINA_SETTINGS_INITIAL_STATE
  );

  useEffect(() => {
    if (state.status === "success") {
      success("Settings updated" + " / Amabwiriza yavuguruwe");
    }
    if (state.status === "error" && state.message) {
      error(state.message);
    }
  }, [error, state, success]);

  const preview = useMemo(
    () => ({
      contribution: {
        frequency: fields.contributionFrequency,
        fixedAmount: fields.contributionFixedAmount ? Number(fields.contributionFixedAmount) : null,
      },
      enforcement: {
        allowPartialPayments: fields.allowPartialPayments,
        gracePeriodDays: Number(fields.gracePeriodDays || 0),
        lateFeePercent: Number(fields.lateFeePercent || 0),
      },
      notifications: {
        smsReminders: fields.smsReminders,
        reminderDaysBefore: Number(fields.reminderDaysBefore || 0),
      },
    }),
    [fields]
  );

  const canEdit = canManageSettings(profile, saccoId);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <GlassCard
      title={`${t("common.settings", "Settings")} · ${ikiminaName}`}
      subtitle={t(
        "ikimina.settings.subtitle",
        "Adjust contribution policies, enforcement rules, and reminders."
      )}
      actions={
        !canEdit ? (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-3">
            {t("common.readOnly", "Read only")}
          </span>
        ) : undefined
      }
    >
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="ikiminaId" value={ikiminaId} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
              {t("ikimina.settings.contributionAmount", "Contribution amount")}
            </label>
            <Input
              name="contributionFixedAmount"
              type="number"
              min={0}
              step="100"
              placeholder="e.g. 15000"
              value={fields.contributionFixedAmount}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, contributionFixedAmount: event.target.value }))
              }
              disabled={!canEdit || pending}
              helperText={t(
                "ikimina.settings.contributionHint",
                "Leave blank for flexible contributions"
              )}
            />
            {fieldErrors.contributionFixedAmount && (
              <p className="text-xs text-red-300">{fieldErrors.contributionFixedAmount}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
              {t("ikimina.settings.frequency", "Frequency")}
            </label>
            <select
              name="contributionFrequency"
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue disabled:opacity-60"
              value={fields.contributionFrequency}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, contributionFrequency: event.target.value }))
              }
              disabled={!canEdit || pending}
            >
              {FREQUENCIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.contributionFrequency && (
              <p className="text-xs text-red-300">{fieldErrors.contributionFrequency}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow-partial"
              name="allowPartialPayments"
              checked={fields.allowPartialPayments}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, allowPartialPayments: event.target.checked }))
              }
              className="h-4 w-4 rounded border-white/30 bg-transparent"
              disabled={!canEdit || pending}
            />
            <label htmlFor="allow-partial" className="text-sm text-neutral-0">
              {t("ikimina.settings.allowPartial", "Allow partial payments")}
            </label>
          </div>
          <div className="space-y-2">
            <Input
              label={t("ikimina.settings.gracePeriod", "Grace period (days)")}
              name="gracePeriodDays"
              type="number"
              min={0}
              max={60}
              value={fields.gracePeriodDays}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, gracePeriodDays: event.target.value }))
              }
              disabled={!canEdit || pending}
            />
            {fieldErrors.gracePeriodDays && (
              <p className="text-xs text-red-300">{fieldErrors.gracePeriodDays}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              label={t("ikimina.settings.lateFee", "Late fee (%)")}
              name="lateFeePercent"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={fields.lateFeePercent}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, lateFeePercent: event.target.value }))
              }
              disabled={!canEdit || pending}
            />
            {fieldErrors.lateFeePercent && (
              <p className="text-xs text-red-300">{fieldErrors.lateFeePercent}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sms-reminders"
              name="smsReminders"
              checked={fields.smsReminders}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, smsReminders: event.target.checked }))
              }
              className="h-4 w-4 rounded border-white/30 bg-transparent"
              disabled={!canEdit || pending}
            />
            <label htmlFor="sms-reminders" className="text-sm text-neutral-0">
              {t("ikimina.settings.smsReminders", "Send SMS reminders")}
            </label>
          </div>
          <div className="space-y-2">
            <Input
              label={t("ikimina.settings.reminderLead", "Reminder lead time")}
              name="reminderDaysBefore"
              type="number"
              min={0}
              max={30}
              value={fields.reminderDaysBefore}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, reminderDaysBefore: event.target.value }))
              }
              helperText={t("ikimina.settings.reminderLeadHint", "Days before due date")}
              disabled={!canEdit || pending}
            />
            {fieldErrors.reminderDaysBefore && (
              <p className="text-xs text-red-300">{fieldErrors.reminderDaysBefore}</p>
            )}
          </div>
        </div>

        {state.status === "error" && state.message && !state.fieldErrors && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.message}</p>
        )}
        {state.status === "success" && state.message && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {state.message}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="interactive-scale rounded-full bg-kigali px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
            disabled={!canEdit || pending}
          >
            {pending ? t("common.saving", "Saving…") : t("common.save", "Save")}
          </button>
          {!canEdit && (
            <span className="text-xs text-neutral-3">
              {t(
                "ikimina.settings.readOnlyHint",
                "Only system admins or the assigned SACCO can edit these settings."
              )}
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">
          {t("ikimina.settings.previewJson", "Preview JSON")}
        </p>
        <pre className="mt-2 overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-neutral-2">
          {JSON.stringify(preview, null, 2)}
        </pre>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">
            {t("ikimina.settings.recentUpdates", "Recent updates")}
          </p>
          {history.length === 0 ? (
            <p className="text-xs text-neutral-3">
              {t("ikimina.settings.noHistory", "No prior settings updates recorded.")}
            </p>
          ) : (
            <ul className="space-y-3 text-xs text-neutral-0">
              {history.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-2">
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    <span>{entry.actorLabel}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-0">{entry.action}</p>
                  {entry.diff && (
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-[11px] text-neutral-2">
                      {JSON.stringify(entry.diff, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
