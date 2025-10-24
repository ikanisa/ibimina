import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { StatementImportWizard } from "@/components/ikimina/statement-import-wizard";
import { ReconciliationTable, type ReconciliationRow } from "@/components/recon/reconciliation-table";
import { SmsInboxPanel } from "@/components/recon/sms-inbox-panel";
import { Trans } from "@/components/common/trans";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeTenantSearchParams,
  resolveTenantScope,
  type TenantScopeSearchParams,
} from "@/lib/admin/scope";
import { canImportStatements, canReconcilePayments, isSystemAdmin } from "@/lib/permissions";
import type { Database } from "@/lib/supabase/types";

const EXCEPTION_STATUSES = ["UNALLOCATED", "PENDING", "REJECTED"] as const;

const parseSmsJson = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch (error) {
      console.warn("Unable to parse SMS JSON string", error);
    }
  }
  return null;
};

interface ReconciliationPageProps {
  searchParams?: TenantScopeSearchParams | Promise<TenantScopeSearchParams>;
}

export default async function AdminReconciliationPage({ searchParams }: ReconciliationPageProps) {
  const { profile } = await requireUserAndProfile();
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const resolvedSearchParams = normalizeTenantSearchParams(rawSearchParams);
  const scope = resolveTenantScope(profile, resolvedSearchParams);
  const supabase = await createSupabaseServerClient();

  type PaymentRow = Database["app"]["Tables"]["payments"]["Row"] & {
    source: {
      raw_text: string | null;
      parsed_json: Database["app"]["Tables"]["sms_inbox"]["Row"]["parsed_json"];
      msisdn: string | null;
      received_at: string | null;
    } | null;
  };

  let paymentsQuery = supabase
    .schema("app")
    .from("payments")
    .select("id, sacco_id, ikimina_id, member_id, msisdn, reference, amount, occurred_at, status, source:sms_inbox(raw_text, parsed_json, msisdn, received_at)")
    .in("status", EXCEPTION_STATUSES)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (!scope.includeAll && scope.saccoId) {
    paymentsQuery = paymentsQuery.eq("sacco_id", scope.saccoId);
  }

  const { data: payments, error: paymentsError } = await paymentsQuery.returns<PaymentRow[]>();

  if (paymentsError) {
    throw paymentsError;
  }

  const exceptionRows: ReconciliationRow[] = ((payments ?? []) as PaymentRow[]).map((row) => ({
    ...row,
    source: row.source
      ? {
          raw_text: row.source.raw_text ?? "",
          parsed_json: row.source.parsed_json,
          msisdn: row.source.msisdn,
          received_at: row.source.received_at ?? "",
        }
      : null,
  }));

  let smsQuery = supabase
    .schema("app")
    .from("sms_inbox")
    .select("id, raw_text, parsed_json, msisdn, received_at, status, confidence, error, sacco_id")
    .order("received_at", { ascending: false })
    .limit(60);

  if (!scope.includeAll && scope.saccoId) {
    smsQuery = smsQuery.eq("sacco_id", scope.saccoId);
  }

  const { data: smsEntries, error: smsError } = await smsQuery;

  if (smsError) {
    throw smsError;
  }

  const smsPanelItems = (smsEntries ?? []).map((item) => ({
    id: item.id,
    raw_text: item.raw_text,
    parsed_json: parseSmsJson(item.parsed_json),
    msisdn: item.msisdn,
    received_at: item.received_at,
    status: item.status ?? "UNPARSED",
    confidence: item.confidence,
    error: item.error ?? null,
  }));

  const saccoIdForWrites = scope.includeAll ? profile.sacco_id : scope.saccoId;
  const allowStatementImport = saccoIdForWrites ? canImportStatements(profile, saccoIdForWrites) : isSystemAdmin(profile);
  const allowReconciliationUpdates = saccoIdForWrites ? canReconcilePayments(profile, saccoIdForWrites) : isSystemAdmin(profile);

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<Trans i18nKey="admin.reconciliation.title" fallback="Deposits & Reconciliation" />}
        subtitle={
          <Trans
            i18nKey="admin.reconciliation.subtitle"
            fallback="Manage statement ingestion, SMS parsing, and reconciliation exceptions."
            className="text-xs text-neutral-3"
          />
        }
        badge={<StatusChip tone="warning">{exceptionRows.length} pending</StatusChip>}
      />

      <GlassCard
        title={<Trans i18nKey="admin.reconciliation.momo" fallback="MoMo statement ingest" />}
        subtitle={<Trans i18nKey="admin.reconciliation.momoSubtitle" fallback="Validate and upload statements with strict idempotency." className="text-xs text-neutral-3" />}
        actions={
          saccoIdForWrites ? (
            <StatementImportWizard
              saccoId={saccoIdForWrites}
              variant="momo"
              canImport={allowStatementImport}
              disabledReason="Read-only access"
            />
          ) : undefined
        }
      >
        {saccoIdForWrites ? (
          <div className="space-y-2 text-sm text-neutral-2">
            <p className="text-xs text-neutral-3">
              <Trans i18nKey="admin.reconciliation.momoNote1" fallback="Drag-and-drop MTN CSV exports. Parser feedback surfaces duplicates and validation errors before ingest." />
            </p>
            <p className="text-xs text-neutral-3">
              <Trans i18nKey="admin.reconciliation.momoNote2" fallback="Only validated rows reach Supabase; invalid entries remain quarantined for follow-up." />
            </p>
          </div>
        ) : (
          <p className="text-xs text-neutral-3">
            <Trans i18nKey="admin.reconciliation.assignTenant" fallback="Select a SACCO to enable statement ingestion." />
          </p>
        )}
      </GlassCard>

      <GlassCard
        title={<Trans i18nKey="admin.reconciliation.sms" fallback="SMS inbox" />}
        subtitle={<Trans i18nKey="admin.reconciliation.smsSubtitle" fallback="Latest gateway messages awaiting parser review." className="text-xs text-neutral-3" />}
      >
        <SmsInboxPanel items={smsPanelItems} />
      </GlassCard>

      <GlassCard
        title={<Trans i18nKey="admin.reconciliation.exceptions" fallback="Exceptions" />}
        subtitle={<Trans i18nKey="admin.reconciliation.exceptionsSubtitle" fallback="Resolve unmatched deposits and reconcile ledgers." className="text-xs text-neutral-3" />}
      >
        <ReconciliationTable rows={exceptionRows} saccoId={saccoIdForWrites} canWrite={allowReconciliationUpdates} />
      </GlassCard>
    </div>
  );
}
