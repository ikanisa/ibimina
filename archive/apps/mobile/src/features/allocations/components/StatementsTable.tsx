import { memo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { type Allocation } from "@ibimina/data-access";

export type StatementsTableProps = {
  allocations: Allocation[];
  onMarkPaid?: (allocation: Allocation) => void;
};

const formatAmount = (allocation: Allocation) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: allocation.currency }).format(
    allocation.amount
  );

const renderItem = ({
  item,
  onMarkPaid,
}: {
  item: Allocation;
  onMarkPaid?: (allocation: Allocation) => void;
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.amount}>{formatAmount(item)}</Text>
        <Text style={styles.meta}>
          {item.groupName ?? "Unassigned"}
          {item.msisdn ? ` • ${item.msisdn}` : ""}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.status, styles[`status_${item.status}` as const]]}>{item.status}</Text>
        <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
        {item.status === "pending" && onMarkPaid ? (
          <Text style={styles.action} onPress={() => onMarkPaid(item)}>
            I’ve paid
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const keyExtractor = (item: Allocation) => item.id;

const StatementsTableComponent = ({ allocations, onMarkPaid }: StatementsTableProps) => {
  return (
    <FlatList
      data={allocations}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem({ item, onMarkPaid })}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No statements yet</Text>
          <Text style={styles.emptySubtitle}>
            Your allocations will appear here as soon as they are reconciled.
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowLeft: {
    flexShrink: 1,
    paddingRight: 12,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    marginTop: 4,
    color: "rgba(230,236,255,0.65)",
  },
  status: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: "rgba(255,194,120,0.18)",
    color: "#FFD892",
  },
  status_posted: {
    backgroundColor: "rgba(122,217,176,0.18)",
    color: "#9DF2C4",
  },
  status_failed: {
    backgroundColor: "rgba(255,116,116,0.18)",
    color: "#FFB7B7",
  },
  status_reconciled: {
    backgroundColor: "rgba(122,217,176,0.18)",
    color: "#9DF2C4",
  },
  timestamp: {
    color: "rgba(206,216,255,0.55)",
    fontSize: 12,
  },
  action: {
    color: "rgba(146,178,255,0.9)",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#F5F8FF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    marginTop: 6,
    textAlign: "center",
    color: "rgba(220,228,255,0.7)",
  },
});

export const StatementsTable = memo(StatementsTableComponent);
