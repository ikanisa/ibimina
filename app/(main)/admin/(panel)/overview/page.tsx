import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { NotificationQueueTable } from "@/components/admin/notification-queue-table";
import { OperationalTelemetry } from "@/components/admin/operational-telemetry";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { FeatureFlagsCard } from "@/components/admin/feature-flags-card";
import { MfaInsightsCard } from "@/components/admin/mfa-insights-card";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingRelationError } from "@/lib/supabase/errors";
import { resolveTenantScope } from "@/lib/admin/scope";
import { Trans } from "@/components/common/trans";

interface OverviewPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

interface MetricSummary {
  saccos: number;
  groups: number;
  members: number;
  pendingApprovals: number;
  pendingInvites: number;
  reconciliationExceptions: number;
}

async function loadMetrics(scope: ReturnType<typeof resolveTenantScope>): Promise<MetricSummary> {
  const supabase = await createSupabaseServerClient();

  const saccoQuery = scope.includeAll
    ? supabase.schema("app").from("saccos").select("id", { head: true, count: "exact" })
    : supabase
        .schema("app")
        .from("saccos")
        .select("id", { head: true, count: "exact" })
        .eq("id", scope.saccoId ?? "");

  const groupsQuery = scope.includeAll
    ? supabase.schema("app").from("ikimina").select("id", { head: true, count: "exact" })
    : supabase
        .schema("app")
        .from("ikimina")
        .select("id", { head: true, count: "exact" })
        .eq("sacco_id", scope.saccoId ?? "");

  const membersQuery = scope.includeAll
    ? supabase.schema("app").from("members").select("id", { head: true, count: "exact" })
    : supabase
        .schema("app")
        .from("members")
        .select("id", { head: true, count: "exact" })
        .eq("sacco_id", scope.saccoId ?? "");

  const approvalsQuery = scope.includeAll
    ? supabase
        .from("join_requests")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending")
    : supabase
        .from("join_requests")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending")
        .eq("sacco_id", scope.saccoId ?? "");

  const invitesQuery = supabase
    .from("group_invites")
    .select("id, group:ikimina(sacco_id)")
    .eq("status", "sent")
    .limit(500);

  const exceptionQuery = scope.includeAll
    ? supabase
        .schema("app")
        .from("payments")
        .select("id", { head: true, count: "exact" })
        .in("status", ["UNALLOCATED", "PENDING", "REJECTED"])
    : supabase
        .schema("app")
        .from("payments")
        .select("id", { head: true, count: "exact" })
        .in("status", ["UNALLOCATED", "PENDING", "REJECTED"])
        .eq("sacco_id", scope.saccoId ?? "");

  const [saccos, groups, members, approvals, invitesRows, exceptions] = await Promise.all([
    saccoQuery,
    groupsQuery,
    membersQuery,
    approvalsQuery,
    invitesQuery,
    exceptionQuery,
  ]);

  if (invitesRows.error && !isMissingRelationError(invitesRows.error)) {
    throw invitesRows.error;
  }

  const inviteCount = Array.isArray(invitesRows.data)
    ? invitesRows.data.filter((row: { group: { sacco_id: string | null } | null }) =>
        scope.includeAll ? true : row.group?.sacco_id === scope.saccoId,
      ).length
    : 0;

  const safeCount = (result: { count: number | null; error: unknown }) => {
    const { count, error } = result;
    if (!error) return count ?? 0;
    if (isMissingRelationError(error as { code: string; message: string; details: string | null; hint: string | null })) return 0;
    throw error;
  };

  return {
    saccos: safeCount(saccos),
    groups: safeCount(groups),
    members: safeCount(members),
    pendingApprovals: safeCount(approvals),
    pendingInvites: inviteCount,
    reconciliationExceptions: safeCount(exceptions),
  };
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const { profile } = await requireUserAndProfile();
  const scope = resolveTenantScope(profile, searchParams);
  const supabase = await createSupabaseServerClient();

  const metricsPromise = loadMetrics(scope);

  let notificationQuery = supabase
    .from("notification_queue")
    .select("id, event, sacco_id, template_id, status, scheduled_for, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!scope.includeAll && scope.saccoId) {
    notificationQuery = notificationQuery.eq("sacco_id", scope.saccoId);
  }

  const telemetryQuery = supabase
    .from("system_metrics")
    .select("event, total, last_occurred, meta")
    .order("last_occurred", { ascending: false })
    .limit(20);

  let auditQuery = supabase
    .schema("app")
    .from("audit_logs")
    .select("id, action, entity, entity_id, diff, created_at, actor, sacco_id")
    .order("created_at", { ascending: false })
    .limit(30);
  if (!scope.includeAll && scope.saccoId) {
    auditQuery = auditQuery.eq("sacco_id", scope.saccoId);
  }

  const [notificationResponse, telemetryResponse, auditResponse] = await Promise.all([
    notificationQuery,
    telemetryQuery,
    auditQuery,
  ]);

  const metrics = await metricsPromise;

  if (notificationResponse.error && !isMissingRelationError(notificationResponse.error)) {
    throw notificationResponse.error;
  }
  if (telemetryResponse.error && !isMissingRelationError(telemetryResponse.error)) {
    throw telemetryResponse.error;
  }
  if (auditResponse.error && !isMissingRelationError(auditResponse.error)) {
    throw auditResponse.error;
  }

  type NotificationRow = {
    id: string;
    event: string;
    sacco_id: string | null;
    template_id: string | null;
    status: string | null;
    scheduled_for: string | null;
    created_at: string | null;
  };

  type TelemetryRow = {
    event: string;
    total: number | null;
    last_occurred: string | null;
    meta: Record<string, unknown> | null;
  };

  type AuditRow = {
    id: string;
    action: string;
    entity: string;
    entity_id: string | null;
    diff: Record<string, unknown> | null;
    created_at: string | null;
    actor: string | null;
  };

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<Trans i18nKey="admin.overview.title" fallback="Admin overview" />}
        subtitle={
          <Trans
            i18nKey="admin.overview.subtitle"
            fallback="Monitor core operations across SACCOs, groups, members, and financial reconciliation."
            className="text-xs text-neutral-3"
          />
        }
        badge={<StatusChip tone="info">{scope.includeAll ? "Global" : profile.saccos?.name ?? "Scoped"}</StatusChip>}
      />

      <GlassCard
        title={<Trans i18nKey="admin.overview.metrics.title" fallback="Key metrics" />}
        subtitle={<Trans i18nKey="admin.overview.metrics.subtitle" fallback="Latest counts for your current tenant scope." className="text-xs text-neutral-3" />}
      >
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricTile label="SACCOs" value={metrics.saccos} tone="info" />
          <MetricTile label="Groups" value={metrics.groups} tone="info" />
          <MetricTile label="Members" value={metrics.members} tone="success" />
          <MetricTile label="Pending approvals" value={metrics.pendingApprovals} tone="warning" />
          <MetricTile label="Pending invites" value={metrics.pendingInvites} tone="warning" />
          <MetricTile label="Reconciliation exceptions" value={metrics.reconciliationExceptions} tone="critical" />
        </dl>
      </GlassCard>

      <div className="grid gap-8 xl:grid-cols-2">
        <GlassCard
          title={<Trans i18nKey="admin.overview.telemetry.title" fallback="Operational telemetry" />}
          subtitle={<Trans i18nKey="admin.overview.telemetry.subtitle" fallback="Recent platform events and signals." className="text-xs text-neutral-3" />}
        >
          <OperationalTelemetry rows={(telemetryResponse.data ?? []) as TelemetryRow[]} />
        </GlassCard>

        <GlassCard
          title={<Trans i18nKey="admin.overview.notifications.title" fallback="Notification queue" />}
          subtitle={<Trans i18nKey="admin.overview.notifications.subtitle" fallback="Scheduled and recent deliveries." className="text-xs text-neutral-3" />}
        >
          <NotificationQueueTable rows={(notificationResponse.data ?? []) as NotificationRow[]} saccoLookup={new Map()} templateLookup={new Map()} />
        </GlassCard>
      </div>

      <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
        <GlassCard
          title={<Trans i18nKey="admin.overview.audit.title" fallback="Audit timeline" />}
          subtitle={<Trans i18nKey="admin.overview.audit.subtitle" fallback="Latest platform actions" className="text-xs text-neutral-3" />}
        >
          <AuditLogTable rows={(auditResponse.data ?? []) as AuditRow[]} />
        </GlassCard>
        <div className="space-y-8">
          <MfaInsightsCard saccoId={scope.includeAll ? null : scope.saccoId} />
          <FeatureFlagsCard />
        </div>
      </div>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: number;
  tone: "info" | "success" | "warning" | "critical";
}

function MetricTile({ label, value, tone }: MetricTileProps) {
  const toneClasses: Record<MetricTileProps["tone"], string> = {
    info: "from-sky-500/20 via-sky-500/10 to-transparent text-sky-100",
    success: "from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-100",
    warning: "from-amber-500/20 via-amber-500/10 to-transparent text-amber-100",
    critical: "from-rose-500/20 via-rose-500/10 to-transparent text-rose-100",
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-3">{label}</p>
      <p className={`mt-3 text-4xl font-semibold ${toneClasses[tone]}`}>{value.toLocaleString()}</p>
    </div>
  );
}
