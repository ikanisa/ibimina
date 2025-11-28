/**
 * Shared Types for AI Services
 */

// ============================================
// Document Intelligence Types
// ============================================

export type DocumentType = 'receipt' | 'id_card' | 'bank_statement' | 'contract' | 'unknown';

export interface DocumentAnalysisResult {
  type: DocumentType;
  confidence: number;
  extractedData: Record<string, unknown>;
  suggestions: string[];
  warnings: string[];
}

export interface ReceiptData {
  merchantName: string;
  transactionId: string;
  amount: number;
  currency: string;
  date: string;
  payerPhone: string;
  payerName?: string;
  reference?: string;
}

export interface IDCardData {
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  district: string;
  sector: string;
  cell: string;
  issueDate?: string;
  expiryDate?: string;
  isValid: boolean;
  warnings: string[];
}

export interface BankStatementData {
  accountHolder: string;
  accountNumber: string;
  statementPeriod: {
    start: string;
    end: string;
  };
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    balance?: number;
  }>;
}

// ============================================
// Fraud Detection Types
// ============================================

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FraudType =
  | 'duplicate_payment'
  | 'unusual_amount'
  | 'velocity_anomaly'
  | 'phone_mismatch'
  | 'timing_anomaly'
  | 'pattern_deviation'
  | 'identity_mismatch'
  | 'suspicious_reference';

export interface FraudAlert {
  id: string;
  transactionId: string;
  severity: FraudSeverity;
  type: FraudType;
  description: string;
  confidence: number;
  suggestedAction: string;
  relatedTransactions: string[];
  metadata?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  amount: number;
  payerPhone: string;
  payerName: string;
  timestamp: Date;
  ikiminaId: string;
  memberId?: string;
  reference?: string;
}

export interface MemberFraudProfile {
  id: string;
  memberId: string;
  typicalAmount: {
    min: number;
    max: number;
    average: number;
  };
  paymentFrequency: number;
  preferredPaymentDays: number[];
  usualPaymentHours: {
    start: number;
    end: number;
  };
  knownPhoneNumbers: string[];
  riskScore: number;
  transactionCount: number;
  lastTransactionAt?: Date;
  lastUpdated: Date;
}

// ============================================
// Voice Command Types
// ============================================

export type VoiceCommandCategory = 'navigation' | 'action' | 'query' | 'ai';

export interface VoiceCommand {
  patterns: string[];
  action: (params: Record<string, string>) => void | Promise<void>;
  description: string;
  category: VoiceCommandCategory;
  enabled?: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceCommandHistory {
  id: string;
  userId: string;
  transcript: string;
  commandMatched?: string;
  actionTaken?: string;
  confidence: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// ============================================
// Utility Types
// ============================================

export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
}

export interface BatchProcessingResult<T> {
  total: number;
  successful: number;
  failed: number;
  results: Map<string, ProcessingResult<T>>;
}

// ============================================
// Database Types (matching schema)
// ============================================

export interface DBDocumentScan {
  id: string;
  organization_id: string;
  country_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  document_type: DocumentType;
  confidence: number;
  extracted_data: Record<string, unknown>;
  suggestions: string[];
  warnings: string[];
  status: 'pending' | 'processing' | 'processed' | 'failed';
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface DBFraudAlert {
  id: string;
  organization_id: string;
  country_id: string;
  transaction_id?: string;
  severity: FraudSeverity;
  type: string;
  description: string;
  confidence: number;
  suggested_action: string;
  related_transactions: string[];
  status: 'pending' | 'reviewed' | 'dismissed' | 'escalated';
  reviewed_by?: string;
  reviewed_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DBMemberFraudProfile {
  id: string;
  member_id: string;
  typical_amount_min: number;
  typical_amount_max: number;
  typical_amount_avg: number;
  payment_frequency: number;
  preferred_payment_days: number[];
  usual_payment_hours: Record<string, unknown>;
  known_phone_numbers: string[];
  risk_score: number;
  transaction_count: number;
  last_transaction_at?: string;
  last_updated: string;
  created_at: string;
}

export interface DBVoiceCommandHistory {
  id: string;
  user_id: string;
  transcript: string;
  command_matched?: string;
  action_taken?: string;
  confidence: number;
  success: boolean;
  error_message?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
