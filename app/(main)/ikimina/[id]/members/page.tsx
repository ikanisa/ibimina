import { notFound } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { MemberImportWizard } from "@/components/ikimina/member-import-wizard";
import { MemberPdfImportDialog } from "@/components/ikimina/member-pdf-import-dialog";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { canManageMembers, hasSaccoReadAccess } from "@/lib/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MembersPage({ params }: PageProps) {
  const { id } = await params;
  const { profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const { data: group, error: groupError } = await supabase
    .from("ibimina")
    .select("id, sacco_id, name")
    .eq("id", id)
    .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    notFound();
  }

  type GroupRow = Database["public"]["Tables"]["ibimina"]["Row"];
  const resolvedGroup = group as GroupRow;

  if (!hasSaccoReadAccess(profile, resolvedGroup.sacco_id)) notFound();

  const { data: members, error: membersError } = await supabase
    .from("ikimina_members_public")
    .select("id, full_name, member_code, msisdn, status, joined_at")
    .eq("ikimina_id", id)
    .order("joined_at", { ascending: false });

  if (membersError) {
    throw membersError;
  }

  type MemberRow = Database["public"]["Views"]["ikimina_members_public"]["Row"];
  const memberRows = (members ?? []) as MemberRow[];

  const allowImports = canManageMembers(profile, resolvedGroup.sacco_id);

  return (
    <GlassCard
      title={`Members · ${resolvedGroup.name}`}
      subtitle={`${memberRows.length} members`}
      actions={
        allowImports ? (
          <div className="flex flex-wrap items-center gap-2">
            <MemberImportWizard ikiminaId={id} saccoId={resolvedGroup.sacco_id} />
            <MemberPdfImportDialog ikiminaId={id} saccoId={resolvedGroup.sacco_id} />
          </div>
        ) : (
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-3">Read only</span>
        )
      }
    >
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
            <tr>
              <th className="px-4 py-3">Full name</th>
              <th className="px-4 py-3">Member code</th>
              <th className="px-4 py-3">MSISDN</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {memberRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-2">
                  No members found.
                </td>
              </tr>
            )}
            {memberRows.map((member) => (
              <tr key={member.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-neutral-0">{member.full_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-2">{member.member_code ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-2">{member.msisdn ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusChip tone={member.status === "ACTIVE" ? "success" : "warning"}>{member.status}</StatusChip>
                </td>
                <td className="px-4 py-3 text-neutral-2">
                  {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
