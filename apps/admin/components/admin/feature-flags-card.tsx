"use client";

import { useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import { useTranslation } from "@/providers/i18n-provider";

type Flags = {
  enable_offline_queue?: boolean;
  enable_scheduled_reconciliation?: boolean;
  enable_notification_pipeline?: boolean;
};

type ConfigRow = {
  key: string;
  value: Flags | null;
  updated_at: string | null;
};

const supabase = getSupabaseBrowserClient();

export function FeatureFlagsCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Flags>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("configuration")
        .select("key, value, updated_at")
        .eq("key", "feature_flags")
        .single();
      if (!active) return;
      if (error) {
        toast.error(error.message ?? t("common.operationFailed", "Operation failed"));
      } else {
        const row = data as unknown as ConfigRow;
        const next: Flags = {
          enable_offline_queue: row.value?.enable_offline_queue ?? true,
          enable_scheduled_reconciliation: row.value?.enable_scheduled_reconciliation ?? false,
          enable_notification_pipeline: row.value?.enable_notification_pipeline ?? false,
        };
        setFlags(next);
        setUpdatedAt(row.updated_at);
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    startTransition(async () => {
      const { error } = await (supabase as any)
        .from("configuration")
        .update({ value: flags })
        .eq("key", "feature_flags");
      if (error) {
        toast.error(t("admin.flags.saveFailed", "Failed to save flags"));
        return;
      }
      toast.success(t("admin.flags.saved", "Flags updated"));
      setUpdatedAt(new Date().toISOString());
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-2">
          {updatedAt && (
            <span>
              {t("admin.flags.updatedAt", "Updated")}: {new Date(updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
        >
          {saving ? t("common.saving", "Saving…") : t("common.save", "Save")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FlagToggle
          label={t("admin.flags.offlineQueue", "Enable offline queue")}
          checked={!!flags.enable_offline_queue}
          onChange={(v) => setFlags((f) => ({ ...f, enable_offline_queue: v }))}
        />
        <FlagToggle
          label={t("admin.flags.scheduledRecon", "Enable scheduled reconciliation")}
          checked={!!flags.enable_scheduled_reconciliation}
          onChange={(v) => setFlags((f) => ({ ...f, enable_scheduled_reconciliation: v }))}
        />
        <FlagToggle
          label={t("admin.flags.notifications", "Enable notification pipeline")}
          checked={!!flags.enable_notification_pipeline}
          onChange={(v) => setFlags((f) => ({ ...f, enable_notification_pipeline: v }))}
        />
      </div>
    </div>
  );
}

function FlagToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-0">
      <span>{label}</span>
      <span>
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-white/10 bg-white/10 accent-kigali"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </span>
    </label>
  );
}
