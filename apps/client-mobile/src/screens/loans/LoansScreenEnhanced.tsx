import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors, spacing, typography, borderRadius } from "../../theme";
import { supabase } from "../../lib/supabase";
import { CardSkeleton, EmptyState, ErrorState, PullToRefresh } from "../../components/ui";
import { haptics } from "../../utils/haptics";
import { fadeIn, slideInUp } from "../../utils/animations";
import { formatCurrency } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";

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

export function LoansScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<"products" | "applications">("products");
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, hideToast, error: showError } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // Animate tab indicator
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "products" ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      haptics.impact("light");
    } else {
      setLoading(true);
    }

    setError(null);

    try {
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

      // Animate entrance
      if (!isRefresh) {
        Animated.parallel([fadeIn(fadeAnim), slideInUp(slideAnim)]).start();
      }
    } catch (err: any) {
      console.error("Error loading loans:", err);
      setError(err.message || "Failed to load loans");
      showError("Failed to load loans. Please try again.");
      haptics.notification("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: "products" | "applications") => {
    haptics.selection();
    setActiveTab(tab);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
  };

  const handleProductPress = (product: LoanProduct) => {
    haptics.impact("medium");
    navigation.navigate("LoanApplication", { product });
  };

  const handleApplicationPress = (application: LoanApplication) => {
    haptics.impact("light");
    navigation.navigate("LoanDetail", { application });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.success;
      case "rejected":
        return colors.error;
      case "pending":
        return colors.warning;
      default:
        return colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "pending":
        return "time";
      default:
        return "help-circle";
    }
  };

  const renderProduct = ({ item, index }: { item: LoanProduct; index: number }) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [index * 10, 50],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.productIcon}>
            <Ionicons name="cash-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.partnerName}>{item.partner_name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>

        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.productDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount Range</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.min_amount)} - {formatCurrency(item.max_amount)}
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

        <TouchableOpacity style={styles.applyButton} onPress={() => handleProductPress(item)}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderApplication = ({ item, index }: { item: LoanApplication; index: number }) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [index * 10, 50],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleApplicationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>

        <Text style={styles.productName}>{item.loan_products.name}</Text>
        <Text style={styles.partnerName}>{item.loan_products.partner_name}</Text>

        <View style={styles.applicationDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.requested_amount)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tenor</Text>
            <Text style={styles.detailValue}>{item.tenor_months} months</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Applied</Text>
            <Text style={styles.detailValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Loans</Text>
        </View>
        <View style={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Loans</Text>
        </View>
        <ErrorState title="Failed to load loans" message={error} onRetry={() => loadData()} />
      </SafeAreaView>
    );
  }

  const data = activeTab === "products" ? products : applications;
  const emptyMessage =
    activeTab === "products"
      ? "No loan products available"
      : "You haven't applied for any loans yet";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loans</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.activeTab]}
          onPress={() => handleTabChange("products")}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.activeTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "applications" && styles.activeTab]}
          onPress={() => handleTabChange("applications")}
        >
          <Text style={[styles.tabText, activeTab === "applications" && styles.activeTabText]}>
            My Applications
          </Text>
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [
                {
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200], // Adjust based on screen width
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <PullToRefresh refreshing={refreshing} onRefresh={() => loadData(true)}>
        {data.length === 0 ? (
          <EmptyState
            icon={activeTab === "products" ? "document-text-outline" : "folder-open-outline"}
            title={emptyMessage}
            message={
              activeTab === "products"
                ? "Check back later for new loan products"
                : "Browse available products and apply for a loan"
            }
            actionLabel={activeTab === "applications" ? "Browse Products" : undefined}
            onAction={activeTab === "applications" ? () => handleTabChange("products") : undefined}
          />
        ) : (
          <FlatList
            data={data}
            renderItem={activeTab === "products" ? renderProduct : renderApplication}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </PullToRefresh>

      {toast && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, toast.type === "error" && styles.toastError]}>
            <Ionicons
              name={toast.type === "error" ? "alert-circle" : "checkmark-circle"}
              size={20}
              color={colors.white}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
            <TouchableOpacity onPress={hideToast} style={{ padding: spacing.xs }}>
              <Ionicons name="close" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  activeTab: {},
  tabText: { fontSize: typography.body, color: colors.gray500, fontWeight: "600" },
  activeTabText: { color: colors.primary },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "50%",
    height: 3,
    backgroundColor: colors.primary,
  },
  content: { flex: 1, padding: spacing.lg },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: { padding: spacing.lg },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  cardHeaderText: { flex: 1 },
  productName: {
    fontSize: typography.h4,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs / 2,
  },
  partnerName: { fontSize: typography.small, color: colors.gray500 },
  productDescription: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  productDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  applicationDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: { marginBottom: spacing.sm },
  detailLabel: { fontSize: typography.small, color: colors.gray500, marginBottom: spacing.xs / 2 },
  detailValue: { fontSize: typography.body, fontWeight: "600", color: colors.gray900 },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    marginRight: "auto",
  },
  statusText: {
    fontSize: typography.small,
    fontWeight: "600",
    marginLeft: spacing.xs / 2,
  },
  toastContainer: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastError: { backgroundColor: colors.error },
  toastText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
});
