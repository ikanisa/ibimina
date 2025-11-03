/**
 * Account and balance types
 */

export type AccountType = 'savings' | 'current' | 'loan' | 'ikimina' | 'shares';

export type AccountStatus = 'active' | 'dormant' | 'closed' | 'frozen';

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  account_type: AccountType;
  currency: string;
  balance: number;
  available_balance: number;
  status: AccountStatus;
  opened_at: string;
  closed_at?: string;
  interest_rate?: number;
  minimum_balance?: number;
  maximum_balance?: number;
  metadata?: Record<string, any>;
}

export interface AccountBalance {
  account_id: string;
  balance: number;
  available_balance: number;
  pending_debits: number;
  pending_credits: number;
  last_transaction_at?: string;
  as_of: string;
}

export interface AccountStatement {
  account: Account;
  period: {
    from: string;
    to: string;
  };
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  transactions: Transaction[];
  generated_at: string;
}

// Ikimina (Group Savings)
export interface Ikimina {
  id: string;
  name: string;
  description?: string;
  account_id: string;
  member_count: number;
  contribution_amount: number;
  contribution_frequency: 'daily' | 'weekly' | 'monthly';
  next_payout_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  rules?: {
    max_members?: number;
    minimum_contribution?: number;
    penalty_rate?: number;
    grace_period_days?: number;
  };
}

export interface IkiminaMember {
  id: string;
  ikimina_id: string;
  user_id: string;
  position: number; // Order in payout rotation
  joined_at: string;
  status: 'active' | 'inactive' | 'removed';
  total_contributions: number;
  payout_received_at?: string;
  payout_amount?: number;
}

export interface IkiminaContribution {
  id: string;
  ikimina_id: string;
  member_id: string;
  period: string; // YYYY-MM or YYYY-WW
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  payment_id?: string;
  due_date: string;
  paid_at?: string;
  late_fee?: number;
}

import type { Transaction } from './payment';
