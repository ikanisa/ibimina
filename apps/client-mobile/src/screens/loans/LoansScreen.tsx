import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
}

interface LoanApplication {
  id: string;
  product_id: string;
  requested_amount: number;
  tenor_months: number;
  status: string;
  created_at: string;
  loan_products: LoanProduct;
}

export function Loans({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<"products" | "applications">("products");
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === "products") {
        const { data, error } = await supabase
          .from("loan_products")
          .select("*")
          .eq("enabled", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("loan_applications")
          .select(
            `
            *,
            loan_products (
              id,
              name,
              partner_name,
              interest_rate
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setApplications(data || []);
      }
    } catch (error) {
      console.error("Error loading loans:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const renderProduct = ({ item }: { item: LoanProduct }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("LoanApplication", { product: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.partnerName}>{item.partner_name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
      </View>

      {item.description && (
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.productDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Amount Range</Text>
          <Text style={styles.detailValue}>
            {formatAmount(item.min_amount)} - {formatAmount(item.max_amount)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{item.interest_rate}% p.a.</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tenor</Text>
          <Text style={styles.detailValue}>
            {item.min_tenor_months}-{item.max_tenor_months} months
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderApplication = ({ item }: { item: LoanApplication }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("LoanDetail", { applicationId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.applicationAmount}>{formatAmount(item.requested_amount)}</Text>
          <Text style={styles.applicationProduct}>
            {item.loan_products?.name || "Loan Application"}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.applicationMeta}>
        <Text style={styles.metaText}>
          {item.tenor_months} months • Applied {formatDate(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === "products" ? "wallet-outline" : "document-text-outline"}
        size={64}
        color={colors.gray300}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === "products" ? "No Loan Products" : "No Applications Yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "products"
          ? "Check back later for available loan products"
          : "Apply for a loan to get started"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loans</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.tabActive]}
          onPress={() => setActiveTab("products")}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "applications" && styles.tabActive]}
          onPress={() => setActiveTab("applications")}
        >
          <Text style={[styles.tabText, activeTab === "applications" && styles.tabTextActive]}>
            My Applications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === "products" ? products : applications}
          renderItem={activeTab === "products" ? renderProduct : renderApplication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.gray900,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.body,
    fontWeight: "500",
    color: colors.gray500,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: 4,
  },
  partnerName: {
    fontSize: typography.caption,
    color: colors.gray500,
    fontWeight: "500",
  },
  productDescription: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.caption,
    color: colors.gray500,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.gray900,
  },
  applicationAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: 4,
  },
  applicationProduct: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
  applicationMeta: {
    marginTop: spacing.sm,
  },
  metaText: {
    fontSize: typography.caption,
    color: colors.gray500,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: colors.gray500,
    textAlign: "center",
  },
});
