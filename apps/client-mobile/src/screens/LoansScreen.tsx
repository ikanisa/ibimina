import { StyleSheet, Text, View } from "react-native";

import { AnimatedListItem } from "@components/animations/AnimatedListItem";
import { AnimatedScreenWrapper } from "@components/animations/AnimatedScreenWrapper";
import { AnimatedPressableButton } from "@components/animations/AnimatedPressable";
import { ScreenContainer } from "@components/layout/ScreenContainer";
import { SectionHeader } from "@components/layout/SectionHeader";
import { EmptyState } from "@components/states/EmptyState";
import { ErrorBanner } from "@components/states/ErrorBanner";
import { LoansSkeleton } from "@components/skeletons/LoansSkeleton";
import { STRINGS } from "@constants/strings";
import { useResourceLoader } from "@hooks/useResourceLoader";
import { colors, layoutSpacing } from "@theme";

interface LoanApplication {
  id: string;
  product: string;
  status: "pending" | "approved" | "disbursed";
  amount: number;
  updatedAt: string;
}

interface LoanPayload {
  loans: LoanApplication[];
}

export function LoansScreen() {
  const { data, loading, error, refresh } = useResourceLoader(fetchLoans);
  const isEmpty = !loading && !error && !data?.loans.length;

  return (
    <ScreenContainer>
      <AnimatedScreenWrapper>
        <SectionHeader title={STRINGS.loans.title} description={STRINGS.loans.description} />
        {error ? (
          <ErrorBanner
            message={STRINGS.loans.errorTitle}
            actionLabel={STRINGS.loans.retryCta}
            onActionPress={refresh}
          />
        ) : null}
        {loading ? <LoansSkeleton /> : null}
        {isEmpty ? (
          <EmptyState
            title={STRINGS.loans.emptyTitle}
            description={STRINGS.loans.emptyDescription}
            actionLabel={STRINGS.loans.startCta}
            onActionPress={refresh}
          />
        ) : null}
        {!loading && !error && data
          ? data.loans.map((loan, index) => (
              <AnimatedListItem key={loan.id} index={index}>
                <View style={styles.loanCard}>
                  <View style={styles.loanHeader}>
                    <Text style={styles.loanProduct}>{loan.product}</Text>
                    <Text style={[styles.loanStatus, styles[`status_${loan.status}` as const]]}>
                      {loan.status}
                    </Text>
                  </View>
                  <View style={styles.loanMetaRow}>
                    <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
                    <Text style={styles.loanUpdated}>{loan.updatedAt}</Text>
                  </View>
                  <AnimatedPressableButton variant="secondary" onPress={refresh}>
                    <Text style={styles.loanCta}>View timeline</Text>
                  </AnimatedPressableButton>
                </View>
              </AnimatedListItem>
            ))
          : null}
      </AnimatedScreenWrapper>
    </ScreenContainer>
  );
}

async function fetchLoans(): Promise<LoanPayload> {
  await delay(480);
  return {
    loans: [
      {
        id: "loan-1",
        product: "Working capital",
        status: "pending",
        amount: 250000,
        updatedAt: "Awaiting score",
      },
      {
        id: "loan-2",
        product: "School fees",
        status: "disbursed",
        amount: 480000,
        updatedAt: "Paid on 5 Jan",
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
  loanCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: layoutSpacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    gap: layoutSpacing.cardGap,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loanProduct: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  loanStatus: {
    textTransform: "capitalize",
    fontWeight: "600",
  },
  status_pending: {
    color: colors.warning,
  },
  status_approved: {
    color: colors.success,
  },
  status_disbursed: {
    color: colors.accent,
  },
  loanMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  loanUpdated: {
    color: colors.textSecondary,
  },
  loanCta: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
