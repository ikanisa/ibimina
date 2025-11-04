import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../store";
import { accountService } from "../../services/supabase";
import { AccountCard } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography } from "../../theme";

export function AccountsScreen({ navigation }: any) {
  const { user, accounts, setAccounts, setSelectedAccount } = useAppStore();
  const [loading, setLoading] = useState(false);

  const loadAccounts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await accountService.getAccounts(user.id);
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const handleAccountPress = (account: any) => {
    setSelectedAccount(account);
    navigation.navigate("TransactionHistory", { accountId: account.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Accounts</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAccounts} />}
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No accounts found</Text>
            <Button
              title="Contact Support"
              onPress={() => {}}
              variant="outline"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          accounts.map((account: any) => (
            <AccountCard
              key={account.id}
              account={account}
              onPress={() => handleAccountPress(account)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { padding: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.white },
  title: { fontSize: typography.h2, fontWeight: "700", color: colors.gray900 },
  scrollContent: { padding: spacing.lg },
  emptyState: { alignItems: "center", paddingTop: spacing.xxl * 2 },
  emptyText: { fontSize: typography.body, color: colors.gray500 },
});
