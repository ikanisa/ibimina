import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';

type BrowseModeScreenNavigationProp = NativeStackNavigationProp<any>;

const DEMO_FEATURES = [
  {
    id: '1',
    icon: 'wallet-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Savings Accounts',
    description: 'Manage multiple savings accounts with competitive interest rates',
    color: theme.colors.primary,
  },
  {
    id: '2',
    icon: 'send-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Quick Transfers',
    description: 'Send money to members or withdraw to Mobile Money instantly',
    color: theme.colors.success,
  },
  {
    id: '3',
    icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Group Savings',
    description: 'Join Ikimina groups and save together with your community',
    color: theme.colors.warning,
  },
  {
    id: '4',
    icon: 'cash-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Affordable Loans',
    description: 'Access loans with flexible terms and competitive interest rates',
    color: theme.colors.error,
  },
  {
    id: '5',
    icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Secure & Safe',
    description: 'Your money is protected with bank-level security',
    color: theme.colors.primary,
  },
  {
    id: '6',
    icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Real-time Updates',
    description: 'Get instant notifications for all your transactions',
    color: theme.colors.success,
  },
];

const DEMO_TRANSACTIONS = [
  {
    id: '1',
    type: 'deposit',
    amount: 50000,
    description: 'Mobile Money Deposit',
    date: '2025-01-03',
    status: 'completed',
  },
  {
    id: '2',
    type: 'transfer',
    amount: -15000,
    description: 'Transfer to Jean Paul',
    date: '2025-01-02',
    status: 'completed',
  },
  {
    id: '3',
    type: 'deposit',
    amount: 100000,
    description: 'Salary Deposit',
    date: '2025-01-01',
    status: 'completed',
  },
];

export const BrowseModeScreen: React.FC = () => {
  const navigation = useNavigation<BrowseModeScreenNavigationProp>();

  const handleSignIn = () => {
    navigation.navigate('WhatsAppAuth');
  };

  const handleTryAction = () => {
    Alert.alert(
      'Sign in required',
      'To access this feature, please sign in with your WhatsApp number',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: handleSignIn },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('en-RW')} RWF`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome! 👋</Text>
            <Text style={styles.subtitle}>Explore what we offer</Text>
          </View>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Balance Card */}
        <TouchableOpacity 
          style={styles.balanceCard} 
          onPress={handleTryAction}
          activeOpacity={0.9}
        >
          <Text style={styles.balanceLabel}>Demo Account Balance</Text>
          <Text style={styles.balanceAmount}>350,000 RWF</Text>
          <Text style={styles.balanceNote}>Sign in to see your real balance</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleTryAction}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="add" size={24} color={theme.colors.success} />
              </View>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleTryAction}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.error + '20' }]}>
                <Ionicons name="remove" size={24} color={theme.colors.error} />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleTryAction}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>Transfer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleTryAction}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="cash" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.actionText}>Loan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {DEMO_FEATURES.map((feature) => (
              <TouchableOpacity 
                key={feature.id} 
                style={styles.featureCard}
                onPress={handleTryAction}
                activeOpacity={0.8}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <Ionicons name={feature.icon} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sample Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Transactions</Text>
          {DEMO_TRANSACTIONS.map((txn) => (
            <TouchableOpacity 
              key={txn.id} 
              style={styles.transactionCard}
              onPress={handleTryAction}
            >
              <View style={[
                styles.transactionIcon,
                { backgroundColor: txn.amount > 0 ? theme.colors.success + '20' : theme.colors.error + '20' }
              ]}>
                <Ionicons 
                  name={txn.amount > 0 ? 'arrow-down' : 'arrow-up'} 
                  size={20} 
                  color={txn.amount > 0 ? theme.colors.success : theme.colors.error} 
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>{txn.description}</Text>
                <Text style={styles.transactionDate}>{txn.date}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: txn.amount > 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {formatCurrency(txn.amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Call to Action */}
        <TouchableOpacity style={styles.ctaCard} onPress={handleSignIn} activeOpacity={0.9}>
          <Ionicons name="lock-open-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaDescription}>
            Sign in with WhatsApp to access all features and manage your SACCO account
          </Text>
          <View style={styles.ctaButton}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.ctaButtonText}>Sign in with WhatsApp</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.gray[900],
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginTop: 2,
  },
  signInButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  signInText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
  },
  balanceNote: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gray[900],
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gray[900],
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: 13,
    color: theme.colors.gray[600],
    lineHeight: 18,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.gray[900],
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: theme.colors.gray[500],
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaCard: {
    backgroundColor: '#fff',
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gray[900],
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  ctaDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
