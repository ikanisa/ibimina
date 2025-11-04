import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppStore } from "../../store";
import { accountService, groupService, loanService } from "../../services/supabase";
import {
  Card,
  PullToRefresh,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Toast,
  AnimatedNumber,
} from "../../components/ui";
import { colors, spacing, typography, borderRadius } from "../../theme";
import { haptics } from "../../utils/haptics";
import { formatCurrency } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";
import { fadeIn } from "../../utils/animations";

export function HomeScreen({ navigation }: any) {
  const { user, setAccounts, setGroups } = useAppStore();
  const { toast, hideToast, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBalance: 0,
    activeGroups: 0,
    activeLoans: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [accounts, groups, loans] = await Promise.all([
        accountService.getAccounts(user.id),
        groupService.getUserGroups(user.id),
        loanService.getUserLoans(user.id),
      ]);

      setAccounts(accounts);
      setGroups(groups.map((gm: any) => gm.group));

      const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
      const activeLoans = loans.filter((l: any) => l.status === "active").length;

      setStats({
        totalBalance,
        activeGroups: groups.length,
        activeLoans,
      });

      // Animate in
      fadeIn(fadeAnim).start();

      if (isRefresh) {
        haptics.success();
      }
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load data");
      showError("Failed to load dashboard data");
      haptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleRetry = () => {
    setError(null);
    loadData();
  };

  const quickActions = [
    {
      icon: "add-circle",
      label: "Deposit",
      screen: "Deposit",
      color: colors.success,
    },
    {
      icon: "remove-circle",
      label: "Withdraw",
      screen: "Withdraw",
      color: colors.warning,
    },
    {
      icon: "swap-horizontal",
      label: "Transfer",
      screen: "Transfer",
      color: colors.info,
    },
    {
      icon: "document-text",
      label: "Apply Loan",
      screen: "LoanApplication",
      color: colors.primary,
    },
  ];

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  const handleActionPress = (screen: string) => {
    haptics.impact("light");
    navigation.navigate(screen);
  };

  // Loading skeleton
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.userName}>{user?.full_name || "Member"}</Text>
          </View>
        </View>
        <CardSkeleton />
        <View style={styles.quickActions}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.actionButtonSkeleton} />
          ))}
        </View>
        <CardSkeleton />
        <CardSkeleton />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !stats.totalBalance) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message={error} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Toast {...toast} onDismiss={hideToast} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<PullToRefresh refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.userName}>{user?.full_name || "Member"}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              haptics.impact("light");
              navigation.navigate("Notifications");
            }}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={28} color={colors.gray900} />
            {/* Badge for unread notifications */}
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <AnimatedNumber value={stats.totalBalance} prefix="RWF " style={styles.balanceAmount} />
            <View style={styles.balanceFooter}>
              <View style={styles.balanceStat}>
                <Ionicons name="people" size={16} color={colors.gray600} />
                <Text style={styles.balanceStatText}>
                  {stats.activeGroups} {stats.activeGroups === 1 ? "Group" : "Groups"}
                </Text>
              </View>
              {stats.activeLoans > 0 && (
                <View style={styles.balanceStat}>
                  <Ionicons name="document-text" size={16} color={colors.gray600} />
                  <Text style={styles.balanceStatText}>
                    {stats.activeLoans} Active {stats.activeLoans === 1 ? "Loan" : "Loans"}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActions, { opacity: fadeAnim }]}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => handleActionPress(action.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Ionicons name="wallet" size={32} color={colors.primary} />
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalBalance, "RWF", false)}
              </Text>
              <Text style={styles.statLabel}>Savings</Text>
            </Card>

            <Card style={styles.statCard}>
              <Ionicons name="people" size={32} color={colors.success} />
              <Text style={styles.statValue}>{stats.activeGroups}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </Card>
          </View>

          {stats.activeLoans > 0 && (
            <Card style={styles.loanCard}>
              <View style={styles.loanHeader}>
                <Ionicons name="document-text" size={24} color={colors.warning} />
                <Text style={styles.loanTitle}>Active Loans</Text>
              </View>
              <Text style={styles.loanCount}>{stats.activeLoans}</Text>
              <TouchableOpacity
                style={styles.loanButton}
                onPress={() => {
                  haptics.impact("light");
                  navigation.navigate("Loans");
                }}
              >
                <Text style={styles.loanButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  userName: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.gray900,
    marginTop: spacing.xs,
  },
  notificationButton: {
    position: "relative",
    padding: spacing.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  balanceCard: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  balanceLabel: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.lg,
  },
  balanceFooter: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  balanceStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  balanceStatText: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.bodySmall,
    color: colors.gray700,
    textAlign: "center",
  },
  actionButtonSkeleton: {
    flex: 1,
    height: 80,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  statValue: {
    fontSize: typography.h3,
    fontWeight: "700",
    color: colors.gray900,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
  },
  loanCard: {
    padding: spacing.lg,
  },
  loanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loanTitle: {
    fontSize: typography.h4,
    fontWeight: "600",
    color: colors.gray900,
  },
  loanCount: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  loanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  loanButtonText: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
});
