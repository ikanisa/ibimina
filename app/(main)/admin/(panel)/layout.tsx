import { redirect } from "next/navigation";
import { Building2, Flag, LayoutDashboard, Megaphone, ScrollText, Settings2, UsersRound, UserSquare2, Inbox, Wallet, Scan, BarChartBig, SlidersHorizontal } from "lucide-react";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingRelationError } from "@/lib/supabase/errors";
import { AdminPanelShell } from "@/components/admin/panel/panel-shell";
import type { PanelNavItem, TenantOption } from "@/components/admin/panel/types";

const NAV_ITEMS: PanelNavItem[] = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/saccos", label: "SACCOs", icon: Building2 },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/members", label: "Members", icon: UserSquare2 },
  { href: "/admin/approvals", label: "Approvals & Invites", icon: Inbox },
  { href: "/admin/reconciliation", label: "Deposits & Reconciliation", icon: Wallet },
  { href: "/admin/payments", label: "Payments & Settlement", icon: SlidersHorizontal },
  { href: "/admin/ocr", label: "OCR Review", icon: Scan },
  { href: "/admin/notifications", label: "Notifications & Comms", icon: Megaphone },
  { href: "/admin/reports", label: "Reports & Exports", icon: BarChartBig },
  { href: "/admin/settings", label: "Settings & Policies", icon: Settings2 },
  { href: "/admin/audit", label: "Audit & Logs", icon: ScrollText },
  { href: "/admin/feature-flags", label: "Feature Flags & Experiments", icon: Flag },
];

async function getTenantOptions(profile: Awaited<ReturnType<typeof requireUserAndProfile>>["profile"]) {
  const supabase = await createSupabaseServerClient();

  if (profile.role === "SYSTEM_ADMIN") {
    const { data, error } = await supabase
      .schema("app")
      .from("saccos")
      .select("id, name, status")
      .order("name", { ascending: true });

    if (error && !isMissingRelationError(error)) {
      throw error;
    }

    const rows = (data ?? []).map((row) => ({ id: row.id as string, name: row.name ?? "Unnamed SACCO", status: row.status as string | null }));
    const options: TenantOption[] = [
      { id: "", name: "All SACCOs" },
      ...rows.map((row) => ({
        id: row.id,
        name: row.name,
        badge: row.status !== "ACTIVE" ? row.status : null,
      })),
    ];
    return options;
  }

  if (profile.sacco_id && profile.saccos?.name) {
    return [
      {
        id: profile.sacco_id,
        name: profile.saccos.name,
        badge: profile.saccos.category,
      },
    ];
  }

  return [
    {
      id: "",
      name: "All SACCOs",
    },
  ];
}

async function getAlertSummary(profile: Awaited<ReturnType<typeof requireUserAndProfile>>["profile"]) {
  const supabase = await createSupabaseServerClient();
  const scope = profile.role === "SYSTEM_ADMIN" ? null : profile.sacco_id ?? null;

  let joinQuery = supabase
    .schema("app")
    .from("join_requests")
    .select("id", { head: true, count: "exact" })
    .eq("status", "pending");
  if (scope) {
    joinQuery = joinQuery.eq("sacco_id", scope);
  }

  const inviteQuery = supabase
    .schema("app")
    .from("group_invites")
    .select("id, group:ikimina(sacco_id)")
    .eq("status", "sent");

  let paymentsQuery = supabase
    .schema("app")
    .from("payments")
    .select("id", { head: true, count: "exact" })
    .in("status", ["UNALLOCATED", "PENDING"]);
  if (scope) {
    paymentsQuery = paymentsQuery.eq("sacco_id", scope);
  }

  const [join, invites, payments] = await Promise.all([joinQuery, inviteQuery, paymentsQuery]);

  const safeCount = (result: typeof join) => {
    if (result.error) {
      if (isMissingRelationError(result.error)) {
        return 0;
      }
      throw result.error;
    }
    return result.count ?? 0;
  };

  type InviteRow = { group: { sacco_id: string | null } | null };
  const inviteRows = Array.isArray(invites.data) ? (invites.data as InviteRow[]) : [];
  const scopedInvites = scope ? inviteRows.filter((row) => row.group?.sacco_id === scope) : inviteRows;

  const pendingJoins = safeCount(join);
  const pendingInvites = scopedInvites.length;
  const pendingPayments = safeCount(payments);

  return {
    approvals: pendingJoins + pendingInvites,
    reconciliation: pendingPayments,
    total: pendingPayments + pendingJoins + pendingInvites,
  };
}

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireUserAndProfile();
  if (!auth.profile) {
    redirect("/login");
  }

  const [tenantOptions, alertSummary] = await Promise.all([
    getTenantOptions(auth.profile),
    getAlertSummary(auth.profile),
  ]);

  const navItems = NAV_ITEMS.map((item) => {
    if (item.href === "/admin/approvals" && alertSummary.approvals > 0) {
      return {
        ...item,
        badge: { label: String(alertSummary.approvals), tone: "warning" as const },
      } satisfies PanelNavItem;
    }
    if (item.href === "/admin/reconciliation" && alertSummary.reconciliation > 0) {
      return {
        ...item,
        badge: { label: String(alertSummary.reconciliation), tone: "critical" as const },
      } satisfies PanelNavItem;
    }
    return item;
  });

  return (
    <AdminPanelShell profile={auth.profile} navItems={navItems} tenantOptions={tenantOptions} alertsCount={alertSummary.total}>
      {children}
    </AdminPanelShell>
  );
}
