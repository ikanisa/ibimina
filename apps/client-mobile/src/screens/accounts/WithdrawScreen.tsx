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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors, spacing, typography } from "../../theme";
import { accountService, paymentService } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

type WithdrawMethod = "mobile_money" | "bank";

export function Withdraw({ navigation, route }: any) {
  const accountId = route.params?.accountId;
  const { user } = useAppStore();

  const [account, setAccount] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState<"MTN" | "Airtel">("MTN");
  const [method, setMethod] = useState<WithdrawMethod>("mobile_money");
  const [loading, setLoading] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async () => {
    try {
      const data = await accountService.getAccountById(accountId);
      setAccount(data);
    } catch (err) {
      console.error("Failed to load account:", err);
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleWithdraw = () => {
    // Validation
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount < 500) {
      setError("Minimum withdrawal is 500 RWF");
      return;
    }

    if (withdrawAmount > (account?.balance || 0)) {
      setError("Insufficient balance");
      return;
    }

    if (method === "mobile_money" && (!phoneNumber || phoneNumber.length < 10)) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");
    setShowOtpModal(true);
  };

  const confirmWithdrawal = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Error", "Please enter valid OTP");
      return;
    }

    setLoading(true);

    try {
      // In production, verify OTP first
      await paymentService.initiatePayment({
        user_id: user!.id,
        account_id: accountId,
        amount: parseFloat(amount),
        payment_method: method,
        provider: method === "mobile_money" ? provider : undefined,
        phone_number: method === "mobile_money" ? phoneNumber : undefined,
      });

      setShowOtpModal(false);
      setSuccess(true);

      setTimeout(() => {
        navigation.navigate("Accounts");
      }, 3000);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderOtpModal = () => (
    <Modal visible={showOtpModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.otpCard}>
          <Text style={styles.otpTitle}>Verify Withdrawal</Text>
          <Text style={styles.otpSubtext}>Enter the 6-digit code sent to your registered phone</Text>

          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="000000"
            placeholderTextColor={colors.gray300}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          <View style={styles.otpButtons}>
            <TouchableOpacity
              style={[styles.otpButton, styles.otpButtonSecondary]}
              onPress={() => setShowOtpModal(false)}
            >
              <Text style={styles.otpButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.otpButton, styles.otpButtonPrimary, loading && styles.buttonDisabled]}
              onPress={confirmWithdrawal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.otpButtonTextPrimary}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
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
          <Text style={styles.successTitle}>Withdrawal Successful!</Text>
          <Text style={styles.successText}>
            {parseFloat(amount).toLocaleString()} RWF will be sent to your {method === "mobile_money" ? "mobile money account" : "bank account"}
          </Text>

          <TouchableOpacity style={styles.successButton} onPress={() => navigation.navigate("Accounts")}>
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loadingAccount) {
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
        <Text style={styles.headerTitle}>Withdraw Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{account?.balance.toLocaleString()} RWF</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Withdrawal Amount (RWF)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.gray300}
            keyboardType="numeric"
          />

          {/* Quick Percentages */}
          <View style={styles.quickAmounts}>
            {[25, 50, 75, 100].map((percent) => (
              <TouchableOpacity
                key={percent}
                style={styles.quickButton}
                onPress={() => setAmount(((account?.balance || 0) * percent / 100).toFixed(0))}
              >
                <Text style={styles.quickButtonText}>{percent}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Withdrawal Method */}
        <View style={styles.section}>
          <Text style={styles.label}>Withdrawal Method</Text>

          <TouchableOpacity
            style={[styles.methodCard, method === "mobile_money" && styles.methodCardActive]}
            onPress={() => setMethod("mobile_money")}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="phone-portrait" size={24} color={method === "mobile_money" ? colors.primary : colors.gray500} />
            </View>
            <Text style={styles.methodName}>Mobile Money</Text>
            {method === "mobile_money" && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, method === "bank" && styles.methodCardActive]}
            onPress={() => setMethod("bank")}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="business" size={24} color={method === "bank" ? colors.primary : colors.gray500} />
            </View>
            <Text style={styles.methodName}>Bank Transfer</Text>
            {method === "bank" && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Mobile Money Details */}
        {method === "mobile_money" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Provider</Text>
              <View style={styles.providerContainer}>
                <TouchableOpacity
                  style={[styles.providerCard, provider === "MTN" && styles.providerCardActive]}
                  onPress={() => setProvider("MTN")}
                >
                  <View style={[styles.providerIcon, { backgroundColor: "#FFCB05" }]}>
                    <Text style={styles.providerIconText}>MTN</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.providerCard, provider === "Airtel" && styles.providerCardActive]}
                  onPress={() => setProvider("Airtel")}
                >
                  <View style={[styles.providerIcon, { backgroundColor: "#FF0000" }]}>
                    <Text style={styles.providerIconText}>AM</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <View style={styles.prefix}>
                  <Text style={styles.prefixText}>+250</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="7XX XXX XXX"
                  placeholderTextColor={colors.gray400}
                  keyboardType="phone-pad"
                  maxLength={9}
                />
              </View>
            </View>
          </>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Fee Information */}
        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Withdrawal Amount</Text>
            <Text style={styles.feeValue}>{amount ? parseFloat(amount).toLocaleString() : "0"} RWF</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Processing Fee</Text>
            <Text style={styles.feeValue}>Free</Text>
          </View>
          <View style={[styles.feeRow, styles.feeRowTotal]}>
            <Text style={styles.feeLabelTotal}>Total</Text>
            <Text style={styles.feeValueTotal}>{amount ? parseFloat(amount).toLocaleString() : "0"} RWF</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!amount || loading) && styles.buttonDisabled]}
          onPress={handleWithdraw}
          disabled={!amount || loading}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {renderOtpModal()}
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
  balanceCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  balanceLabel: { fontSize: typography.small, color: colors.primary, marginBottom: spacing.xs },
  balanceAmount: { fontSize: typography.h1, fontWeight: "700", color: colors.primary },
  section: { marginBottom: spacing.xl },
  label: { fontSize: typography.body, fontWeight: "500", color: colors.gray700, marginBottom: spacing.sm },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.gray900,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    textAlign: "center",
  },
  quickAmounts: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
  },
  quickButtonText: { fontSize: typography.small, fontWeight: "600", color: colors.gray700 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  methodCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    backgroundColor: colors.gray50,
  },
  methodName: { flex: 1, fontSize: typography.body, fontWeight: "500", color: colors.gray900 },
  providerContainer: { flexDirection: "row", gap: spacing.md },
  providerCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: "center",
  },
  providerCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  providerIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  providerIconText: { fontSize: typography.small, fontWeight: "700", color: colors.white },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.gray300, borderRadius: 12, overflow: "hidden" },
  prefix: { padding: spacing.md, backgroundColor: colors.gray50, borderRightWidth: 1, borderRightColor: colors.gray300 },
  prefixText: { fontSize: typography.body, fontWeight: "600", color: colors.gray700 },
  phoneInput: { flex: 1, padding: spacing.md, fontSize: typography.body, color: colors.gray900 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: typography.small, color: colors.error, marginLeft: spacing.sm },
  feeCard: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  feeRowTotal: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray300 },
  feeLabel: { fontSize: typography.body, color: colors.gray600 },
  feeValue: { fontSize: typography.body, fontWeight: "500", color: colors.gray900 },
  feeLabelTotal: { fontSize: typography.body, fontWeight: "600", color: colors.gray900 },
  feeValueTotal: { fontSize: typography.body, fontWeight: "700", color: colors.primary },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray100 },
  button: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: typography.body, fontWeight: "600", color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.xl },
  otpCard: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, width: "100%" },
  otpTitle: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900, textAlign: "center", marginBottom: spacing.sm },
  otpSubtext: { fontSize: typography.body, color: colors.gray600, textAlign: "center", marginBottom: spacing.xl },
  otpInput: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  otpButtons: { flexDirection: "row", gap: spacing.md },
  otpButton: { flex: 1, paddingVertical: spacing.md, borderRadius: 12, alignItems: "center" },
  otpButtonSecondary: { borderWidth: 1, borderColor: colors.gray300 },
  otpButtonPrimary: { backgroundColor: colors.primary },
  otpButtonTextSecondary: { fontSize: typography.body, fontWeight: "600", color: colors.gray700 },
  otpButtonTextPrimary: { fontSize: typography.body, fontWeight: "600", color: colors.white },
  successCard: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, width: "100%", alignItems: "center" },
  successIcon: { marginBottom: spacing.lg },
  successTitle: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900, marginBottom: spacing.sm },
  successText: { fontSize: typography.body, color: colors.gray600, textAlign: "center", marginBottom: spacing.xl },
  successButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12 },
  successButtonText: { fontSize: typography.body, fontWeight: "600", color: colors.white },
});
