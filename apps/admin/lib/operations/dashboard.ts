import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const QUEUE_STATUSES = ["PENDING", "QUEUED"] as const;
const RECON_STATUSES = ["UNALLOCATED", "PENDING", "REJECTED"] as const;

const TREND_WINDOW_HOURS = 12;
const TREND_WINDOW_DAYS = 14;

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export interface OperationsSnapshot {
  notifications: {
    pending: number;
    stalled: number;
    nextScheduledFor: string | null;
  };
  reconciliation: {
    open: number;
    oldestOpen: string | null;
    escalated: number;
  };
  mfa: {
    enabled: number;
    stale: number;
    lastSuccessSample: string | null;
  };
  incidents: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    occurredAt: string | null;
    diff: Record<string, unknown> | null;
  }>;
  trends: {
    notifications: TrendPoint[];
    reconciliation: TrendPoint[];
    mfaSuccesses: TrendPoint[];
  };
}

export interface TrendPoint {
  label: string;
  value: number;
}

interface OperationsSnapshotParams {
  saccoId: string | null;
}

type NotificationRow = Pick<
  Database["public"]["Tables"]["notification_queue"]["Row"],
  "id" | "status" | "scheduled_for" | "created_at"
>;
type PaymentRow = Pick<
  Database["app"]["Tables"]["payments"]["Row"],
  "id" | "status" | "occurred_at" | "sacco_id"
>;
type AuditRow = Pick<
  Database["app"]["Tables"]["audit_logs"]["Row"],
  "id" | "action" | "entity" | "entity_id" | "created_at" | "diff"
>;
type AuditTimestampRow = Pick<Database["app"]["Tables"]["audit_logs"]["Row"], "created_at">;
type UserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "sacco_id" | "last_mfa_success_at"
>;

const INCIDENT_ACTIONS = [
  "MFA_FAILED",
  "MFA_RESET_BULK",
  "RECON_ESCALATED",
  "NOTIFICATION_PIPELINE_ERROR",
  "SMS_GATEWAY_FAILURE",
];

export async function getOperationsSnapshot({
  saccoId,
}: OperationsSnapshotParams): Promise<OperationsSnapshot> {
  const supabase = await createSupabaseServerClient();

  const notificationSince = new Date(Date.now() - TREND_WINDOW_HOURS * HOUR_IN_MS).toISOString();
  let notificationQuery = supabase
    .from("notification_queue")
    .select("id, status, scheduled_for, created_at", { count: "exact" })
    .in("status", QUEUE_STATUSES)
    .gte("created_at", notificationSince)
    .order("scheduled_for", { ascending: true })
    .limit(500);

  if (saccoId) {
    notificationQuery = notificationQuery.eq("sacco_id", saccoId);
  }

  const { data: notificationRows, count: notificationCount } =
    await notificationQuery.returns<NotificationRow[]>();
  const stalledThreshold = Date.now() - 30 * 60 * 1000;
  const notifications = notificationRows ?? [];
  const stalled = notifications.filter((row) => {
    if (!row.scheduled_for) return false;
    return new Date(row.scheduled_for).getTime() < stalledThreshold;
  }).length;
  const nextScheduled = notifications[0]?.scheduled_for ?? notifications[0]?.created_at ?? null;

  const reconSince = new Date(Date.now() - TREND_WINDOW_HOURS * HOUR_IN_MS).toISOString();
  let reconQuery = supabase
    .from("payments")
    .select("id, status, occurred_at, sacco_id", { count: "exact" })
    .in("status", RECON_STATUSES)
    .gte("occurred_at", reconSince)
    .order("occurred_at", { ascending: true })
    .limit(500);

  if (saccoId) {
    reconQuery = reconQuery.eq("sacco_id", saccoId);
  }

  const { data: reconRows, count: reconCount } = await reconQuery.returns<PaymentRow[]>();
  const reconEntries = reconRows ?? [];
  const oldestOpen = reconEntries[0]?.occurred_at ?? null;
  const escalated = reconEntries.filter((row) => row.status === "REJECTED").length;

  let mfaQuery = supabase
    .from("users")
    .select("id, sacco_id, last_mfa_success_at", { count: "exact" })
    .eq("mfa_enabled", true)
    .limit(500);

  if (saccoId) {
    mfaQuery = mfaQuery.eq("sacco_id", saccoId);
  }

  const { data: mfaRows, count: mfaCount } = await mfaQuery.returns<UserRow[]>();
  const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const stale = (mfaRows ?? []).filter((row) => {
    if (!row.last_mfa_success_at) return true;
    return new Date(row.last_mfa_success_at).getTime() < staleThreshold;
  }).length;
  const lastSample =
    (mfaRows ?? [])
      .map((row) => row.last_mfa_success_at)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  const incidentQuery = supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, created_at, diff")
    .in("action", INCIDENT_ACTIONS)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: incidentRows } = await incidentQuery.returns<AuditRow[]>();
  const incidents = (incidentRows ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entity: row.entity ?? "UNKNOWN",
    entityId: row.entity_id ?? "UNKNOWN",
    occurredAt: row.created_at ?? null,
    diff: (row.diff as Record<string, unknown> | null) ?? null,
  }));

  const mfaAuditSince = new Date(Date.now() - TREND_WINDOW_DAYS * DAY_IN_MS).toISOString();
  const { data: mfaAuditRows } = await supabase
    .from("audit_logs")
    .select("created_at")
    .eq("action", "MFA_SUCCESS")
    .gte("created_at", mfaAuditSince)
    .order("created_at", { ascending: true })
    .limit(720)
    .returns<AuditTimestampRow[]>();

  return {
    notifications: {
      pending: notificationCount ?? notifications.length,
      stalled,
      nextScheduledFor: nextScheduled,
    },
    reconciliation: {
      open: reconCount ?? reconEntries.length,
      oldestOpen,
      escalated,
    },
    mfa: {
      enabled: mfaCount ?? (mfaRows ?? []).length,
      stale,
      lastSuccessSample: lastSample,
    },
    incidents,
    trends: {
      notifications: buildHourlyTrend(
        notifications,
        (row) => row.scheduled_for ?? row.created_at ?? null
      ),
      reconciliation: buildHourlyTrend(reconEntries, (row) => row.occurred_at ?? null),
      mfaSuccesses: buildDailyTrend(mfaAuditRows ?? [], (row) => row.created_at ?? null),
    },
  };
}

function buildHourlyTrend<T>(
  rows: T[],
  getTimestamp: (row: T) => string | null,
  hours = TREND_WINDOW_HOURS
): TrendPoint[] {
  const now = Date.now();
  const buckets = Array.from({ length: hours }).map((_, index) => {
    const start = now - (hours - 1 - index) * HOUR_IN_MS;
    const end = start + HOUR_IN_MS;
    return { start, end };
  });

  const formatter = new Intl.DateTimeFormat("en-RW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return buckets.map(({ start, end }) => {
    const count = rows.reduce((accumulator, row) => {
      const timestamp = getTimestamp(row);
      if (!timestamp) {
        return accumulator;
      }

      const value = new Date(timestamp).getTime();
      if (Number.isNaN(value)) {
        return accumulator;
      }

      if (value >= start && value < end) {
        return accumulator + 1;
      }

      return accumulator;
    }, 0);

    return {
      label: formatter.format(new Date(start)),
      value: count,
    } satisfies TrendPoint;
  });
}

function buildDailyTrend<T>(
  rows: T[],
  getTimestamp: (row: T) => string | null,
  days = TREND_WINDOW_DAYS
): TrendPoint[] {
  const now = Date.now();
  const buckets = Array.from({ length: days }).map((_, index) => {
    const start = now - (days - 1 - index) * DAY_IN_MS;
    const end = start + DAY_IN_MS;
    return { start, end };
  });

  const formatter = new Intl.DateTimeFormat("en-RW", {
    month: "short",
    day: "numeric",
  });

  return buckets.map(({ start, end }) => {
    const count = rows.reduce((accumulator, row) => {
      const timestamp = getTimestamp(row);
      if (!timestamp) {
        return accumulator;
      }

      const value = new Date(timestamp).getTime();
      if (Number.isNaN(value)) {
        return accumulator;
      }

      if (value >= start && value < end) {
        return accumulator + 1;
      }

      return accumulator;
    }, 0);

    return {
      label: formatter.format(new Date(start)),
      value: count,
    } satisfies TrendPoint;
  });
}
