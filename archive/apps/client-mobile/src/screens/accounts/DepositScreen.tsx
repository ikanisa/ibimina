import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors, spacing, typography } from "../../theme";
import { paymentService } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

type PaymentMethod = "MTN" | "Airtel";

export function Deposit({ navigation, route }: any) {
  const accountId = route.params?.accountId;
  const { user } = useAppStore();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const quickAmounts = [1000, 5000, 10000, 50000, 100000];

  const handleDeposit = async () => {
    // Validation
    if (!amount || parseFloat(amount) < 100) {
      setError("Minimum deposit is 100 RWF");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payment = await paymentService.initiatePayment({
        user_id: user!.id,
        account_id: accountId,
        amount: parseFloat(amount),
        payment_method: "mobile_money",
        provider: paymentMethod,
        phone_number: phoneNumber,
      });

      setReference(payment.id);
      setSuccess(true);

      // Poll payment status (in production, use webhooks)
      setTimeout(() => {
        navigation.navigate("Accounts");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSuccessModal = () => (
    <Modal visible={success} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Payment Initiated!</Text>
          <Text style={styles.successText}>Please approve the payment on your phone</Text>
          <Text style={styles.successReference}>Reference: {reference.slice(0, 8)}</Text>

          <TouchableOpacity style={styles.successButton} onPress={() => navigation.navigate("Accounts")}>
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Deposit Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Input */}
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

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amt) => (
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

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodContainer}>
            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === "MTN" && styles.methodCardActive]}
              onPress={() => setPaymentMethod("MTN")}
            >
              <View style={[styles.methodIcon, { backgroundColor: "#FFCB05" }]}>
                <Text style={styles.methodIconText}>MTN</Text>
              </View>
              <Text style={styles.methodName}>MTN Mobile Money</Text>
              {paymentMethod === "MTN" && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.methodCheck} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === "Airtel" && styles.methodCardActive]}
              onPress={() => setPaymentMethod("Airtel")}
            >
              <View style={[styles.methodIcon, { backgroundColor: "#FF0000" }]}>
                <Text style={styles.methodIconText}>AM</Text>
              </View>
              <Text style={styles.methodName}>Airtel Money</Text>
              {paymentMethod === "Airtel" && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.methodCheck} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone Number */}
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

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Information */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            You will receive a prompt on your phone to authorize the payment. No fees for deposits.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!amount || !phoneNumber || loading) && styles.buttonDisabled]}
          onPress={handleDeposit}
          disabled={!amount || !phoneNumber || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

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
  methodContainer: { gap: spacing.sm },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  methodCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  methodIconText: { fontSize: typography.small, fontWeight: "700", color: colors.white },
  methodName: { flex: 1, fontSize: typography.body, fontWeight: "500", color: colors.gray900 },
  methodCheck: { position: "absolute", right: spacing.md },
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
  infoContainer: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  infoText: { flex: 1, fontSize: typography.small, color: colors.primary, marginLeft: spacing.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray100 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: typography.body, fontWeight: "600", color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.xl },
  successCard: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, width: "100%", alignItems: "center" },
  successIcon: { marginBottom: spacing.lg },
  successTitle: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900, marginBottom: spacing.sm },
  successText: { fontSize: typography.body, color: colors.gray600, textAlign: "center", marginBottom: spacing.md },
  successReference: { fontSize: typography.small, color: colors.gray500, fontFamily: "monospace", marginBottom: spacing.xl },
  successButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12 },
  successButtonText: { fontSize: typography.body, fontWeight: "600", color: colors.white },
});
