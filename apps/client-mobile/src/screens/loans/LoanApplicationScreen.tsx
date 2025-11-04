import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme";
import { supabase } from "../../lib/supabase";

interface LoanProduct {
  id: string;
  name: string;
  description: string;
  partner_name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  interest_rate_description: string;
  min_tenor_months: number;
  max_tenor_months: number;
  required_documents: string[];
  eligibility_criteria: string;
}

export function LoanApplicationScreen({ route, navigation }: any) {
  const product: LoanProduct = route.params?.product;

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [requestedAmount, setRequestedAmount] = useState("");
  const [tenorMonths, setTenorMonths] = useState(product?.min_tenor_months?.toString() || "12");
  const [purpose, setPurpose] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantNid, setApplicantNid] = useState("");

  // Calculated values
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (requestedAmount && tenorMonths && product) {
      calculateLoan();
    }
  }, [requestedAmount, tenorMonths]);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setApplicantName(profile.full_name || "");
        setApplicantPhone(profile.phone || user.phone || "");
        setApplicantEmail(profile.email || user.email || "");
        setApplicantNid(profile.national_id || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const calculateLoan = () => {
    const principal = parseFloat(requestedAmount);
    const months = parseInt(tenorMonths);
    const annualRate = product.interest_rate / 100;
    const monthlyRate = annualRate / 12;

    // Calculate monthly payment using loan amortization formula
    const monthly =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const total = monthly * months;
    const interest = total - principal;

    setMonthlyPayment(monthly);
    setTotalPayment(total);
    setTotalInterest(interest);
  };

  const validateStep1 = () => {
    const amount = parseFloat(requestedAmount);
    const tenor = parseInt(tenorMonths);

    if (!requestedAmount || isNaN(amount)) {
      Alert.alert("Error", "Please enter a valid amount");
      return false;
    }

    if (amount < product.min_amount || amount > product.max_amount) {
      Alert.alert(
        "Error",
        `Amount must be between ${formatAmount(product.min_amount)} and ${formatAmount(product.max_amount)}`
      );
      return false;
    }

    if (!tenorMonths || isNaN(tenor)) {
      Alert.alert("Error", "Please enter a valid repayment period");
      return false;
    }

    if (tenor < product.min_tenor_months || tenor > product.max_tenor_months) {
      Alert.alert(
        "Error",
        `Repayment period must be between ${product.min_tenor_months} and ${product.max_tenor_months} months`
      );
      return false;
    }

    if (!purpose.trim()) {
      Alert.alert("Error", "Please describe the purpose of your loan");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!applicantName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }

    if (!applicantPhone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get org_id from the product
      const { data: productData } = await supabase
        .from("loan_products")
        .select("org_id")
        .eq("id", product.id)
        .single();

      if (!productData) throw new Error("Product not found");

      const { data, error } = await supabase
        .from("loan_applications")
        .insert({
          org_id: productData.org_id,
          user_id: user.id,
          product_id: product.id,
          requested_amount: parseFloat(requestedAmount),
          tenor_months: parseInt(tenorMonths),
          purpose,
          applicant_name: applicantName,
          applicant_phone: applicantPhone,
          applicant_email: applicantEmail,
          applicant_nid: applicantNid,
          status: "SUBMITTED",
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        "Application Submitted",
        "Your loan application has been submitted successfully. You will be notified once it has been reviewed.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Loans"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error submitting application:", error);
      Alert.alert("Error", error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.partnerName}>{product.partner_name}</Text>
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Loan Amount</Text>
        <View style={styles.inputContainer}>
          <RNTextInput
            style={styles.input}
            value={requestedAmount}
            onChangeText={setRequestedAmount}
            placeholder={`${formatAmount(product.min_amount)} - ${formatAmount(product.max_amount)}`}
            keyboardType="numeric"
            placeholderTextColor={colors.gray400}
          />
          <Text style={styles.inputSuffix}>RWF</Text>
        </View>
        <Text style={styles.hint}>
          Min: {formatAmount(product.min_amount)} • Max: {formatAmount(product.max_amount)}
        </Text>
      </View>

      {/* Tenor Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Repayment Period</Text>
        <View style={styles.inputContainer}>
          <RNTextInput
            style={styles.input}
            value={tenorMonths}
            onChangeText={setTenorMonths}
            placeholder="Enter months"
            keyboardType="numeric"
            placeholderTextColor={colors.gray400}
          />
          <Text style={styles.inputSuffix}>months</Text>
        </View>
        <Text style={styles.hint}>
          {product.min_tenor_months}-{product.max_tenor_months} months available
        </Text>
      </View>

      {/* Calculation Summary */}
      {requestedAmount && tenorMonths && monthlyPayment > 0 && (
        <View style={styles.calculation}>
          <Text style={styles.calculationTitle}>Loan Summary</Text>

          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Monthly Payment</Text>
            <Text style={styles.calculationValue}>{formatAmount(monthlyPayment)}</Text>
          </View>

          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Total Interest</Text>
            <Text style={styles.calculationValue}>{formatAmount(totalInterest)}</Text>
          </View>

          <View style={[styles.calculationRow, styles.calculationRowTotal]}>
            <Text style={styles.calculationLabelTotal}>Total Repayment</Text>
            <Text style={styles.calculationValueTotal}>{formatAmount(totalPayment)}</Text>
          </View>

          <Text style={styles.calculationNote}>
            {product.interest_rate_description || `${product.interest_rate}% per annum`}
          </Text>
        </View>
      )}

      {/* Purpose Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Purpose of Loan</Text>
        <RNTextInput
          style={[styles.input, styles.textArea]}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="Describe how you plan to use this loan"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={colors.gray400}
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>
        This information will be shared with {product.partner_name} to process your application.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <RNTextInput
          style={styles.input}
          value={applicantName}
          onChangeText={setApplicantName}
          placeholder="Enter your full name"
          placeholderTextColor={colors.gray400}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <RNTextInput
          style={styles.input}
          value={applicantPhone}
          onChangeText={setApplicantPhone}
          placeholder="+250 XXX XXX XXX"
          keyboardType="phone-pad"
          placeholderTextColor={colors.gray400}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email (Optional)</Text>
        <RNTextInput
          style={styles.input}
          value={applicantEmail}
          onChangeText={setApplicantEmail}
          placeholder="your.email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.gray400}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>National ID (Optional)</Text>
        <RNTextInput
          style={styles.input}
          value={applicantNid}
          onChangeText={setApplicantNid}
          placeholder="1 XXXX X XXXXXXX X XX"
          placeholderTextColor={colors.gray400}
        />
      </View>

      {/* Review Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Application Summary</Text>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Loan Amount</Text>
          <Text style={styles.reviewValue}>{formatAmount(parseFloat(requestedAmount))}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Repayment Period</Text>
          <Text style={styles.reviewValue}>{tenorMonths} months</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Monthly Payment</Text>
          <Text style={styles.reviewValue}>{formatAmount(monthlyPayment)}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Lender</Text>
          <Text style={styles.reviewValue}>{product.partner_name}</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={20} color={colors.gray500} />
        <Text style={styles.disclaimerText}>
          By submitting this application, you agree to share your information with{" "}
          {product.partner_name} for loan processing purposes.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Application</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
          <Text style={[styles.progressNumber, step >= 1 && styles.progressNumberActive]}>1</Text>
          <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>
            Details
          </Text>
        </View>

        <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />

        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
          <Text style={[styles.progressNumber, step >= 2 && styles.progressNumberActive]}>2</Text>
          <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>
            Personal
          </Text>
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </KeyboardAvoidingView>

      {/* Actions */}
      <View style={styles.actions}>
        {step === 1 ? (
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleNext}>
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Submitting...</Text>
            ) : (
              <>
                <Text style={styles.buttonText}>Submit Application</Text>
                <Ionicons name="checkmark" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
  },
  headerRight: {
    width: 40,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.gray50,
  },
  progressStep: {
    alignItems: "center",
  },
  progressStepActive: {},
  progressNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    color: colors.gray500,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: spacing.xs,
  },
  progressNumberActive: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  progressLabel: {
    fontSize: typography.caption,
    color: colors.gray500,
    fontWeight: "500",
  },
  progressLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.xl,
  },
  productInfo: {
    marginBottom: spacing.xl,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: 4,
  },
  partnerName: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputSuffix: {
    paddingRight: spacing.md,
    fontSize: typography.body,
    color: colors.gray500,
    fontWeight: "500",
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  hint: {
    fontSize: typography.caption,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  calculation: {
    backgroundColor: colors.primary + "08",
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  calculationRowTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  calculationLabel: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  calculationValue: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray900,
  },
  calculationLabelTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray900,
  },
  calculationValueTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  calculationNote: {
    fontSize: typography.caption,
    color: colors.gray500,
    marginTop: spacing.sm,
  },
  reviewSection: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reviewLabel: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  reviewValue: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray900,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.gray600,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  actions: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.gray300,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});
