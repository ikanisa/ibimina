import { notFound } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatementImportWizard } from "@/components/ikimina/statement-import-wizard";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IkiminaDepositsTable } from "@/components/ikimina/ikimina-deposits-table";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DepositsPage({ params }: PageProps) {
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

  if (profile.role !== "SYSTEM_ADMIN" && profile.sacco_id && profile.sacco_id !== group.sacco_id) {
    notFound();
  }

  const { data: deposits, error: depositsError } = await supabase
    .from("payments")
    .select("id, amount, currency, status, occurred_at, reference, msisdn")
    .eq("ikimina_id", id)
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (depositsError) {
    throw depositsError;
  }

  return (
    <GlassCard
      title={`Deposits · ${group.name}`}
      subtitle={`${deposits?.length ?? 0} recent payments`}
      actions={<StatementImportWizard saccoId={group.sacco_id} ikiminaId={group.id} />}
    >
      <IkiminaDepositsTable data={(deposits ?? []).map((row) => ({
        id: row.id,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        occurred_at: row.occurred_at,
        reference: row.reference,
        msisdn: row.msisdn,
      }))} />
    </GlassCard>
  );
}
