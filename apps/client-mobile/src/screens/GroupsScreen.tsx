import { StyleSheet, Text, View } from "react-native";

import { AnimatedListItem } from "@components/animations/AnimatedListItem";
import { AnimatedScreenWrapper } from "@components/animations/AnimatedScreenWrapper";
import { ScreenContainer } from "@components/layout/ScreenContainer";
import { SectionHeader } from "@components/layout/SectionHeader";
import { EmptyState } from "@components/states/EmptyState";
import { ErrorBanner } from "@components/states/ErrorBanner";
import { GroupsSkeleton } from "@components/skeletons/GroupsSkeleton";
import { STRINGS } from "@constants/strings";
import { useResourceLoader } from "@hooks/useResourceLoader";
import { colors, layoutSpacing } from "@theme";

interface GroupListItem {
  id: string;
  name: string;
  members: number;
  nextContribution: string;
  contributionAmount: number;
}

interface GroupsPayload {
  groups: GroupListItem[];
}

export function GroupsScreen() {
  const { data, loading, error, refresh } = useResourceLoader(fetchGroups);
  const isEmpty = !loading && !error && !data?.groups.length;

  return (
    <ScreenContainer>
      <AnimatedScreenWrapper>
        <SectionHeader title={STRINGS.groups.title} description={STRINGS.groups.description} />
        {error ? (
          <ErrorBanner
            message={STRINGS.groups.errorTitle}
            actionLabel={STRINGS.groups.retryCta}
            onActionPress={refresh}
          />
        ) : null}
        {loading ? <GroupsSkeleton /> : null}
        {isEmpty ? (
          <EmptyState
            title={STRINGS.groups.emptyTitle}
            description={STRINGS.groups.emptyDescription}
            actionLabel={STRINGS.groups.createCta}
            onActionPress={refresh}
          />
        ) : null}
        {!loading && !error && data
          ? data.groups.map((group, index) => (
              <AnimatedListItem key={group.id} index={index}>
                <View style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>{group.members} members</Text>
                  </View>
                  <View style={styles.groupMetaRow}>
                    <Text style={styles.groupContribution}>
                      {formatCurrency(group.contributionAmount)}
                    </Text>
                    <Text style={styles.groupNext}>{group.nextContribution}</Text>
                  </View>
                </View>
              </AnimatedListItem>
            ))
          : null}
      </AnimatedScreenWrapper>
    </ScreenContainer>
  );
}

async function fetchGroups(): Promise<GroupsPayload> {
  await delay(380);
  return {
    groups: [
      {
        id: "grp-1",
        name: "Women in Tech",
        members: 12,
        nextContribution: "Wed · 15 Jan",
        contributionAmount: 35000,
      },
      {
        id: "grp-2",
        name: "Farmers",
        members: 18,
        nextContribution: "Fri · 17 Jan",
        contributionAmount: 40000,
      },
      {
        id: "grp-3",
        name: "Traders",
        members: 21,
        nextContribution: "Sat · 18 Jan",
        contributionAmount: 50000,
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
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: layoutSpacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    gap: layoutSpacing.cardGap,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  groupMembers: {
    color: colors.textMuted,
  },
  groupMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupContribution: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accent,
  },
  groupNext: {
    color: colors.textSecondary,
  },
});
