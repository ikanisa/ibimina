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
  ActivityIndicator,
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
  const [userProfile, setUserProfile] = useState<any>(null);

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
        setUserProfile(profile);
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
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    setCalculation({
      principal,
      interestRate: annualRate * 100,
      term: months,
      monthlyPayment,
      totalPayment,
      totalInterest,
    });
    setStep(2);
  };

  const submitApplication = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to apply for a loan");
      navigation.navigate("WhatsAppAuth");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("loan_applications")
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          purpose,
          term_months: parseInt(term),
          collateral,
          monthly_income: parseFloat(monthlyIncome),
          employment_status: employmentStatus,
          status: "pending",
          monthly_payment: calculation?.monthlyPayment,
          total_interest: calculation?.totalInterest,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        "Application Submitted",
        "Your loan application has been submitted successfully. We will review it and get back to you within 2-3 business days.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Loans"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Submit loan error:", error);
      Alert.alert("Error", error.message || "Failed to submit loan application");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Loan Application</Text>
      <Text style={styles.subtitle}>Step 1 of 2: Loan Details</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Loan Amount (RWF)</Text>
        <TextInput
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Loan Purpose</Text>
        <TextInput
          placeholder="E.g., Business expansion, Education"
          value={purpose}
          onChangeText={setPurpose}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Loan Term (months)</Text>
        <View style={styles.termOptions}>
          {["6", "12", "18", "24", "36"].map((months) => (
            <Button
              key={months}
              title={`${months}m`}
              onPress={() => setTerm(months)}
              variant={term === months ? "primary" : "outline"}
              style={styles.termButton}
            />
          ))}
        </View>

        <Text style={styles.label}>Collateral (Optional)</Text>
        <TextInput
          placeholder="Describe any collateral"
          value={collateral}
          onChangeText={setCollateral}
          multiline
          numberOfLines={2}
        />
      </Card>

      <Button
        title="Calculate & Continue"
        onPress={calculateLoan}
        disabled={!amount || !purpose || !term}
      />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Loan Calculation</Text>
      <Text style={styles.subtitle}>Step 2 of 2: Review & Apply</Text>

      {calculation && (
        <Card style={styles.card}>
          <Text style={styles.calcLabel}>Loan Amount</Text>
          <Text style={styles.calcValue}>{calculation.principal.toLocaleString()} RWF</Text>

          <View style={styles.divider} />

          <Text style={styles.calcLabel}>Interest Rate</Text>
          <Text style={styles.calcValue}>{calculation.interestRate}% per year</Text>

          <View style={styles.divider} />

          <Text style={styles.calcLabel}>Loan Term</Text>
          <Text style={styles.calcValue}>{calculation.term} months</Text>

          <View style={styles.divider} />

          <Text style={styles.calcLabel}>Monthly Payment</Text>
          <Text style={[styles.calcValue, styles.highlight]}>
            {calculation.monthlyPayment.toLocaleString("en-US", { maximumFractionDigits: 0 })} RWF
          </Text>

          <View style={styles.divider} />

          <Text style={styles.calcLabel}>Total Interest</Text>
          <Text style={styles.calcValue}>
            {calculation.totalInterest.toLocaleString("en-US", { maximumFractionDigits: 0 })} RWF
          </Text>

          <View style={styles.divider} />

          <Text style={styles.calcLabel}>Total Repayment</Text>
          <Text style={[styles.calcValue, styles.highlight]}>
            {calculation.totalPayment.toLocaleString("en-US", { maximumFractionDigits: 0 })} RWF
          </Text>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Information</Text>

        <Text style={styles.label}>Monthly Income (RWF)</Text>
        <TextInput
          placeholder="Enter your monthly income"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Employment Status</Text>
        <View style={styles.termOptions}>
          {["Employed", "Self-Employed", "Unemployed"].map((status) => (
            <Button
              key={status}
              title={status}
              onPress={() => setEmploymentStatus(status)}
              variant={employmentStatus === status ? "primary" : "outline"}
              style={styles.termButton}
            />
          ))}
        </View>
      </Card>

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setStep(1)}
          variant="outline"
          style={styles.halfButton}
        />
        <Button
          title="Submit Application"
          onPress={submitApplication}
          loading={loading}
          disabled={!monthlyIncome || !employmentStatus}
          style={styles.halfButton}
        />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.gray500,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  termOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  termButton: {
    flex: 0,
    minWidth: 60,
  },
  calcLabel: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  calcValue: {
    fontSize: typography.h3,
    fontWeight: "600",
    color: colors.gray900,
  },
  highlight: {
    color: colors.primary600,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  halfButton: {
    flex: 1,
  },
});
