"use client";

import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SaccoSearchCombobox, type SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { useToast } from "@/providers/toast-provider";
import { useTranslation } from "@/providers/i18n-provider";

const ROLES: Array<Database["public"]["Enums"]["app_role"]> = [
  "SYSTEM_ADMIN",
  "SACCO_MANAGER",
  "SACCO_STAFF",
  "SACCO_VIEWER",
];

export function InviteUserForm() {
  const supabase = getSupabaseBrowserClient();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Database["public"]["Enums"]["app_role"]>("SACCO_STAFF");
  const [sacco, setSacco] = useState<SaccoSearchResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { success, error: toastError } = useToast();

  const notifyError = (msg: string) => toastError(msg);
  const notifySuccess = (msg: string) => success(msg);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (role !== "SYSTEM_ADMIN" && !sacco) {
      const msg = t("admin.invite.selectSacco", "Select a SACCO for this role");
      setError(msg);
      notifyError(msg);
      return;
    }

    startTransition(async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email,
          role,
          saccoId: role === "SYSTEM_ADMIN" ? null : sacco?.id ?? null,
        },
      });

      if (error) {
        console.error(error);
        const msg = error.message ?? t("admin.invite.fail", "Invite failed");
        setError(msg);
        notifyError(msg);
        return;
      }

      const msg = data?.temporaryPassword
        ? t("admin.invite.sentWithTemp", "Invitation sent. Temporary password: ") + data.temporaryPassword
        : t("admin.invite.sent", "Invitation sent successfully");
      setMessage(msg);
      notifySuccess(t("admin.invite.notice", "Invitation sent to staff"));
      setEmail("");
      setRole("SACCO_STAFF");
      setSacco(null);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-2 space-y-2">
        <p className="text-neutral-2">
          {t(
            "admin.invite.helper1",
            "Invited users receive a one-time password via email; they must sign in with that password and change it immediately."
          )}
        </p>
        <p className="text-neutral-2">
          {t(
            "admin.invite.helper2",
            "Assign managers for full control, staff for day-to-day updates, and viewers for read-only dashboards."
          )}
        </p>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{t("common.email", "Email")}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          placeholder={t("admin.invite.emailPlaceholder", "staff@sacco.rw")}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{t("admin.invite.role", "Role")}</label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as (typeof ROLES)[number])}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {role !== "SYSTEM_ADMIN" && <SaccoSearchCombobox value={sacco} onChange={setSacco} />}

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="interactive-scale w-full rounded-xl bg-kigali py-3 text-sm font-semibold uppercase tracking-wide text-ink shadow-glass disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? t("common.sending", "Sending…") : t("admin.invite.send", "Send invite")}
      </button>
    </form>
  );
}
