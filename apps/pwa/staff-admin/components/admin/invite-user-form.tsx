"use client";

import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import {
  SaccoSearchCombobox,
  type SaccoSearchResult,
} from "@/components/saccos/sacco-search-combobox";
import { OrgSearchCombobox, type OrgSearchResult } from "@/components/admin/org-search-combobox";
import { useToast } from "@/providers/toast-provider";
import { useTranslation } from "@/providers/i18n-provider";

const ROLES: Array<Database["public"]["Enums"]["app_role"]> = [
  "SYSTEM_ADMIN",
  "SACCO_MANAGER",
  "SACCO_STAFF",
  "SACCO_VIEWER",
  "DISTRICT_MANAGER",
  "MFI_MANAGER",
  "MFI_STAFF",
];

export function InviteUserForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Database["public"]["Enums"]["app_role"]>("SACCO_STAFF");
  const [sacco, setSacco] = useState<SaccoSearchResult | null>(null);
  const [org, setOrg] = useState<OrgSearchResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteMeta, setInviteMeta] = useState<{
    method?: string;
    status?: string;
    error?: string | null;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const { success, error: toastError } = useToast();

  const notifyError = (msg: string) => toastError(msg);
  const notifySuccess = (msg: string) => success(msg);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setInviteMeta(null);

    // For non-admin roles, require an organization selection
    if (role !== "SYSTEM_ADMIN") {
      const requiresSacco =
        role === "SACCO_MANAGER" || role === "SACCO_STAFF" || role === "SACCO_VIEWER";
      const requiresDistrict = role === "DISTRICT_MANAGER";
      const requiresMfi = role === "MFI_MANAGER" || role === "MFI_STAFF";
      if (requiresSacco && !sacco) {
        const msg = t("admin.invite.selectSacco", "Select a SACCO for this role");
        setError(msg);
        notifyError(msg);
        return;
      }
      if ((requiresDistrict || requiresMfi) && !org) {
        const msg = t("admin.invite.selectOrg", "Select an organization for this role");
        setError(msg);
        notifyError(msg);
        return;
      }
    }

    startTransition(async () => {
      const orgType =
        role === "DISTRICT_MANAGER"
          ? "DISTRICT"
          : role === "MFI_MANAGER" || role === "MFI_STAFF"
            ? "MFI"
            : role === "SYSTEM_ADMIN"
              ? null
              : "SACCO";
      const orgId = orgType === "SACCO" ? (sacco?.id ?? null) : (org?.id ?? null);

      const response = await fetch("/api/admin/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          sacco_id: orgType === "SACCO" ? orgId : null,
          org_type: orgType,
          org_id: orgId,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        temporary_password?: string;
        invite_error?: string | null;
        invite_method?: string;
      };

      if (!response.ok || payload.error) {
        const msg = payload.error ?? t("admin.invite.fail", "Invite failed");
        setError(msg);
        notifyError(msg);
        setInviteMeta({
          method: payload.invite_method,
          status: "error",
          error: payload.invite_error ?? payload.error,
        });
        return;
      }

      const msg = payload.temporary_password
        ? t("admin.invite.sentWithTemp", "Invitation sent. Temporary password: ") +
          payload.temporary_password
        : t("admin.invite.sent", "Invitation sent successfully");
      setMessage(msg);
      setInviteMeta({
        method: payload.invite_method,
        status: payload.invite_error ? "error" : "sent",
        error: payload.invite_error ?? null,
      });
      notifySuccess(t("admin.invite.notice", "Invitation sent to staff"));
      setEmail("");
      setRole("SACCO_STAFF");
      setSacco(null);
      setOrg(null);
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
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          {t("common.email", "Email")}
        </label>
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
        <label className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          {t("admin.invite.role", "Role")}
        </label>
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

      {role !== "SYSTEM_ADMIN" &&
        (role === "SACCO_MANAGER" || role === "SACCO_STAFF" || role === "SACCO_VIEWER") && (
          <SaccoSearchCombobox value={sacco} onChange={setSacco} />
        )}
      {role === "DISTRICT_MANAGER" && (
        <OrgSearchCombobox type="DISTRICT" value={org} onChange={setOrg} />
      )}
      {(role === "MFI_MANAGER" || role === "MFI_STAFF") && (
        <OrgSearchCombobox type="MFI" value={org} onChange={setOrg} />
      )}

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && (
        <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>
      )}
      {inviteMeta && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-0">
          <p className="font-semibold uppercase tracking-[0.3em] text-neutral-2">Delivery</p>
          <p className="mt-1 text-sm">
            Status: <span className="font-semibold">{inviteMeta.status ?? "unknown"}</span>
          </p>
          <p className="text-sm">Method: {inviteMeta.method ?? "n/a"}</p>
          {inviteMeta.error && (
            <p className="mt-1 text-sm text-red-300">Error: {inviteMeta.error}</p>
          )}
        </div>
      )}

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
