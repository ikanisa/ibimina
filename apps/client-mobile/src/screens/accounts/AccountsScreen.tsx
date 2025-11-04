import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppStore } from "../../store";
import { accountService } from "../../services/supabase";
import {
  AccountCard,
  CardSkeleton,
  EmptyState,
  ErrorState,
  PullToRefresh,
} from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography, borderRadius } from "../../theme";
import { haptics } from "../../utils/haptics";
import { fadeIn, slideInUp } from "../../utils/animations";
import { useToast } from "../../hooks/useToast";

export function AccountsScreen({ navigation }: any) {
  const { user, accounts, setAccounts, setSelectedAccount } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, hideToast, error: showError } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const loadAccounts = async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
      haptics.impact("light");
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await accountService.getAccounts(user.id);
      setAccounts(data);

      // Animate entrance
      if (!isRefresh) {
        Animated.parallel([fadeIn(fadeAnim), slideInUp(slideAnim)]).start();
      }
    } catch (error: any) {
      console.error("Failed to load accounts:", error);
      setError(error.message || "Failed to load accounts");
      showError("Failed to load accounts. Please try again.");
      haptics.notification("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const handleAccountPress = (account: any) => {
    haptics.impact("light");
    setSelectedAccount(account);
    navigation.navigate("TransactionHistory", { accountId: account.id });
  };

  const handleRetry = () => {
    haptics.impact("medium");
    loadAccounts();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Accounts</Text>
        </View>
        <View style={styles.scrollContent}>
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
          <Text style={styles.title}>My Accounts</Text>
        </View>
        <ErrorState title="Failed to load accounts" message={error} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Accounts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            haptics.impact("medium");
            showError("Contact your SACCO to open a new account");
          }}
        >
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <PullToRefresh refreshing={refreshing} onRefresh={() => loadAccounts(true)}>
        {accounts.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No accounts yet"
            message="Contact your SACCO office to open your first account"
            actionLabel="Contact Support"
            onAction={() => navigation.navigate("Help")}
          />
        ) : (
          <Animated.View
            style={[
              styles.scrollContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {accounts.map((account: any, index: number) => (
              <Animated.View
                key={account.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [index * 10, 50],
                      }),
                    },
                  ],
                }}
              >
                <AccountCard account={account} onPress={() => handleAccountPress(account)} />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </PullToRefresh>

      {toast && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, toast.type === "error" && styles.toastError]}>
            <Ionicons
              name={toast.type === "error" ? "alert-circle" : "checkmark-circle"}
              size={20}
              color={colors.white}
              style={styles.toastIcon}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
            <TouchableOpacity onPress={hideToast} style={styles.toastClose}>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900 },
  addButton: { padding: spacing.xs },
  scrollContent: { padding: spacing.lg },
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
  toastIcon: { marginRight: spacing.sm },
  toastText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
  toastClose: { padding: spacing.xs },
});
