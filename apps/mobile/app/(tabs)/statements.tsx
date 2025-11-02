/**
 * Statements screen - View transaction history and account statements
 */

import { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { colors, elevation } from "../../src/theme";
import {
  useAllocations,
  useReferenceTokens,
  useMarkAllocationPaid,
} from "../../src/features/allocations/hooks/useAllocations";
import { StatementsTable } from "../../src/features/allocations/components/StatementsTable";

export default function StatementsScreen() {
  const intl = useIntl();
  const { data: referenceTokens } = useReferenceTokens();
  const referenceTokenValues = useMemo(
    () => referenceTokens?.map((token) => token.token).filter(Boolean) ?? [],
    [referenceTokens]
  );

  const allocationsQuery = useAllocations(referenceTokenValues);
  const markPaid = useMarkAllocationPaid();
  const allocations = allocationsQuery.data ?? [];

  const monthlyTotals = useMemo(() => {
    if (!allocations.length) {
      return [];
    }

    const aggregates = new Map<
      string,
      { id: string; month: string; total: number; currency: string; count: number }
    >();

    for (const allocation of allocations) {
      const createdAt = new Date(allocation.createdAt);
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const monthLabel = createdAt.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });

      const entry = aggregates.get(key) ?? {
        id: key,
        month: monthLabel,
        total: 0,
        currency: allocation.currency,
        count: 0,
      };

      entry.total += allocation.amount;
      entry.count += 1;
      entry.currency = allocation.currency;
      aggregates.set(key, entry);
    }

    return Array.from(aggregates.values()).sort((a, b) => (a.id > b.id ? -1 : 1));
  }, [allocations]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.statements", defaultMessage: "Statements" })}
          subtitle={intl.formatMessage({
            id: "statements.subtitle",
            defaultMessage: "View your transaction history",
          })}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Monthly Statements */}
          <Text style={styles.sectionTitle}>Monthly Statements</Text>

          {allocationsQuery.isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : monthlyTotals.length ? (
            monthlyTotals.map((statement) => (
              <View key={statement.id} style={styles.statementCard}>
                <View style={styles.statementHeader}>
                  <Text style={styles.statementMonth}>{statement.month}</Text>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Total Contributions</Text>
                    <Text style={styles.balanceAmount}>
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: statement.currency,
                        maximumFractionDigits: 0,
                      }).format(statement.total)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.statementMeta}>
                  {intl.formatMessage(
                    {
                      id: "statements.monthly.count",
                      defaultMessage: "{count, plural, one {# allocation} other {# allocations}} processed",
                    },
                    { count: statement.count }
                  )}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.loadingText}>
              {intl.formatMessage({ id: "statements.empty", defaultMessage: "No statements yet" })}
            </Text>
          )}

          {/* Recent Transactions */}
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Recent Transactions</Text>

          {allocationsQuery.isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <StatementsTable
              allocations={allocations.slice(0, 25)}
              onMarkPaid={(allocation) => markPaid.mutate({ allocationId: allocation.id })}
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  statementCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    ...elevation[2],
  },
  statementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statementMonth: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[100],
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[100],
    marginTop: 2,
  },
  statementMeta: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    marginVertical: 20,
  },
});
