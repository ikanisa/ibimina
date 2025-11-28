/**
 * Dashboard home page
 */

import { useAuth } from "@/lib/auth-context";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuth();

  const stats = [
    {
      name: "Total Members",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      name: "Total Savings",
      value: "RWF 45.2M",
      change: "+8%",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      name: "Active Loans",
      value: "89",
      change: "+5%",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      name: "Transactions Today",
      value: "156",
      change: "+23%",
      icon: Activity,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile?.full_name || "Admin"}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your SACCO today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  {stat.change} from last month
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      New member registration
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Member #{1000 + i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 text-left transition-colors">
          <Users className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">Add New Member</h3>
          <p className="text-sm text-blue-100 mt-1">Register a new SACCO member</p>
        </button>

        <button className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 text-left transition-colors">
          <DollarSign className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">Process Transaction</h3>
          <p className="text-sm text-green-100 mt-1">Record a deposit or withdrawal</p>
        </button>

        <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-6 text-left transition-colors">
          <TrendingUp className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">Generate Report</h3>
          <p className="text-sm text-purple-100 mt-1">Create financial reports</p>
        </button>
      </div>
    </div>
  );
}
