import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { IkiminaCard } from "../src/features/groups/components/IkiminaCard";
import { useGroups, useSubmitJoinRequest } from "../src/features/groups/hooks/useGroups";
import { ReferenceCard } from "../src/features/reference/components/ReferenceCard";
import { USSDSheet } from "../src/features/reference/components/USSDSheet";
import { useReferenceToken } from "../src/features/reference/hooks/useReferenceToken";
import { StatementsTable } from "../src/features/allocations/components/StatementsTable";
import {
  useAllocations,
  useMarkAllocationPaid,
} from "../src/features/allocations/hooks/useAllocations";
import { LiquidCardSkeleton } from "../src/components/skeletons/LiquidCardSkeleton";
import { TableSkeleton } from "../src/components/skeletons/TableSkeleton";

export default function IndexScreen() {
  const { token, tokens, isLoading: tokensLoading } = useReferenceToken();
  const { data: allocationData, isLoading: allocationsLoading } = useAllocations(
    tokens.map((item) => item.token)
  );
  const [showSheet, setShowSheet] = useState(false);
  const groupsQuery = useGroups();
  const joinMutation = useSubmitJoinRequest();
  const markPaidMutation = useMarkAllocationPaid();

  const groups = useMemo(() => groupsQuery.data?.pages.flat() ?? [], [groupsQuery.data]);

  return (
    <LinearGradient colors={["#050712", "#0b122c"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Muraho neza</Text>
            <Text style={styles.subheading}>Track your Ibimina savings in real time</Text>
          </View>
          <Link href="/assist" style={styles.helpLink}>
            AI help
          </Link>
        </View>
        {tokensLoading ? (
          <LiquidCardSkeleton />
        ) : (
          <ReferenceCard reference={token?.token} onShowUSSD={() => setShowSheet(true)} />
        )}
        <Text style={styles.sectionTitle}>Your groups</Text>
        {groupsQuery.isLoading ? (
          <LiquidCardSkeleton />
        ) : (
          groups.map((group) => (
            <IkiminaCard
              key={group.id}
              group={group}
              onJoin={() => joinMutation.mutate({ groupId: group.id })}
            />
          ))
        )}
        <Text style={styles.sectionTitle}>Recent statements</Text>
        {allocationsLoading ? (
          <TableSkeleton />
        ) : allocationData ? (
          <StatementsTable
            allocations={allocationData}
            onMarkPaid={(allocation) => markPaidMutation.mutate({ allocationId: allocation.id })}
          />
        ) : (
          <ActivityIndicator color="rgba(180,200,255,0.8)" />
        )}
        {markPaidMutation.isPending && (
          <Text style={styles.helper}>Confirming your “I’ve paid” signal…</Text>
        )}
        <Link href="/onboarding" style={styles.onboardingLink}>
          Update language & contacts
        </Link>
      </ScrollView>
      <USSDSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        referenceToken={token?.token}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  subheading: {
    color: "rgba(226,233,255,0.75)",
    marginTop: 6,
  },
  helpLink: {
    color: "rgba(152,176,255,0.95)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(121,145,255,0.2)",
  },
  sectionTitle: {
    color: "rgba(235,241,255,0.8)",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  helper: {
    color: "rgba(210,225,255,0.7)",
    marginTop: 8,
  },
  onboardingLink: {
    marginTop: 24,
    color: "rgba(159,182,255,0.9)",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
