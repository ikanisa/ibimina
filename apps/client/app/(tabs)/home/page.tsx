/**
 * Home Page - Main Dashboard
 *
 * Displays member's group widgets, recent confirmations, and quick actions.
 * Data is sourced from Supabase with Row-Level Security applied per member.
 */

import Link from "next/link";
import { Users, CreditCard, FileText, Plus } from "lucide-react";

import { fmtCurrency } from "@/utils/format";
import { loadHomeDashboard } from "@/lib/data/home";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelativeTime(value: string | null): string {
  if (!value) return "—";
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "—";

  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_FORMATTER.format(-diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_FORMATTER.format(-diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) <= 14) {
    return RELATIVE_FORMATTER.format(-diffDays, "day");
  }

  return DATE_FORMATTER.format(timestamp);
}

export const metadata = {
  title: "Home | SACCO+ Client",
  description: "Your ibimina dashboard",
};

const CONFIRMED_STATUS = new Set(["posted", "reconciled"]);

export default async function HomePage() {
  const dashboard = await loadHomeDashboard();

  const recentConfirmations = dashboard.recentAllocations
    .filter((allocation) => CONFIRMED_STATUS.has(allocation.status))
    .slice(0, 4)
    .map((allocation) => ({
      id: allocation.id,
      groupName: allocation.groupName ?? "Unknown group",
      amount: allocation.amount,
      date: allocation.createdAt,
      status: allocation.status,
    }));

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="relative bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-4 py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-screen-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-white drop-shadow-sm">
            {dashboard.member?.fullName ? `Muraho, ${dashboard.member.fullName}!` : "Welcome back!"}
          </h1>
          <p className="text-base text-white/80 drop-shadow-sm">
            Manage your ibimina savings and recent payments
          </p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="sr-only">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/pay"
              className="group relative flex flex-col items-center justify-center min-h-[110px] p-5 bg-white border border-neutral-200 rounded-2xl hover:border-atlas-blue/30 hover:shadow-atlas hover:shadow-atlas-blue/10 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-atlas-glow to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-interactive" />
              <CreditCard className="relative w-7 h-7 text-atlas-blue mb-2.5 group-hover:scale-110 transition-transform duration-interactive" aria-hidden="true" />
              <span className="relative text-sm font-semibold text-neutral-900">Pay</span>
            </Link>
            <Link
              href="/groups"
              className="group relative flex flex-col items-center justify-center min-h-[110px] p-5 bg-white border border-neutral-200 rounded-2xl hover:border-emerald-500/30 hover:shadow-atlas hover:shadow-emerald-500/10 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-interactive" />
              <Users className="relative w-7 h-7 text-emerald-600 mb-2.5 group-hover:scale-110 transition-transform duration-interactive" aria-hidden="true" />
              <span className="relative text-sm font-semibold text-neutral-900">Groups</span>
            </Link>
            <Link
              href="/statements"
              className="group relative flex flex-col items-center justify-center min-h-[110px] p-5 bg-white border border-neutral-200 rounded-2xl hover:border-atlas-blue/30 hover:shadow-atlas hover:shadow-atlas-blue/10 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-atlas-glow to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-interactive" />
              <FileText className="relative w-7 h-7 text-atlas-blue mb-2.5 group-hover:scale-110 transition-transform duration-interactive" aria-hidden="true" />
              <span className="relative text-sm font-semibold text-neutral-900">Statements</span>
            </Link>
            <Link
              href="/groups"
              className="group relative flex flex-col items-center justify-center min-h-[110px] p-5 bg-white border border-neutral-200 rounded-2xl hover:border-amber-500/30 hover:shadow-atlas hover:shadow-amber-500/10 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-interactive" />
              <Plus className="relative w-7 h-7 text-amber-600 mb-2.5 group-hover:scale-110 transition-transform duration-interactive" aria-hidden="true" />
              <span className="relative text-sm font-semibold text-neutral-900">Join Group</span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="my-groups-heading">
          <h2 id="my-groups-heading" className="text-xl font-bold text-neutral-900 mb-4">
            My Groups
          </h2>
          {dashboard.groups.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
              <p className="text-neutral-600 mb-4">You haven't joined any groups yet.</p>
              <Link
                href="/groups"
                className="inline-flex items-center gap-2 px-6 py-3 bg-atlas-blue hover:bg-atlas-blue-dark text-white font-semibold rounded-xl transition-all duration-interactive hover:shadow-atlas hover:shadow-atlas-blue/20"
              >
                <Users className="w-5 h-5" />
                <span>Browse Groups</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dashboard.groups.map((group) => (
                <Link
                  key={group.groupId}
                  href={`/groups/${group.groupId}`}
                  className="group bg-white border border-neutral-200 rounded-2xl p-6 hover:border-atlas-blue/30 hover:shadow-atlas hover:shadow-atlas-blue/10 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2 hover:-translate-y-0.5"
                >
                  <h3 className="text-lg font-bold text-neutral-900 mb-4 group-hover:text-atlas-blue transition-colors">
                    {group.groupName}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 font-medium">Total savings</span>
                      <span className="text-xl font-bold text-atlas-blue">
                        {fmtCurrency(group.totalConfirmed)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-3 border-t border-neutral-100">
                      <span className="text-neutral-600">Pending</span>
                      <span className="font-semibold text-neutral-900">{group.pendingCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Last contribution</span>
                      <span className="font-semibold text-neutral-900">
                        {formatRelativeTime(group.lastContributionAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Default amount</span>
                      <span className="font-semibold text-neutral-900">
                        {group.contribution.amount
                          ? fmtCurrency(group.contribution.amount)
                          : "Set in group"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="recent-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-xl font-bold text-neutral-900">
              Recent confirmations
            </h2>
            <Link href="/statements" className="text-sm font-semibold text-atlas-blue hover:text-atlas-blue-dark">
              View all
            </Link>
          </div>

          {recentConfirmations.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center text-neutral-600">
              No confirmed payments yet. Dial *182# to make your first contribution.
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-2xl divide-y divide-neutral-100">
              {recentConfirmations.map((confirmation) => (
                <div key={confirmation.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{confirmation.groupName}</p>
                    <p className="text-xs text-neutral-500">
                      {DATE_FORMATTER.format(new Date(confirmation.date))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {fmtCurrency(confirmation.amount)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="insights-heading" className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total confirmed</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">
              {fmtCurrency(dashboard.totals.confirmedAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Pending payments</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{dashboard.totals.pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Active groups</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{dashboard.groups.length}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
