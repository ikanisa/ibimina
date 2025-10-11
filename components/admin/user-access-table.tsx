"use client";

import { useMemo, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import { useTranslation } from "@/providers/i18n-provider";
import { useToast } from "@/providers/toast-provider";
import { queueMfaReminder, updateUserAccess } from "@/app/(main)/admin/actions";

const ROLES: Array<Database["public"]["Enums"]["app_role"]> = [
  "SYSTEM_ADMIN",
  "SACCO_MANAGER",
  "SACCO_STAFF",
  "SACCO_VIEWER",
];

interface AdminUserRow {
  id: string;
  email: string;
  role: Database["public"]["Enums"]["app_role"];
  sacco_id: string | null;
  sacco_name: string | null;
  created_at: string | null;
}

interface UserAccessTableProps {
  users: AdminUserRow[];
  saccos: Array<{ id: string; name: string }>;
}

export function UserAccessTable({ users, saccos }: UserAccessTableProps) {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();

  const saccoOptions = useMemo(() => [{ id: "", name: t("sacco.all", "All SACCOs") }, ...saccos], [saccos, t]);

  const handleUpdate = (
    userId: string,
    role: Database["public"]["Enums"]["app_role"],
    saccoId: string | null,
  ) => {
    startTransition(async () => {
      const result = await updateUserAccess({ userId, role, saccoId });
      if (result.status === "error") {
        error(result.message ?? t("common.operationFailed", "Operation failed"));
      } else {
        success(result.message ?? t("admin.users.updated", "User updated"));
      }
    });
  };

  const handleMfaReminder = (user: AdminUserRow) => {
    startTransition(async () => {
      const result = await queueMfaReminder({ userId: user.id, email: user.email });
      if (result.status === "error") {
        error(result.message ?? t("admin.users.reminderFailed", "Reminder failed"));
      } else {
        success(result.message ?? t("admin.users.reminderQueued", "Reminder queued"));
      }
    });
  };

  const handleMfaReset = (user: AdminUserRow) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/mfa/reset/${encodeURIComponent(user.id)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "lost device" }),
        });
        if (!response.ok) {
          const { error: code } = (await response.json().catch(() => ({ error: "unknown" })));
          error(
            code === "forbidden"
              ? t("admin.users.resetForbidden", "Only administrators can reset 2FA")
              : t("admin.users.resetFailed", "Failed to reset 2FA"),
          );
          return;
        }
        success(t("admin.users.resetSuccess", "2FA reset. Ask user to re-enroll at next sign-in."));
      } catch (e) {
        error(t("admin.users.resetFailed", "Failed to reset 2FA"));
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
          <tr>
            <th className="px-4 py-3">
              {t("common.email", "Email")}
            </th>
            <th className="px-4 py-3">
              {t("admin.invite.role", "Role")}
            </th>
            <th className="px-4 py-3">
              {t("nav.ikimina", "Ikimina")}
            </th>
            <th className="px-4 py-3">
              {t("common.created", "Created")}
            </th>
            <th className="px-4 py-3">
              2FA
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-white/5">
              <td className="px-4 py-3 font-medium text-neutral-0">{user.email}</td>
              <td className="px-4 py-3 text-neutral-0">
                <select
                  value={user.role}
                  onChange={(event) => {
                    const nextRole = event.target.value as Database["public"]["Enums"]["app_role"];
                    const nextSacco = nextRole === "SYSTEM_ADMIN" ? null : user.sacco_id;
                    handleUpdate(user.id, nextRole, nextSacco);
                  }}
                  disabled={pending}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                >
                  {ROLES.map((value) => (
                    <option key={value} value={value}>
                      {value.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-neutral-0">
                <select
                  value={user.sacco_id ?? ""}
                  onChange={(event) => handleUpdate(user.id, user.role, event.target.value || null)}
                  disabled={pending || user.role === "SYSTEM_ADMIN"}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                >
                  {saccoOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-neutral-2">
                {user.created_at ? new Date(user.created_at).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 text-neutral-2">
                <div className="flex flex-col gap-1 text-[11px]">
                  <span>{t("admin.users.mfaManaged", "Managed in profile")}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMfaReminder(user)}
                      disabled={pending}
                      className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-neutral-0 hover:border-white/30"
                    >
                      {t("admin.users.send2faReminder", "Send 2FA reminder")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMfaReset(user)}
                      disabled={pending}
                      className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-amber-200 hover:border-white/30"
                    >
                      {t("admin.users.reset2fa", "Reset 2FA")}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
