import { StyleSheet, Text, View } from "react-native";

import { AnimatedListItem } from "@components/animations/AnimatedListItem";
import { AnimatedScreenWrapper } from "@components/animations/AnimatedScreenWrapper";
import { ScreenContainer } from "@components/layout/ScreenContainer";
import { SectionHeader } from "@components/layout/SectionHeader";
import { EmptyState } from "@components/states/EmptyState";
import { ErrorBanner } from "@components/states/ErrorBanner";
import { AccountsSkeleton } from "@components/skeletons/AccountsSkeleton";
import { STRINGS } from "@constants/strings";
import { useResourceLoader } from "@hooks/useResourceLoader";
import { colors, layoutSpacing } from "@theme";

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
}

interface AccountsPayload {
  transactions: Transaction[];
}

export function AccountsScreen() {
  const { data, loading, error, refresh } = useResourceLoader(fetchTransactions);
  const isEmpty = !loading && !error && !data?.transactions.length;

  return (
    <ScreenContainer>
      <AnimatedScreenWrapper>
        <SectionHeader title={STRINGS.accounts.title} description={STRINGS.accounts.subheader} />
        {error ? (
          <ErrorBanner
            message={STRINGS.accounts.errorTitle}
            actionLabel={STRINGS.accounts.retryCta}
            onActionPress={refresh}
          />
        ) : null}
        {loading ? <AccountsSkeleton /> : null}
        {isEmpty ? (
          <EmptyState
            title={STRINGS.accounts.emptyTitle}
            description={STRINGS.accounts.emptyDescription}
            actionLabel={STRINGS.accounts.retryCta}
            onActionPress={refresh}
          />
        ) : null}
        {!loading && !error && data
          ? data.transactions.map((transaction, index) => (
              <AnimatedListItem key={transaction.id} index={index}>
                <View style={styles.transactionCard}>
                  <View>
                    <Text style={styles.transactionTitle}>{transaction.title}</Text>
                    <Text style={styles.transactionSubtitle}>{transaction.subtitle}</Text>
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.amount < 0 && styles.transactionDebit,
                      ]}
                    >
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Text style={styles.transactionTimestamp}>{transaction.timestamp}</Text>
                  </View>
                </View>
              </AnimatedListItem>
            ))
          : null}
      </AnimatedScreenWrapper>
    </ScreenContainer>
  );
}

async function fetchTransactions(): Promise<AccountsPayload> {
  await delay(420);
  return {
    transactions: [
      {
        id: "txn-1",
        title: "Contribution",
        subtitle: "Kigali Business Group",
        amount: -45000,
        timestamp: "Today · 10:20",
      },
      {
        id: "txn-2",
        title: "Pay out",
        subtitle: "Nyamata Cooperative",
        amount: 120000,
        timestamp: "Yesterday · 16:45",
      },
      {
        id: "txn-3",
        title: "Loan repayment",
        subtitle: "Ibimina Loan",
        amount: -30000,
        timestamp: "Mon · 09:15",
      },
    ],
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(value);

const styles = StyleSheet.create({
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: layoutSpacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: layoutSpacing.cardGap,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  transactionSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontWeight: "700",
    color: colors.success,
    textAlign: "right",
  },
  transactionDebit: {
    color: colors.danger,
  },
  transactionTimestamp: {
    marginTop: 4,
    color: colors.textMuted,
    textAlign: "right",
  },
});
