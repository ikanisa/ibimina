import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { AnimatedPressableButton } from "@components/animations/AnimatedPressable";
import { AnimatedListItem } from "@components/animations/AnimatedListItem";
import { AnimatedScreenWrapper } from "@components/animations/AnimatedScreenWrapper";
import { ScreenContainer } from "@components/layout/ScreenContainer";
import { SectionHeader } from "@components/layout/SectionHeader";
import { EmptyState } from "@components/states/EmptyState";
import { ErrorBanner } from "@components/states/ErrorBanner";
import { HomeSkeleton } from "@components/skeletons/HomeSkeleton";
import { STRINGS } from "@constants/strings";
import { useResourceLoader } from "@hooks/useResourceLoader";
import { colors, layoutSpacing } from "@theme";

interface ShortcutAction {
  id: string;
  label: string;
  description: string;
}

interface GroupSummary {
  id: string;
  name: string;
  nextContribution: string;
  contributionAmount: number;
  sacco: string;
}

interface HomeSummary {
  memberName: string;
  totalBalance: number;
  actions: ShortcutAction[];
  groups: GroupSummary[];
}

export function HomeScreen() {
  const { data, loading, error, refresh } = useResourceLoader(fetchHomeSummary);

  const isEmpty = !loading && !error && !data?.groups.length;

  const formattedBalance = useMemo(() => {
    if (!data) return "--";
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(data.totalBalance);
  }, [data]);

  return (
    <ScreenContainer>
      <AnimatedScreenWrapper>
        <SectionHeader
          title={STRINGS.home.greeting}
          description={`${STRINGS.home.title} · ${formattedBalance}`}
        />
        {error ? (
          <ErrorBanner
            message={STRINGS.home.errorTitle}
            actionLabel={STRINGS.home.retryCta}
            onActionPress={refresh}
          />
        ) : null}
        {loading ? <HomeSkeleton /> : null}
        {isEmpty ? (
          <EmptyState
            title={STRINGS.home.emptyTitle}
            description={STRINGS.home.emptyDescription}
            actionLabel={STRINGS.home.retryCta}
            onActionPress={refresh}
          />
        ) : null}

        {!loading && !error && data ? (
          <View style={styles.card}>
            <Text style={styles.balanceLabel}>{STRINGS.home.highlightSubtitle}</Text>
            <Text style={styles.balanceValue}>{formattedBalance}</Text>
          </View>
        ) : null}

        {!loading && !error && data ? (
          <View style={styles.section}>
            <SectionHeader title={STRINGS.home.shortcutsTitle} />
            <FlatList
              data={data.actions}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: layoutSpacing.cardGap }} />}
              renderItem={({ item, index }) => (
                <AnimatedListItem index={index}>
                  <AnimatedPressableButton style={styles.quickAction} onPress={() => refresh()}>
                    <Text style={styles.quickActionTitle}>{item.label}</Text>
                    <Text style={styles.quickActionDescription}>{item.description}</Text>
                  </AnimatedPressableButton>
                </AnimatedListItem>
              )}
            />
          </View>
        ) : null}

        {!loading && !error && data ? (
          <View style={styles.section}>
            <SectionHeader
              title={STRINGS.home.groupsTitle}
              description={STRINGS.home.groupsDescription}
            />
            {data.groups.map((group, index) => (
              <AnimatedListItem key={group.id} index={index}>
                <View style={styles.groupCard}>
                  <View>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupSacco}>{group.sacco}</Text>
                  </View>
                  <View>
                    <Text style={styles.groupContribution}>
                      {formatCurrency(group.contributionAmount)}
                    </Text>
                    <Text style={styles.groupNext}>{group.nextContribution}</Text>
                  </View>
                </View>
              </AnimatedListItem>
            ))}
          </View>
        ) : null}
      </AnimatedScreenWrapper>
    </ScreenContainer>
  );
}

async function fetchHomeSummary(): Promise<HomeSummary> {
  await delay(380);
  return {
    memberName: "Aline",
    totalBalance: 425000,
    actions: [
      { id: "pay", label: "Pay contribution", description: "Send your weekly savings" },
      { id: "request", label: "Request payout", description: "Ask treasurer for funds" },
      { id: "share", label: "Share invite", description: "Grow your group" },
    ],
    groups: [
      {
        id: "kg",
        name: "Kigali Business",
        nextContribution: "Thu · 16 Jan",
        contributionAmount: 45000,
        sacco: "Umurenge SACCO",
      },
      {
        id: "ny",
        name: "Nyamata Cooperative",
        nextContribution: "Mon · 20 Jan",
        contributionAmount: 55000,
        sacco: "Nyamata SACCO",
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
  card: {
    backgroundColor: colors.surface,
    padding: layoutSpacing.cardPadding,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: layoutSpacing.listItemGap,
  },
  balanceLabel: {
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  section: {
    gap: layoutSpacing.cardGap,
  },
  quickAction: {
    width: "100%",
    alignItems: "flex-start",
  },
  quickActionTitle: {
    color: colors.surface,
    fontWeight: "700",
    marginBottom: 4,
  },
  quickActionDescription: {
    color: colors.surface,
    opacity: 0.8,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: layoutSpacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: layoutSpacing.cardGap,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  groupSacco: {
    color: colors.textSecondary,
  },
  groupContribution: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
    textAlign: "right",
  },
  groupNext: {
    color: colors.textSecondary,
    textAlign: "right",
  },
});
