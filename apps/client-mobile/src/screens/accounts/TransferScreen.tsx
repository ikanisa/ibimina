import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors, spacing, typography } from "../../theme";
import { accountService, paymentService } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

type Beneficiary = {
  id: string;
  name: string;
  account_number: string;
  avatar_url?: string;
};

export function Transfer({ navigation, route }: any) {
  const sourceAccountId = route.params?.accountId;
  const { user } = useAppStore();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

  // Mock beneficiaries - in production, fetch from Supabase
  const mockBeneficiaries: Beneficiary[] = [
    { id: "1", name: "John Doe", account_number: "1234567890" },
    { id: "2", name: "Jane Smith", account_number: "0987654321" },
    { id: "3", name: "Bob Johnson", account_number: "1122334455" },
  ];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAccounts(user!.id);
      setAccounts(data);
      // Set source account as selected by default
      const sourceAccount = data.find((acc: any) => acc.id === sourceAccountId);
      if (sourceAccount) setSelectedAccount(sourceAccount);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleTransfer = async () => {
    // Validation
    const transferAmount = parseFloat(amount);

    if (!transferAmount || transferAmount < 100) {
      setError("Minimum transfer is 100 RWF");
      return;
    }

    if (transferAmount > (selectedAccount?.balance || 0)) {
      setError("Insufficient balance");
      return;
    }

    if (!beneficiary) {
      setError("Please select a beneficiary");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // In production, create transfer transaction
      await paymentService.initiatePayment({
        user_id: user!.id,
        account_id: selectedAccount.id,
        amount: transferAmount,
        payment_method: "transfer",
      });

      setSuccess(true);

      setTimeout(() => {
        navigation.navigate("Accounts");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBeneficiaries = mockBeneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.account_number.includes(searchQuery)
  );

  const renderBeneficiaryModal = () => (
    <Modal visible={showBeneficiaryModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.beneficiaryModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Beneficiary</Text>
            <TouchableOpacity onPress={() => setShowBeneficiaryModal(false)}>
              <Ionicons name="close" size={28} color={colors.gray900} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.gray500} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or account number"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <FlatList
            data={filteredBeneficiaries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.beneficiaryItem}
                onPress={() => {
                  setBeneficiary(item);
                  setShowBeneficiaryModal(false);
                }}
              >
                <View style={styles.beneficiaryAvatar}>
                  <Text style={styles.beneficiaryInitial}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.beneficiaryInfo}>
                  <Text style={styles.beneficiaryName}>{item.name}</Text>
                  <Text style={styles.beneficiaryAccount}>{item.account_number}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.gray300} />
                <Text style={styles.emptyText}>No beneficiaries found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal visible={success} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Transfer Successful!</Text>
          <Text style={styles.successText}>
            {parseFloat(amount).toLocaleString()} RWF transferred to {beneficiary?.name}
          </Text>

          <TouchableOpacity style={styles.successButton} onPress={() => navigation.navigate("Accounts")}>
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loadingAccounts) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Source Account */}
        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          {selectedAccount && (
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{selectedAccount.name || "Main Account"}</Text>
                <Text style={styles.accountNumber}>{selectedAccount.account_number}</Text>
              </View>
              <Text style={styles.accountBalance}>
                {selectedAccount.balance.toLocaleString()} RWF
              </Text>
            </View>
          )}
        </View>

        {/* Beneficiary */}
        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <TouchableOpacity
            style={styles.beneficiaryCard}
            onPress={() => setShowBeneficiaryModal(true)}
          >
            {beneficiary ? (
              <>
                <View style={styles.beneficiaryAvatar}>
                  <Text style={styles.beneficiaryInitial}>{beneficiary.name.charAt(0)}</Text>
                </View>
                <View style={styles.beneficiaryInfo}>
                  <Text style={styles.beneficiaryName}>{beneficiary.name}</Text>
                  <Text style={styles.beneficiaryAccount}>{beneficiary.account_number}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </>
            ) : (
              <>
                <Ionicons name="person-add-outline" size={24} color={colors.gray500} />
                <Text style={styles.selectBeneficiaryText}>Select Beneficiary</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount (RWF)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.gray300}
            keyboardType="numeric"
          />

          <View style={styles.quickAmounts}>
            {[1000, 5000, 10000, 50000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickButton}
                onPress={() => setAmount(amt.toString())}
              >
                <Text style={styles.quickButtonText}>{amt.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this for?"
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Transfer Summary */}
        {amount && beneficiary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transfer Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>{parseFloat(amount).toLocaleString()} RWF</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee</Text>
              <Text style={styles.summaryValue}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>{parseFloat(amount).toLocaleString()} RWF</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!amount || !beneficiary || loading) && styles.buttonDisabled]}
          onPress={handleTransfer}
          disabled={!amount || !beneficiary || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Transfer Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderBeneficiaryModal()}
      {renderSuccessModal()}
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
  content: { padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  label: { fontSize: typography.body, fontWeight: "500", color: colors.gray700, marginBottom: spacing.sm },
  accountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: typography.body, fontWeight: "600", color: colors.gray900, marginBottom: 4 },
  accountNumber: { fontSize: typography.small, color: colors.gray500 },
  accountBalance: { fontSize: typography.h3, fontWeight: "700", color: colors.primary },
  beneficiaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 12,
  },
  beneficiaryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  beneficiaryInitial: { fontSize: typography.body, fontWeight: "700", color: colors.white },
  beneficiaryInfo: { flex: 1 },
  beneficiaryName: { fontSize: typography.body, fontWeight: "600", color: colors.gray900, marginBottom: 2 },
  beneficiaryAccount: { fontSize: typography.small, color: colors.gray500, fontFamily: "monospace" },
  selectBeneficiaryText: { flex: 1, fontSize: typography.body, color: colors.gray500, marginLeft: spacing.md },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.gray900,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    textAlign: "center",
  },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  quickButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  quickButtonText: { fontSize: typography.small, fontWeight: "500", color: colors.gray700 },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.gray900,
    textAlignVertical: "top",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: typography.small, color: colors.error, marginLeft: spacing.sm },
  summaryCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  summaryTitle: { fontSize: typography.body, fontWeight: "600", color: colors.gray900, marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  summaryRowTotal: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray300 },
  summaryLabel: { fontSize: typography.body, color: colors.gray600 },
  summaryValue: { fontSize: typography.body, fontWeight: "500", color: colors.gray900 },
  summaryLabelTotal: { fontSize: typography.body, fontWeight: "600", color: colors.gray900 },
  summaryValueTotal: { fontSize: typography.body, fontWeight: "700", color: colors.primary },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray100 },
  button: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: typography.body, fontWeight: "600", color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  beneficiaryModal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", paddingBottom: spacing.xl },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: { fontSize: typography.h3, fontWeight: "600", color: colors.gray900 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: typography.body, color: colors.gray900 },
  beneficiaryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginHorizontal: spacing.lg,
  },
  emptyState: { padding: spacing.xl, alignItems: "center" },
  emptyText: { fontSize: typography.body, color: colors.gray500, marginTop: spacing.md },
  successCard: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, margin: spacing.xl, alignItems: "center" },
  successIcon: { marginBottom: spacing.lg },
  successTitle: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900, marginBottom: spacing.sm },
  successText: { fontSize: typography.body, color: colors.gray600, textAlign: "center", marginBottom: spacing.xl },
  successButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12 },
  successButtonText: { fontSize: typography.body, fontWeight: "600", color: colors.white },
});
