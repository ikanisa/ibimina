import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors, spacing, typography, borderRadius } from "../../theme";
import { groupService } from "../../services/supabase";
import { useAppStore } from "../../store";
import { CardSkeleton, EmptyState, ErrorState, PullToRefresh } from "../../components/ui";
import { haptics } from "../../utils/haptics";
import { fadeIn, slideInUp } from "../../utils/animations";
import { formatCurrency } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  total_balance: number;
  my_balance: number;
  next_meeting_date?: string;
  status: "active" | "inactive";
}

export function GroupsScreen({ navigation }: any) {
  const { user } = useAppStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, hideToast, error: showError, success } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
      haptics.impact("light");
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await groupService.getUserGroups(user.id);
      setGroups(data || []);

      // Animate entrance
      if (!isRefresh) {
        Animated.parallel([fadeIn(fadeAnim), slideInUp(slideAnim)]).start();
      }
    } catch (err: any) {
      console.error("Error loading groups:", err);
      setError(err.message || "Failed to load groups");
      showError("Failed to load groups. Please try again.");
      haptics.notification("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGroupPress = (group: Group) => {
    haptics.impact("medium");
    navigation.navigate("GroupDetail", { groupId: group.id });
  };

  const handleContribute = (group: Group) => {
    haptics.impact("medium");
    navigation.navigate("GroupContribution", { groupId: group.id });
  };

  const renderGroup = ({ item, index }: { item: Group; index: number }) => (
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
        onPress={() => handleGroupPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.groupIcon}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.memberCount}>
              <Ionicons name="person" size={12} color={colors.gray500} />
              <Text style={styles.memberCountText}>{item.member_count} members</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, item.status === "active" && styles.statusActive]}>
            <Text style={[styles.statusText, item.status === "active" && styles.statusTextActive]}>
              {item.status}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.groupDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>My Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(item.my_balance)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Group Total</Text>
            <Text style={styles.balanceValue}>{formatCurrency(item.total_balance)}</Text>
          </View>
        </View>

        {item.next_meeting_date && (
          <View style={styles.meetingInfo}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.meetingText}>
              Next meeting: {new Date(item.next_meeting_date).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.contributeButton} onPress={() => handleContribute(item)}>
            <Ionicons name="add-circle" size={16} color={colors.white} />
            <Text style={styles.contributeButtonText}>Contribute</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton} onPress={() => handleGroupPress(item)}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Groups</Text>
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
          <Text style={styles.title}>My Groups</Text>
        </View>
        <ErrorState title="Failed to load groups" message={error} onRetry={() => loadGroups()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Groups</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            haptics.impact("medium");
            showError("Contact your SACCO to join a group");
          }}
        >
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <PullToRefresh refreshing={refreshing} onRefresh={() => loadGroups(true)}>
        {groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No groups yet"
            message="Join a savings group (ikimina) to start saving together with your community"
            actionLabel="Contact SACCO"
            onAction={() => navigation.navigate("Help")}
          />
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroup}
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
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  cardHeaderText: { flex: 1 },
  groupName: {
    fontSize: typography.h4,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs / 2,
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberCountText: {
    fontSize: typography.small,
    color: colors.gray500,
    marginLeft: spacing.xs / 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  statusActive: {
    backgroundColor: colors.success + "20",
  },
  statusText: {
    fontSize: typography.small,
    fontWeight: "600",
    color: colors.gray500,
    textTransform: "capitalize",
  },
  statusTextActive: {
    color: colors.success,
  },
  groupDescription: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  balanceContainer: {
    flexDirection: "row",
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  balanceDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  balanceLabel: {
    fontSize: typography.small,
    color: colors.gray500,
    marginBottom: spacing.xs / 2,
  },
  balanceValue: {
    fontSize: typography.h4,
    fontWeight: "700",
    color: colors.gray900,
  },
  meetingInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  meetingText: {
    fontSize: typography.small,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  contributeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  contributeButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  viewButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "600",
    marginRight: spacing.xs,
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
