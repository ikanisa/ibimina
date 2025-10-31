/**
 * Feature Flag Types
 *
 * Regulatory tier-based feature toggle matrix for African fintech supa app
 */

export type RegulatoryTier = "P0" | "P1" | "P2";

export type FeatureDomain = "savings" | "loans" | "wallet" | "tokens" | "nfc" | "kyc" | "ai_agent";

export interface FeatureConfig {
  [key: string]: boolean;
}

export interface DomainFeatureConfig {
  enabled: boolean;
  tier: RegulatoryTier;
  features: FeatureConfig;
}

export interface ClientFeatureMatrix {
  savings: DomainFeatureConfig;
  loans: DomainFeatureConfig;
  wallet: DomainFeatureConfig;
  tokens: DomainFeatureConfig;
  nfc: DomainFeatureConfig;
  kyc: DomainFeatureConfig;
  ai_agent: DomainFeatureConfig;
}

export interface OrgFeatureOverride {
  id: string;
  org_id: string;
  feature_domain: FeatureDomain;
  tier: RegulatoryTier;
  enabled: boolean;
  feature_config: FeatureConfig;
  partner_agreement_ref: string | null;
  risk_signoff_by: string | null;
  risk_signoff_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * AI Agent Types
 */

export type TicketChannel = "in_app" | "whatsapp" | "email" | "ivr";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketSender = "user" | "agent" | "staff";

export interface Ticket {
  id: string;
  org_id: string;
  user_id: string | null;
  channel: TicketChannel;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  meta: {
    reference_token?: string;
    group_id?: string;
    whatsapp_number?: string;
    [key: string]: unknown;
  };
  assigned_to: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: TicketSender;
  content: string;
  attachments: Array<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>;
  metadata: {
    tool_calls?: unknown[];
    confidence_score?: number;
    citations?: string[];
    [key: string]: unknown;
  };
  created_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  org_id?: string;
  title: string;
  content: string;
  tags: string[];
  policy_tag: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  org_id: string | null;
  question: string;
  answer: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Loan Application Types
 */

export type LoanApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "DECLINED"
  | "DISBURSED"
  | "CANCELLED";

export interface LoanProduct {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  partner_name: string | null;
  partner_logo_url: string | null;
  min_amount: number;
  max_amount: number;
  min_tenor_months: number;
  max_tenor_months: number;
  interest_rate: number | null;
  interest_rate_description: string | null;
  required_documents: string[];
  eligibility_criteria: string | null;
  terms_url: string | null;
  enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LoanApplication {
  id: string;
  org_id: string;
  group_member_id: string | null;
  user_id: string | null;
  product_id: string;
  requested_amount: number;
  tenor_months: number;
  purpose: string | null;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  applicant_nid: string | null;
  documents: Array<{
    type: string;
    url: string;
    uploaded_at: string;
  }>;
  status: LoanApplicationStatus;
  status_updated_at: string;
  affordability_score: number | null;
  credit_check_result: unknown | null;
  partner_reference: string | null;
  partner_callback_url: string | null;
  partner_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approval_notes: string | null;
  decline_reason: string | null;
  disbursed_amount: number | null;
  disbursed_at: string | null;
  disbursement_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanApplicationStatusHistory {
  id: string;
  application_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Wallet and Token Types
 */

export type TokenType = "VOUCHER" | "LOYALTY_POINT" | "ATTENDANCE_CREDIT" | "CLOSED_LOOP_TOKEN";
export type TokenStatus = "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELLED";
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "PAYMENT"
  | "VOUCHER_REDEMPTION";
export type EvidenceType = "SMS" | "EMAIL" | "API_CALLBACK" | "MANUAL_UPLOAD" | "ALLOCATION";

export interface WalletToken {
  id: string;
  org_id: string;
  user_id: string;
  token_type: TokenType;
  token_code: string;
  token_signature: string;
  display_name: string;
  description: string | null;
  value_amount: number | null;
  value_currency: string;
  issued_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
  redeemed_location: string | null;
  status: TokenStatus;
  redemption_reference: string | null;
  redemption_notes: string | null;
  redemption_metadata: {
    [key: string]: unknown;
  };
  nfc_enabled: boolean;
  nfc_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionEvidence {
  id: string;
  org_id: string;
  user_id: string;
  external_reference: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  from_party: string | null;
  to_party: string | null;
  evidence_type: EvidenceType;
  evidence_url: string | null;
  evidence_metadata: {
    [key: string]: unknown;
  };
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  transaction_timestamp: string;
  created_at: string;
  updated_at: string;
}

export type StablecoinDirection = "ON_RAMP" | "OFF_RAMP" | "TRANSFER";
export type StablecoinStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED";

export interface StablecoinTransfer {
  id: string;
  org_id: string;
  user_id: string;
  direction: StablecoinDirection;
  chain: string;
  token_address: string;
  token_symbol: string;
  amount: string; // String for high precision
  transaction_hash: string | null;
  block_number: number | null;
  from_address: string | null;
  to_address: string | null;
  partner_name: string | null;
  partner_reference: string | null;
  partner_fee: number | null;
  fiat_amount: number | null;
  fiat_currency: string;
  exchange_rate: number | null;
  status: StablecoinStatus;
  status_updated_at: string;
  kyc_verified: boolean;
  kyc_level: string | null;
  aml_check_passed: boolean | null;
  risk_score: number | null;
  risk_notes: string | null;
  initiated_at: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * NFC Types
 */

export type NFCTagType = "NDEF" | "HCE" | "CARD_EMULATION";
export type NFCTagStatus = "ACTIVE" | "INACTIVE" | "LOST" | "REPLACED";
export type NFCEventType = "READ" | "WRITE" | "REDEEM" | "VERIFY";

export interface NFCTag {
  id: string;
  org_id: string;
  group_id: string | null;
  group_member_id: string | null;
  tag_uid: string | null;
  tag_type: NFCTagType;
  ndef_message: string;
  ndef_format: string;
  display_name: string;
  description: string | null;
  status: NFCTagStatus;
  issued_at: string;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
  locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NFCTapEvent {
  id: string;
  tag_id: string | null;
  user_id: string | null;
  event_type: NFCEventType;
  tag_uid: string | null;
  device_info: {
    user_agent?: string;
    device_model?: string;
    os_version?: string;
    [key: string]: unknown;
  };
  location_name: string | null;
  location_coordinates: {
    lat: number;
    lng: number;
  } | null;
  success: boolean;
  error_message: string | null;
  event_timestamp: string;
  created_at: string;
}
