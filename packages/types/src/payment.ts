/**
 * Payment and transaction types for mobile money integration
 */

export type PaymentProvider = 'MTN' | 'Airtel' | 'Tigo' | 'BK' | 'Cash';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'transfer' 
  | 'loan_repayment' 
  | 'savings' 
  | 'ikimina_contribution'
  | 'fee';

export interface Payment {
  id: string;
  user_id: string;
  transaction_id?: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  reference: string;
  sender_phone: string;
  receiver_phone?: string;
  status: PaymentStatus;
  parsed_at?: string;
  sms_timestamp?: string;
  sms_body?: string;
  created_at: string;
  updated_at: string;
  metadata?: PaymentMetadata;
}

export interface PaymentMetadata {
  openai_request_id?: string;
  parsing_confidence?: number;
  manual_review_required?: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
}

export interface ParsedSMS {
  provider: PaymentProvider;
  amount: number;
  sender: string;
  reference: string;
  timestamp: string;
  raw_sms: string;
  confidence: number;
  transaction_type?: string;
}

export interface UnmatchedPayment {
  id: string;
  sms_body: string;
  parsed_data?: ParsedSMS;
  status: 'pending_review' | 'matched' | 'rejected' | 'duplicate';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  description?: string;
  payment_id?: string;
  from_account_id?: string;
  to_account_id?: string;
  balance_before?: number;
  balance_after?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface MobileMoneyPaymentRequest {
  phone_number: string;
  amount: number;
  provider: PaymentProvider;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentAllocationResult {
  matched: boolean;
  payment?: Payment;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  transaction?: Transaction;
  message: string;
}

export interface SMSParsingLog {
  id: string;
  device_id: string;
  sms_body: string;
  openai_request: Record<string, any>;
  openai_response: Record<string, any>;
  parsed_data?: ParsedSMS;
  success: boolean;
  error_message?: string;
  processing_time_ms: number;
  created_at: string;
}
