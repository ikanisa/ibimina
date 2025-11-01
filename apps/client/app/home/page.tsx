/**
 * Home Page - Main Dashboard
 *
 * Displays member's group widgets, recent confirmations, and quick actions.
 *
 * Features:
 * - My groups widgets with totals
 * - Recent payment confirmations
 * - Quick action buttons
 * - Welcome message
 * - Responsive layout
 */

import Link from "next/link";
import { Users, CreditCard, FileText, Plus } from "lucide-react";

export const metadata = {
  title: "Home | SACCO+ Client",
  description: "Your ibimina dashboard",
};

// Mock data - replace with actual data fetching
async function getMyGroups() {
  // TODO: Fetch user's groups from Supabase
  return [
    {
      id: "1",
      name: "Kigali Business Group",
      totalSavings: 250000,
      memberCount: 12,
      lastContribution: "2025-10-25",
    },
    {
      id: "2",
      name: "Farmers Cooperative",
      totalSavings: 180000,
      memberCount: 8,
      lastContribution: "2025-10-20",
    },
  ];
}

async function getRecentConfirmations() {
  // TODO: Fetch recent payment confirmations
  return [
    {
      id: "1",
      groupName: "Kigali Business Group",
      amount: 20000,
      date: "2025-10-25",
      status: "CONFIRMED",
    },
    {
      id: "2",
      groupName: "Farmers Cooperative",
      amount: 15000,
      date: "2025-10-20",
      status: "CONFIRMED",
    },
  ];
}

export default async function HomePage() {
  const groups = await getMyGroups();
  const recentConfirmations = await getRecentConfirmations();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header - Atlas inspired gradient with proper text visibility */}
      <header className="relative bg-gradient-to-br from-atlas-blue via-atlas-blue-light to-atlas-blue-dark px-4 py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-screen-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-white drop-shadow-sm">Welcome Back!</h1>
          <p className="text-base text-white drop-shadow-sm">Manage your ibimina savings</p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions - Atlas redesigned cards */}
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

        {/* My Groups - Atlas redesigned */}
        <section aria-labelledby="my-groups-heading">
          <h2 id="my-groups-heading" className="text-xl font-bold text-neutral-900 mb-4">
            My Groups
          </h2>
          {groups.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
              <p className="text-neutral-600 mb-4">You haven&apos;t joined any groups yet.</p>
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
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="group bg-white border border-neutral-200 rounded-2xl p-6 hover:border-atlas-blue/30 hover:shadow-atlas hover:shadow-atlas-blue/10 transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2 hover:-translate-y-0.5"
                >
                  <h3 className="text-lg font-bold text-neutral-900 mb-4 group-hover:text-atlas-blue transition-colors">{group.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 font-medium">Total Savings</span>
                      <span className="text-xl font-bold text-atlas-blue">
                        {new Intl.NumberFormat("rw-RW", {
                          style: "currency",
                          currency: "RWF",
                          minimumFractionDigits: 0,
                        }).format(group.totalSavings)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-3 border-t border-neutral-100">
                      <span className="text-neutral-600">Members</span>
                      <span className="font-semibold text-neutral-900">{group.memberCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Last Contribution</span>
                      <span className="font-semibold text-neutral-900">
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(group.lastContribution))}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Confirmations - Atlas redesigned */}
        <section aria-labelledby="recent-confirmations-heading">
          <h2 id="recent-confirmations-heading" className="text-xl font-bold text-neutral-900 mb-4">
            Recent Confirmations
          </h2>
          {recentConfirmations.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center">
              <p className="text-neutral-600">No recent confirmations.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {recentConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="p-5 hover:bg-neutral-50 transition-colors duration-interactive">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">{confirmation.groupName}</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(confirmation.date))}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-emerald-600">
                          {new Intl.NumberFormat("rw-RW", {
                            style: "currency",
                            currency: "RWF",
                            minimumFractionDigits: 0,
                          }).format(confirmation.amount)}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1.5">
                          {confirmation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
