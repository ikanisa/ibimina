import { redirect } from "next/navigation";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { requireUserAndProfile } from "@/lib/auth";
import { isSystemAdmin } from "@/lib/permissions";
import { supabaseSrv } from "@/lib/supabase/server";

export const metadata = {
  title: "User invitations",
};

type InviteAuditRow = {
  id: string;
  created_at: string | null;
  diff: Record<string, unknown> | null;
};

export default async function AdminInvitesPage() {
  const { profile } = await requireUserAndProfile();
  if (!isSystemAdmin(profile)) {
    redirect("/admin");
  }

  const supabase = supabaseSrv();
  const { data: auditLogs, error } = await (supabase as any)
    .schema("app")
    .from("audit_logs")
    .select("id, created_at, diff, action")
    .eq("action", "INVITE_USER")
    .order("created_at", { descending: true })
    .limit(25);

  if (error) throw error;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-0">User invitations</h1>
        <p className="text-neutral-2">
          Create new accounts and review the delivery status of recent invites.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-2">
                Recent activity
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm text-neutral-0">
                <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(auditLogs as InviteAuditRow[] | null)?.map((log) => {
                    const diff = (log.diff ?? {}) as Record<string, unknown>;
                    const email = (diff.email as string | undefined) ?? "Unknown";
                    const role = (diff.role as string | undefined) ?? "—";
                    const status = (diff.invite_status as string | undefined) ?? "sent";
                    const method = (diff.invite_method as string | undefined) ?? "supabase";
                    const errorMessage = diff.invite_error as string | undefined;

                    return (
                      <tr key={log.id}>
                        <td className="px-4 py-3 font-medium">{email}</td>
                        <td className="px-4 py-3 text-neutral-1">{role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              status === "error"
                                ? "bg-red-500/15 text-red-200"
                                : status === "skipped"
                                  ? "bg-amber-500/15 text-amber-100"
                                  : "bg-emerald-500/15 text-emerald-200"
                            }`}
                          >
                            {status}
                          </span>
                          {errorMessage && (
                            <div className="mt-1 text-xs text-red-200">{errorMessage}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-1">{method}</td>
                        <td className="px-4 py-3 text-neutral-2">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {!auditLogs?.length && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-neutral-2" colSpan={5}>
                        No invitations logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-semibold text-neutral-0">Create new invite</h2>
            <InviteUserForm />
          </div>
        </div>
      </div>
    </div>
  );
}
