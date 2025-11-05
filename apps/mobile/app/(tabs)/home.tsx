/**
 * Home screen - Dashboard with groups and statements overview
 */

import { useMemo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { useRouter } from "expo-router";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { FloatingAskToJoinFab } from "../../src/components/shared/FloatingAskToJoinFab";
import { LiquidCardSkeleton } from "../../src/components/skeletons/LiquidCardSkeleton";
import { colors, elevation } from "../../src/theme";
import { useGroups } from "../../src/features/groups/hooks/useGroups";
import {
  useAllocations,
  useReferenceTokens,
} from "../../src/features/allocations/hooks/useAllocations";
import { useAppStore } from "../../src/providers/store";

export default function HomeScreen() {
  const intl = useIntl();
  const router = useRouter();
  const featureFlags = useAppStore((state) => state.featureFlags);

  const groupsQuery = useGroups({ limit: 10 });
  const groups = useMemo(() => groupsQuery.data?.pages.flat() ?? [], [groupsQuery.data]);

  const { data: referenceTokens } = useReferenceTokens();
  const referenceTokenValues = useMemo(
    () => referenceTokens?.map((token) => token.token).filter(Boolean) ?? [],
    [referenceTokens]
  );

  const allocationsQuery = useAllocations(referenceTokenValues);
  const allocations = allocationsQuery.data ?? [];

  const statementSummaries = useMemo(() => {
    if (!allocations.length) {
      return [];
    }

    const aggregates = new Map<
      string,
      { monthLabel: string; groupName: string; closingBalance: number; currency: string }
    >();

    for (const allocation of allocations) {
      const createdAt = new Date(allocation.createdAt);
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const monthLabel = createdAt.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });

      const existing = aggregates.get(key) ?? {
        monthLabel,
        groupName:
          allocation.groupName ??
          intl.formatMessage({
            id: "home.group.unnamed",
            defaultMessage: "Unassigned",
          }),
        closingBalance: 0,
        currency: allocation.currency,
      };

      existing.closingBalance += allocation.amount;
      existing.groupName = allocation.groupName ?? existing.groupName;
      existing.currency = allocation.currency;

      aggregates.set(key, existing);
    }

    return Array.from(aggregates.entries())
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .slice(0, 3)
      .map(([key, value]) => ({
        id: key,
        month: value.monthLabel,
        groupName: value.groupName,
        closingBalance: value.closingBalance,
        currency: value.currency,
      }));
  }, [allocations, intl]);

  const handleJoinGroup = useCallback(() => {
    router.push("/assist");
  }, [router]);

  const showAskToJoin = featureFlags["group_join_requests"] !== false;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "home.greeting", defaultMessage: "Hello" })}
          subtitle={intl.formatMessage({
            id: "home.subtitle",
            defaultMessage: "Track your savings in real time",
          })}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Groups Section */}
          <Text style={styles.sectionTitle}>
            {intl.formatMessage({ id: "home.groups", defaultMessage: "Your groups" })}
          </Text>

          {groupsQuery.isLoading ? (
            <>
              <LiquidCardSkeleton />
              <LiquidCardSkeleton />
              <LiquidCardSkeleton />
            </>
          ) : groups.length ? (
            groups.map((group) => (
              <View key={group.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{group.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  {`${new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: group.contributionCurrency ?? "RWF",
                    maximumFractionDigits: 0,
                  }).format(group.contributionAmount ?? 0)} ${intl.formatMessage({
                    id: "home.group.contributionLabel",
                    defaultMessage: "contribution",
                  })} • ${intl.formatNumber(group.memberCount)} ${intl.formatMessage({
                    id: "home.group.members",
                    defaultMessage: "members",
                  })}`}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardInfo}>
                    {intl.formatMessage(
                      {
                        id: "home.group.nextCollection",
                        defaultMessage: "Next collection: {date}",
                      },
                      {
                        date: group.nextCollectionDate
                          ? new Date(group.nextCollectionDate).toLocaleDateString()
                          : intl.formatMessage({
                              id: "home.group.notScheduled",
                              defaultMessage: "Not scheduled",
                            }),
                      }
                    )}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.loadingText}>
              {intl.formatMessage({
                id: "home.groups.empty",
                defaultMessage: "No groups available yet",
              })}
            </Text>
          )}

          {/* Statements Section */}
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            {intl.formatMessage({ id: "home.statements", defaultMessage: "Recent statements" })}
          </Text>

          {allocationsQuery.isLoading ? (
            <>
              <LiquidCardSkeleton />
              <LiquidCardSkeleton />
            </>
          ) : statementSummaries.length ? (
            statementSummaries.map((statement) => (
              <View key={statement.id} style={styles.statementCard}>
                <View style={styles.statementHeader}>
                  <Text style={styles.statementMonth}>{statement.month}</Text>
                  <Text style={styles.statementGroup}>{statement.groupName}</Text>
                </View>
                <View style={styles.statementRow}>
                  <Text style={styles.statementLabel}>Closing Balance</Text>
                  <Text style={styles.statementValue}>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: statement.currency,
                      maximumFractionDigits: 0,
                    }).format(statement.closingBalance)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.loadingText}>
              {intl.formatMessage({
                id: "home.statements.empty",
                defaultMessage: "No reconciled allocations yet",
              })}
            </Text>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {showAskToJoin ? (
          <FloatingAskToJoinFab onPress={handleJoinGroup} label="Ask to Join" />
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[100],
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    marginTop: 32,
  },
  card: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    ...elevation[2],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[50],
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.neutral[300],
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  badge: {
    backgroundColor: colors.rw.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statementCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  statementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statementMonth: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[100],
  },
  statementGroup: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  statementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statementLabel: {
    fontSize: 14,
    color: colors.neutral[300],
  },
  statementValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warm[500],
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    marginVertical: 20,
  },
});
