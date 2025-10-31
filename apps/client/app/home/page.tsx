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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-8">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-blue-100">Manage your ibimina savings</p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="sr-only">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/pay"
              className="flex flex-col items-center justify-center min-h-[100px] p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <CreditCard className="w-8 h-8 text-blue-600 mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-900">Pay</span>
            </Link>
            <Link
              href="/groups"
              className="flex flex-col items-center justify-center min-h-[100px] p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Users className="w-8 h-8 text-green-600 mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-900">Groups</span>
            </Link>
            <Link
              href="/statements"
              className="flex flex-col items-center justify-center min-h-[100px] p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FileText className="w-8 h-8 text-purple-600 mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-900">Statements</span>
            </Link>
            <Link
              href="/groups"
              className="flex flex-col items-center justify-center min-h-[100px] p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-8 h-8 text-orange-600 mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-900">Join Group</span>
            </Link>
          </div>
        </section>

        {/* My Groups */}
        <section aria-labelledby="my-groups-heading">
          <h2 id="my-groups-heading" className="text-xl font-bold text-gray-900 mb-4">
            My Groups
          </h2>
          {groups.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">You haven&apos;t joined any groups yet.</p>
              <Link
                href="/groups"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
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
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Savings</span>
                      <span className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat("rw-RW", {
                          style: "currency",
                          currency: "RWF",
                          minimumFractionDigits: 0,
                        }).format(group.totalSavings)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Members</span>
                      <span className="font-medium text-gray-900">{group.memberCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Last Contribution</span>
                      <span className="font-medium text-gray-900">
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

        {/* Recent Confirmations */}
        <section aria-labelledby="recent-confirmations-heading">
          <h2 id="recent-confirmations-heading" className="text-xl font-bold text-gray-900 mb-4">
            Recent Confirmations
          </h2>
          {recentConfirmations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600">No recent confirmations.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {recentConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{confirmation.groupName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(confirmation.date))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat("rw-RW", {
                            style: "currency",
                            currency: "RWF",
                            minimumFractionDigits: 0,
                          }).format(confirmation.amount)}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 mt-1">
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
