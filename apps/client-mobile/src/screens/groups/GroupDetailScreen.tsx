import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../services/supabase';
import { useStore } from '../../store';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  balance: number;
  user: {
    full_name: string;
    phone_number: string;
  };
}

interface Contribution {
  id: string;
  amount: number;
  created_at: string;
  user: {
    full_name: string;
  };
}

export function GroupDetailScreen({ navigation, route }: any) {
  const { groupId } = route.params;
  const { user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      // Load group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          balance,
          user:users(full_name, phone_number)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Load recent contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('group_contributions')
        .select(`
          id,
          amount,
          created_at,
          user:users(full_name)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);
    } catch (error: any) {
      console.error('Load group error:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleContribute = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to contribute');
      navigation.navigate('WhatsAppAuth');
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    // Check if user is a member
    const isMember = members.some((m) => m.user_id === user.id);
    if (!isMember) {
      Alert.alert('Not a Member', 'You must be a group member to contribute');
      return;
    }

    setSubmitting(true);
    try {
      // Call Supabase Edge Function to process contribution
      const { data, error } = await supabase.functions.invoke('group-contribute', {
        body: {
          groupId,
          amount,
        },
      });

      if (error) throw error;

      Alert.alert(
        'Contribution Successful',
        `You have contributed ${amount.toLocaleString()} RWF to ${group.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowContributeModal(false);
              setContributionAmount('');
              loadGroupData();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Contribute error:', error);
      Alert.alert('Error', error.message || 'Failed to process contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Group Header */}
        <Card style={styles.headerCard}>
          <Text style={styles.groupName}>{group?.name}</Text>
          <Text style={styles.groupDescription}>{group?.description}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {group?.total_balance?.toLocaleString() || '0'} RWF
              </Text>
              <Text style={styles.statLabel}>Total Balance</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {group?.contribution_frequency || 'Monthly'}
              </Text>
              <Text style={styles.statLabel}>Frequency</Text>
            </View>
          </View>
        </Card>

        {/* Contribute Button */}
        <Button
          title="Make Contribution"
          onPress={() => setShowContributeModal(true)}
          style={styles.contributeButton}
        />

        {/* Contribution Modal */}
        {showContributeModal && (
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Make Contribution</Text>
            
            <Text style={styles.label}>Amount (RWF)</Text>
            <TextInput
              placeholder="Enter amount"
              value={contributionAmount}
              onChangeText={setContributionAmount}
              keyboardType="numeric"
            />

            <View style={styles.quickAmounts}>
              {[5000, 10000, 20000, 50000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickAmount}
                  onPress={() => setContributionAmount(amt.toString())}
                >
                  <Text style={styles.quickAmountText}>
                    {(amt / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowContributeModal(false);
                  setContributionAmount('');
                }}
                variant="outline"
                style={styles.halfButton}
              />
              <Button
                title="Contribute"
                onPress={handleContribute}
                loading={submitting}
                disabled={!contributionAmount}
                style={styles.halfButton}
              />
            </View>
          </Card>
        )}

        {/* Members */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Members</Text>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {member.user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.user.full_name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <Text style={styles.memberBalance}>
                {member.balance?.toLocaleString() || '0'} RWF
              </Text>
            </View>
          ))}
        </Card>

        {/* Recent Contributions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Contributions</Text>
          {contributions.length === 0 ? (
            <Text style={styles.emptyText}>No contributions yet</Text>
          ) : (
            contributions.map((contribution) => (
              <View key={contribution.id} style={styles.contributionRow}>
                <View style={styles.contributionInfo}>
                  <Text style={styles.contributionUser}>
                    {contribution.user.full_name}
                  </Text>
                  <Text style={styles.contributionDate}>
                    {new Date(contribution.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.contributionAmount}>
                  +{contribution.amount.toLocaleString()} RWF
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  headerCard: {
    marginBottom: spacing.lg,
  },
  groupName: {
    fontSize: typography.h2,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  groupDescription: {
    fontSize: typography.body,
    color: colors.gray600,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.primary600,
  },
  statLabel: {
    fontSize: typography.small,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  contributeButton: {
    marginBottom: spacing.lg,
  },
  modalCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary50,
    borderColor: colors.primary200,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  quickAmount: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  quickAmountText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray700,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInitial: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: colors.primary600,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray900,
  },
  memberRole: {
    fontSize: typography.small,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  memberBalance: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primary600,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  contributionInfo: {
    flex: 1,
  },
  contributionUser: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray900,
  },
  contributionDate: {
    fontSize: typography.small,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  contributionAmount: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.success600,
  },
  emptyText: {
    fontSize: typography.body,
    color: colors.gray500,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
