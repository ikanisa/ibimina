"use client";

import { useEffect, useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import { useToast } from "@/providers/toast-provider";
import { resetUserPassword, toggleUserSuspension } from "@/app/(main)/admin/actions";
import { SaccoSearchCombobox, type SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { OrgSearchCombobox, type OrgSearchResult } from "@/components/admin/org-search-combobox";

type AppRole = Database["public"]["Enums"]["app_role"];

const resolveOrgTypeFromRole = (role: AppRole): "SACCO" | "MFI" | "DISTRICT" => {
  if (role === "DISTRICT_MANAGER") return "DISTRICT";
  if (role === "MFI_MANAGER" || role === "MFI_STAFF") return "MFI";
  return "SACCO";
};

export interface StaffRow {
  id: string;
  email: string;
  role: AppRole;
  sacco_id: string | null;
  sacco_name: string | null;
  suspended?: boolean | null;
  created_at?: string | null;
  mfa_enabled?: boolean | null;
  mfa_passkey_enrolled?: boolean | null;
}

interface StaffDetailProps {
  user: StaffRow;
  saccos: Array<{ id: string; name: string }>;
  onClose: () => void;
  onUpdated?: () => void;
}

export function StaffDetail({ user, saccos, onClose, onUpdated }: StaffDetailProps) {
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();
  const [role, setRole] = useState<AppRole>(user.role);
  const [sacco, setSacco] = useState<SaccoSearchResult | null>(user.sacco_id ? { id: user.sacco_id, name: user.sacco_name ?? "", district: "", province: "", category: "" } : null);
  const [org, setOrg] = useState<OrgSearchResult | null>(null);
  const [memberships, setMemberships] = useState<Array<{ org_id: string; role: AppRole; created_at?: string | null; organizations?: { name?: string | null; type?: string | null } | null }>>([]);
  const [membershipType, setMembershipType] = useState<"SACCO" | "MFI" | "DISTRICT">(resolveOrgTypeFromRole(user.role));
  const [membershipRole, setMembershipRole] = useState<AppRole>(user.role);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/staff/memberships?user_id=${encodeURIComponent(user.id)}`);
        if (!active) return;
        if (res.ok) {
          const data = (await res.json()) as { memberships: typeof memberships };
          const list = data.memberships ?? [];
          setMemberships(list);
          const targetType = resolveOrgTypeFromRole(user.role);
          if (targetType !== "SACCO") {
            setOrg((current) => {
              if (current) return current;
              const match = list.find((m) => (m.organizations?.type ?? null) === targetType);
              if (!match) return current;
              return { id: match.org_id, name: match.organizations?.name ?? match.org_id };
            });
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [user.id, user.role]);

  useEffect(() => {
    setMembershipType(resolveOrgTypeFromRole(role));
    if (!(role === "DISTRICT_MANAGER" || role === "MFI_MANAGER" || role === "MFI_STAFF")) {
      setOrg(null);
    }
  }, [role]);

  const ROLES: AppRole[] = [
    "SYSTEM_ADMIN",
    "SACCO_MANAGER",
    "SACCO_STAFF",
    "SACCO_VIEWER",
    "DISTRICT_MANAGER",
    "MFI_MANAGER",
    "MFI_STAFF",
  ];

  const assignRole = () => {
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = { user_id: user.id, role };
        const isSaccoRole = role === "SACCO_MANAGER" || role === "SACCO_STAFF" || role === "SACCO_VIEWER";
        if (isSaccoRole) body.sacco_id = sacco?.id ?? null;
        // For other org types, use /api/admin/staff/assign-role (org_memberships upsert inside)
        const res = await fetch("/api/admin/staff/assign-role", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isSaccoRole ? body : { ...body, sacco_id: null, org_id: org?.id ?? null }),
        });
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: "Update failed" }));
          error(String(msg ?? "Update failed"));
          return;
        }
        success("Access updated");
        onUpdated?.();
      } catch (e) {
        error("Update failed");
      }
    });
  };

  const doResetPassword = () => {
    startTransition(async () => {
      const result = await resetUserPassword({ userId: user.id, email: user.email });
      if (result.status === "error") {
        error(result.message ?? "Reset failed");
      } else {
        success(result.temporaryPassword ? `Temporary password: ${result.temporaryPassword}` : "Password reset");
      }
    });
  };

  const doToggleSuspend = () => {
    startTransition(async () => {
      const result = await toggleUserSuspension({ userId: user.id, suspended: !Boolean(user.suspended) });
      if (result.status === "error") {
        error(result.message ?? "Operation failed");
      } else {
        success(result.message ?? "Updated");
        onUpdated?.();
      }
    });
  };

  const isSaccoRoleSel = role === "SACCO_MANAGER" || role === "SACCO_STAFF" || role === "SACCO_VIEWER";
  const isDistrictRoleSel = role === "DISTRICT_MANAGER";
  const isMfiRoleSel = role === "MFI_MANAGER" || role === "MFI_STAFF";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-0">Staff Detail</h2>
          <button onClick={onClose} className="text-neutral-2 hover:text-neutral-0">Close</button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-neutral-2">Email</div>
            <div className="text-neutral-0">{user.email}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-neutral-0">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">Status</label>
              <div className="mt-2 text-neutral-0">{user.suspended ? "Suspended" : "Active"}</div>
            </div>
          </div>

          {isSaccoRoleSel && (
            <SaccoSearchCombobox value={sacco} onChange={setSacco} />
          )}
          {isDistrictRoleSel && (
            <OrgSearchCombobox type="DISTRICT" value={org} onChange={setOrg} />
          )}
          {isMfiRoleSel && (
            <OrgSearchCombobox type="MFI" value={org} onChange={setOrg} />
          )}

          <div className="flex gap-2">
            <button onClick={assignRole} disabled={pending} className="rounded-xl bg-kigali px-4 py-2 text-sm font-semibold text-ink shadow-glass">Save</button>
            <button onClick={doResetPassword} disabled={pending} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-0">Reset password</button>
            <button onClick={doToggleSuspend} disabled={pending} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-0">{user.suspended ? "Activate" : "Suspend"}</button>
          </div>

          {/* Memberships */}
          <div className="pt-2">
            <div className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-2">Org memberships</div>
            <ul className="space-y-1 text-neutral-0">
              {memberships.length === 0 && <li className="text-neutral-2">None</li>}
              {memberships.map((m) => (
                <li key={`${m.org_id}-${m.role}`} className="flex items-center justify-between gap-2">
                  <span>
                    {(m.organizations?.type ?? "").toString()} — {(m.organizations?.name ?? m.org_id).toString()} ({m.role})
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/staff/memberships?user_id=${encodeURIComponent(user.id)}&org_id=${encodeURIComponent(m.org_id)}`, { method: "DELETE" });
                      // refresh
                      const res = await fetch(`/api/admin/staff/memberships?user_id=${encodeURIComponent(user.id)}`);
                      if (res.ok) {
                        const data = (await res.json()) as { memberships: typeof memberships };
                        setMemberships(data.memberships ?? []);
                        onUpdated?.();
                      }
                    }}
                    className="rounded-lg border border-white/15 px-2 py-1 text-xs text-neutral-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">Type</label>
                <select value={membershipType} onChange={(e) => setMembershipType(e.target.value as any)} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0">
                  <option value="SACCO">SACCO</option>
                  <option value="MFI">MFI</option>
                  <option value="DISTRICT">District</option>
                </select>
                {membershipType === "SACCO" && (
                  <SaccoSearchCombobox value={sacco} onChange={setSacco} />
                )}
                {membershipType === "MFI" && (
                  <OrgSearchCombobox type="MFI" value={org} onChange={setOrg} />
                )}
                {membershipType === "DISTRICT" && (
                  <OrgSearchCombobox type="DISTRICT" value={org} onChange={setOrg} />
                )}
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">Role</label>
                <select value={membershipRole} onChange={(e) => setMembershipRole(e.target.value as AppRole)} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0">
                  {(["SYSTEM_ADMIN","SACCO_MANAGER","SACCO_STAFF","SACCO_VIEWER","DISTRICT_MANAGER","MFI_MANAGER","MFI_STAFF"] as AppRole[]).map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const selectedOrgId = membershipType === "SACCO" ? sacco?.id : org?.id;
                  if (!selectedOrgId) return;
                  await fetch(`/api/admin/staff/memberships`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: user.id, org_id: selectedOrgId, role: membershipRole }),
                  });
                  const res = await fetch(`/api/admin/staff/memberships?user_id=${encodeURIComponent(user.id)}`);
                  if (res.ok) {
                    const data = (await res.json()) as { memberships: typeof memberships };
                    setMemberships(data.memberships ?? []);
                    onUpdated?.();
                  }
                }}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm text-neutral-0"
              >
                Add membership
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
