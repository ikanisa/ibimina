import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, shadow } from "@theme/tokens";
import { StatusChip } from "@components/StatusChip";

const STATEMENTS = [
  {
    id: "stmt-jan",
    period: "January 2025",
    total: 540000,
    contributions: 42,
    status: "Generated",
    statusTone: "success" as const,
    generatedOn: "02 Feb 2025",
  },
  {
    id: "stmt-dec",
    period: "December 2024",
    total: 498500,
    contributions: 39,
    status: "Pending sync",
    statusTone: "warning" as const,
    generatedOn: "08 Jan 2025",
  },
  {
    id: "stmt-nov",
    period: "November 2024",
    total: 512300,
    contributions: 40,
    status: "Archived",
    statusTone: "neutral" as const,
    generatedOn: "04 Dec 2024",
  },
];

export function StatementsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Statements</Text>
          <Text style={styles.subtitle}>
            Download monthly statements to reconcile your group contributions.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>January Snapshot</Text>
          <Text style={styles.summaryValue}>RWF 540,000</Text>
          <Text style={styles.summaryMeta}>42 contributions across 3 groups</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent statements</Text>
          <Text style={styles.sectionHint}>Auto-generated after each month end</Text>
        </View>

        {STATEMENTS.map((statement) => (
          <View key={statement.id} style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <View>
                <Text style={styles.statementTitle}>{statement.period}</Text>
                <Text style={styles.statementMeta}>Generated {statement.generatedOn}</Text>
              </View>
              <StatusChip label={statement.status} tone={statement.statusTone} />
            </View>

            <View style={styles.statementBody}>
              <View>
                <Text style={styles.bodyLabel}>Total contributions</Text>
                <Text style={styles.bodyValue}>RWF {statement.total.toLocaleString()}</Text>
              </View>
              <View>
                <Text style={styles.bodyLabel}>Transactions</Text>
                <Text style={styles.bodyValue}>{statement.contributions}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              accessibilityLabel={`Download ${statement.period} statement`}
            >
              <Text style={styles.downloadLabel}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.18)",
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  summaryTitle: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  summaryMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statementCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.card,
  },
  statementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statementTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statementMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  statementBody: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bodyLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
  },
  bodyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.xs / 2,
  },
  downloadButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  downloadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
