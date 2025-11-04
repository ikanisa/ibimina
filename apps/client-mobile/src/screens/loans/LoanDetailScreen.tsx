import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme";
import { supabase } from "../../lib/supabase";

interface LoanApplication {
  id: string;
  org_id: string;
  product_id: string;
  requested_amount: number;
  tenor_months: number;
  purpose: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  applicant_nid: string;
  status: string;
  status_updated_at: string;
  created_at: string;
  partner_reference: string;
  partner_notes: string;
  approval_notes: string;
  decline_reason: string;
  loan_products: {
    name: string;
    partner_name: string;
    interest_rate: number;
  };
}

interface StatusHistory {
  id: string;
  from_status: string;
  to_status: string;
  notes: string;
  created_at: string;
}

export function LoanDetailScreen({ route, navigation }: any) {
  const { applicationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    try {
      setLoading(true);

      // Load application details
      const { data: appData, error: appError } = await supabase
        .from("loan_applications")
        .select(
          `
          *,
          loan_products (
            name,
            partner_name,
            interest_rate
          )
        `
        )
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;
      setApplication(appData);

      // Load status history
      const { data: historyData, error: historyError } = await supabase
        .from("loan_application_status_history")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (error) {
      console.error("Error loading loan application:", error);
      Alert.alert("Error", "Failed to load loan application details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplication();
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Application",
      "Are you sure you want to cancel this loan application? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("loan_applications")
                .update({ status: "CANCELLED" })
                .eq("id", applicationId);

              if (error) throw error;

              Alert.alert("Success", "Application cancelled successfully");
              loadApplication();
            } catch (error) {
              console.error("Error cancelling application:", error);
              Alert.alert("Error", "Failed to cancel application");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return colors.success;
      case "DISBURSED":
        return colors.primary;
      case "DECLINED":
        return colors.error;
      case "UNDER_REVIEW":
        return colors.warning;
      case "CANCELLED":
        return colors.gray500;
      default:
        return colors.gray500;
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "checkmark-circle";
      case "DISBURSED":
        return "cash";
      case "DECLINED":
        return "close-circle";
      case "UNDER_REVIEW":
        return "time";
      case "CANCELLED":
        return "ban";
      default:
        return "document-text";
    }
  };

  const calculateMonthlyPayment = () => {
    if (!application) return 0;

    const principal = application.requested_amount;
    const months = application.tenor_months;
    const annualRate = application.loan_products.interest_rate / 100;
    const monthlyRate = annualRate / 12;

    const monthly =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);

    return monthly;
  };

  const calculateTotalRepayment = () => {
    return calculateMonthlyPayment() * (application?.tenor_months || 0);
  };

  const calculateTotalInterest = () => {
    return calculateTotalRepayment() - (application?.requested_amount || 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Application Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: getStatusColor(application.status) + "20" },
            ]}
          >
            <Ionicons
              name={getStatusIcon(application.status) as any}
              size={32}
              color={getStatusColor(application.status)}
            />
          </View>
          <Text style={[styles.statusLabel, { color: getStatusColor(application.status) }]}>
            {getStatusLabel(application.status)}
          </Text>
          <Text style={styles.statusDate}>Updated {formatDate(application.status_updated_at)}</Text>
        </View>

        {/* Amount Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Loan Amount</Text>
          <Text style={styles.amount}>{formatAmount(application.requested_amount)}</Text>
          <Text style={styles.productName}>{application.loan_products.name}</Text>
          <Text style={styles.partnerName}>{application.loan_products.partner_name}</Text>
        </View>

        {/* Repayment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Repayment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monthly Payment</Text>
            <Text style={styles.detailValue}>{formatAmount(calculateMonthlyPayment())}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Repayment Period</Text>
            <Text style={styles.detailValue}>{application.tenor_months} months</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest Rate</Text>
            <Text style={styles.detailValue}>{application.loan_products.interest_rate}% p.a.</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Interest</Text>
            <Text style={styles.detailValue}>{formatAmount(calculateTotalInterest())}</Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowTotal]}>
            <Text style={styles.detailLabelTotal}>Total Repayment</Text>
            <Text style={styles.detailValueTotal}>{formatAmount(calculateTotalRepayment())}</Text>
          </View>
        </View>

        {/* Application Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={[styles.detailValue, styles.detailValueMultiline]}>
              {application.purpose}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Application Date</Text>
            <Text style={styles.detailValue}>{formatDateFull(application.created_at)}</Text>
          </View>

          {application.partner_reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference Number</Text>
              <Text style={styles.detailValue}>{application.partner_reference}</Text>
            </View>
          )}
        </View>

        {/* Notes/Messages */}
        {(application.approval_notes ||
          application.decline_reason ||
          application.partner_notes) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            {application.approval_notes && (
              <View style={styles.noteContainer}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.noteText}>{application.approval_notes}</Text>
              </View>
            )}
            {application.decline_reason && (
              <View style={styles.noteContainer}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
                <Text style={styles.noteText}>{application.decline_reason}</Text>
              </View>
            )}
            {application.partner_notes && (
              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.noteText}>{application.partner_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Status History */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status History</Text>
            {history.map((item, index) => (
              <View
                key={item.id}
                style={[styles.historyItem, index < history.length - 1 && styles.historyItemBorder]}
              >
                <View style={styles.historyLeft}>
                  <View
                    style={[styles.historyDot, { backgroundColor: getStatusColor(item.to_status) }]}
                  />
                  {index < history.length - 1 && <View style={styles.historyLine} />}
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyStatus}>{getStatusLabel(item.to_status)}</Text>
                  {item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
                  <Text style={styles.historyDate}>{formatDateFull(item.created_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {(application.status === "DRAFT" || application.status === "SUBMITTED") && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Cancel Application
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString()} RWF`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const formatDateFull = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.white,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
    marginTop: spacing.lg,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  statusDate: {
    fontSize: typography.caption,
    color: colors.gray500,
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: 4,
  },
  partnerName: {
    fontSize: typography.body,
    color: colors.gray500,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  detailRowTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailLabel: {
    fontSize: typography.body,
    color: colors.gray600,
    flex: 1,
  },
  detailValue: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray900,
    flex: 1,
    textAlign: "right",
  },
  detailValueMultiline: {
    textAlign: "left",
  },
  detailLabelTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray900,
    flex: 1,
  },
  detailValueTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    flex: 1,
    textAlign: "right",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.gray700,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  historyItem: {
    flexDirection: "row",
    paddingBottom: spacing.md,
  },
  historyItemBorder: {
    marginBottom: spacing.md,
  },
  historyLeft: {
    alignItems: "center",
    marginRight: spacing.md,
    width: 24,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  historyLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray200,
    marginTop: spacing.xs,
    minHeight: 24,
  },
  historyRight: {
    flex: 1,
  },
  historyStatus: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: 4,
    lineHeight: 20,
  },
  historyDate: {
    fontSize: typography.caption,
    color: colors.gray500,
  },
  actions: {
    padding: spacing.xl,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.error + "10",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: colors.error,
  },
});
