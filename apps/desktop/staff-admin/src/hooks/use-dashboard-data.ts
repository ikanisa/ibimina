// Stub hook - returns mock dashboard data

export function useDashboardData() {
  return {
    stats: {
      totalMembers: 1234,
      totalSavings: 45200000,
      activeLoans: 89,
      transactionsToday: 156,
    },
    recentActivity: [],
    loading: false,
    error: null,
  };
}
