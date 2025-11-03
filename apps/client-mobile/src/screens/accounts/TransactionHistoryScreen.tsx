import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { format } from "date-fns";
import { colors, spacing, typography } from "../../theme";
import { accountService } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

type Transaction = {
  id: string;
  type: "deposit" | "withdrawal" | "transfer" | "loan_payment";
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  balance_after?: number;
  reference?: string;
  beneficiary?: string;
};

export function TransactionHistory({ navigation, route }: any) {
  const accountId = route.params?.accountId;
  const { user } = useAppStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal" | "transfer">("all");

  useEffect(() => {
    loadTransactions();
  }, [accountId, filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await accountService.getTransactions(accountId, 100);
      const filtered =
        filter === "all" ? data : data.filter((tx: Transaction) => tx.type === filter);
      setTransactions(filtered);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return { name: "time-outline", color: colors.warning };
    if (status === "failed") return { name: "close-circle-outline", color: colors.error };

    switch (type) {
      case "deposit":
        return { name: "arrow-down-circle", color: colors.success };
      case "withdrawal":
        return { name: "arrow-up-circle", color: colors.error };
      case "transfer":
        return { name: "swap-horizontal", color: colors.primary };
      case "loan_payment":
        return { name: "cash-outline", color: colors.gray700 };
      default:
        return { name: "wallet-outline", color: colors.gray500 };
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === "deposit" ? "+" : "-";
    return `${sign}${amount.toLocaleString()} RWF`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type, item.status);
    const isPositive = item.type === "deposit";

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => setSelectedTx(item)}
        activeOpacity={0.7}
      >
        <View style={styles.txIcon}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>

        <View style={styles.txContent}>
          <Text style={styles.txDescription}>{item.description}</Text>
          <Text style={styles.txDate}>{format(new Date(item.created_at), "MMM dd, yyyy · HH:mm")}</Text>
        </View>

        <View style={styles.txAmount}>
          <Text style={[styles.txAmountText, isPositive ? styles.positive : styles.negative]}>
            {formatAmount(item.amount, item.type)}
          </Text>
          {item.status === "pending" && <Text style={styles.txStatus}>Pending</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => (
    <Modal visible={!!selectedTx} transparent animationType="slide" onRequestClose={() => setSelectedTx(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={() => setSelectedTx(null)}>
              <Ionicons name="close" size={28} color={colors.gray900} />
            </TouchableOpacity>
          </View>

          {selectedTx && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>
                  {selectedTx.amount.toLocaleString()} {selectedTx.currency}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{selectedTx.type.replace("_", " ").toUpperCase()}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    selectedTx.status === "completed" && styles.statusSuccess,
                    selectedTx.status === "pending" && styles.statusWarning,
                    selectedTx.status === "failed" && styles.statusError,
                  ]}
                >
                  {selectedTx.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(selectedTx.created_at), "MMM dd, yyyy HH:mm")}
                </Text>
              </View>

              {selectedTx.reference && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference</Text>
                  <Text style={styles.detailValue}>{selectedTx.reference}</Text>
                </View>
              )}

              {selectedTx.balance_after && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance After</Text>
                  <Text style={styles.detailValue}>
                    {selectedTx.balance_after.toLocaleString()} {selectedTx.currency}
                  </Text>
                </View>
              )}

              {selectedTx.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedTx.description}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        {(["all", "deposit", "withdrawal", "transfer"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: typography.h3, fontWeight: "600", color: colors.gray900 },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.gray50,
  },
  filterButtonActive: { backgroundColor: colors.primary },
  filterText: { fontSize: typography.small, fontWeight: "500", color: colors.gray600 },
  filterTextActive: { color: colors.white },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  emptyText: { fontSize: typography.h3, fontWeight: "600", color: colors.gray900, marginTop: spacing.lg },
  emptySubtext: { fontSize: typography.body, color: colors.gray500, marginTop: spacing.xs },
  listContent: { padding: spacing.lg },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  txContent: { flex: 1 },
  txDescription: { fontSize: typography.body, fontWeight: "500", color: colors.gray900, marginBottom: 2 },
  txDate: { fontSize: typography.small, color: colors.gray500 },
  txAmount: { alignItems: "flex-end" },
  txAmountText: { fontSize: typography.body, fontWeight: "600" },
  positive: { color: colors.success },
  negative: { color: colors.error },
  txStatus: { fontSize: typography.small, color: colors.warning, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: spacing.xl },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: { fontSize: typography.h3, fontWeight: "600", color: colors.gray900 },
  detailsContainer: { padding: spacing.lg },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  detailLabel: { fontSize: typography.body, color: colors.gray500 },
  detailValue: { fontSize: typography.body, fontWeight: "500", color: colors.gray900 },
  statusSuccess: { color: colors.success },
  statusWarning: { color: colors.warning },
  statusError: { color: colors.error },
});
