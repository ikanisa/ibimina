/**
 * Statements screen - View transaction history and account statements
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { useQuery } from "@tanstack/react-query";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { colors, elevation } from "../../src/theme";
import mockApi from "../../src/mocks";

export default function StatementsScreen() {
  const intl = useIntl();
  
  const { data: statements, isLoading: statementsLoading } = useQuery({
    queryKey: ["statements"],
    queryFn: mockApi.getStatements,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: mockApi.getTransactions,
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.statements", defaultMessage: "Statements" })}
          subtitle="View your transaction history"
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Monthly Statements */}
          <Text style={styles.sectionTitle}>Monthly Statements</Text>
          
          {statementsLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            statements?.map((statement) => (
              <View key={statement.id} style={styles.statementCard}>
                <View style={styles.statementHeader}>
                  <View>
                    <Text style={styles.statementMonth}>{statement.month}</Text>
                    <Text style={styles.statementGroup}>{statement.groupName}</Text>
                  </View>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Balance</Text>
                    <Text style={styles.balanceAmount}>
                      {statement.closingBalance.toLocaleString()} {statement.currency}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statementDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Opening Balance</Text>
                    <Text style={styles.detailValue}>
                      {statement.openingBalance.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, styles.positive]}>+ Contributions</Text>
                    <Text style={[styles.detailValue, styles.positive]}>
                      {statement.contributions.toLocaleString()}
                    </Text>
                  </View>
                  {statement.loans !== 0 && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, styles.negative]}>- Loans</Text>
                      <Text style={[styles.detailValue, styles.negative]}>
                        {Math.abs(statement.loans).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {statement.withdrawals !== 0 && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, styles.negative]}>- Withdrawals</Text>
                      <Text style={[styles.detailValue, styles.negative]}>
                        {Math.abs(statement.withdrawals).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Recent Transactions */}
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            Recent Transactions
          </Text>
          
          {transactionsLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            transactions?.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionMain}>
                  <View style={styles.transactionIcon}>
                    <Text style={styles.transactionIconText}>
                      {transaction.type === "contribution"
                        ? "💰"
                        : transaction.type === "loan"
                        ? "🏦"
                        : "💸"}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Text>
                    <Text style={styles.transactionGroup}>{transaction.groupName}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text
                      style={[
                        styles.transactionAmountText,
                        transaction.type === "contribution" && styles.positive,
                        transaction.type === "withdrawal" && styles.negative,
                      ]}
                    >
                      {transaction.type === "withdrawal" ? "-" : "+"}
                      {transaction.amount.toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        transaction.status === "completed" && styles.statusCompleted,
                        transaction.status === "pending" && styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
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
  statementGroup: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.warm[500],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.ink[700],
    marginVertical: 12,
  },
  statementDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: colors.neutral[300],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.neutral[200],
  },
  positive: {
    color: colors.rw.green,
  },
  negative: {
    color: colors.warm[500],
  },
  transactionCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  transactionMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink[700],
    alignItems: "center",
    justifyContent: "center",
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[100],
  },
  transactionGroup: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: "flex-end",
    gap: 4,
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.neutral[200],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: `${colors.rw.green}30`,
  },
  statusPending: {
    backgroundColor: `${colors.rw.yellow}30`,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.neutral[100],
    textTransform: "uppercase",
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    marginVertical: 20,
  },
});
