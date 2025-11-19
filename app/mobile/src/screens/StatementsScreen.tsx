import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { radius, spacing, shadow } from "@theme/tokens";
import { useNativeWindTheme } from "@theme/nativewind";
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
  const theme = useNativeWindTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.palette.background }]}
      className={theme.classes.background}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentContainerClassName="gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} className="gap-2">
          <Text style={styles.title} className={theme.classes.textPrimary}>
            Statements
          </Text>
          <Text style={styles.subtitle} className={theme.classes.textSecondary}>
            Download monthly statements to reconcile your group contributions.
          </Text>
        </View>

        <View
          style={[styles.summaryCard, { borderColor: theme.palette.primary }]}
          className={`${theme.classes.surfaceTinted} ${theme.classes.cardShadow}`}
        >
          <Text style={styles.summaryTitle} className={theme.classes.textMuted}>
            January Snapshot
          </Text>
          <Text style={styles.summaryValue} className={theme.classes.accent}>
            RWF 540,000
          </Text>
          <Text style={styles.summaryMeta} className={theme.classes.textSecondary}>
            42 contributions across 3 groups
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} className={theme.classes.textPrimary}>
            Recent statements
          </Text>
          <Text style={styles.sectionHint} className={theme.classes.textMuted}>
            Auto-generated after each month end
          </Text>
        </View>

        {STATEMENTS.map((statement) => (
          <View
            key={statement.id}
            style={[styles.statementCard, { borderColor: theme.palette.border }]}
            className={`${theme.classes.surface} ${theme.classes.border} ${theme.classes.cardShadow}`}
          >
            <View style={styles.statementHeader}>
              <View>
                <Text style={styles.statementTitle} className={theme.classes.textPrimary}>
                  {statement.period}
                </Text>
                <Text style={styles.statementMeta} className={theme.classes.textMuted}>
                  Generated {statement.generatedOn}
                </Text>
              </View>
              <StatusChip label={statement.status} tone={statement.statusTone} />
            </View>

            <View style={styles.statementBody}>
              <View>
                <Text style={styles.bodyLabel} className={theme.classes.textMuted}>
                  Total contributions
                </Text>
                <Text style={styles.bodyValue} className={theme.classes.textPrimary}>
                  RWF {statement.total.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text style={styles.bodyLabel} className={theme.classes.textMuted}>
                  Transactions
                </Text>
                <Text style={styles.bodyValue} className={theme.classes.textPrimary}>
                  {statement.contributions}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: theme.palette.card }]}
              accessibilityLabel={`Download ${statement.period} statement`}
            >
              <Text style={styles.downloadLabel} className={theme.classes.accent}>
                Download PDF
              </Text>
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
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: "#38BDF8",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  summaryTitle: {
    fontSize: 13,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  summaryMeta: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHint: {
    fontSize: 13,
  },
  statementCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
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
  },
  statementMeta: {
    fontSize: 13,
    marginTop: spacing.xs / 2,
  },
  statementBody: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bodyLabel: {
    fontSize: 12,
    textTransform: "uppercase" as const,
  },
  bodyValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.xs / 2,
  },
  downloadButton: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  downloadLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
