// TapMoMo NFC Payment API Contracts
import type { Result } from '@ibimina/shared-types';

/**
 * NFC Payload structure for TapMoMo payment handoff
 */
export interface NFCPayload {
  version: string;
  merchant_id: string;
  network: 'MTN' | 'AIRTEL';
  amount: number;
  reference?: string;
  timestamp: number;
  nonce: string;
  signature: string;
}

/**
 * Request to validate NFC payload
 */
export interface ValidateNFCPayloadRequest {
  payload: NFCPayload;
  expected_merchant?: string;
}

/**
 * Response from NFC payload validation
 */
export interface ValidateNFCPayloadResponse {
  valid: boolean;
  reasons?: string[];
  expired?: boolean;
  replay_detected?: boolean;
  signature_valid?: boolean;
}

/**
 * USSD payment initiation request
 */
export interface InitiateUSSDPaymentRequest {
  payload: NFCPayload;
  sim_index?: number; // For dual-SIM devices
}

/**
 * USSD payment initiation response
 */
export interface InitiateUSSDPaymentResponse {
  success: boolean;
  ussd_code: string;
  fallback_method?: 'dialer' | 'copy';
  message?: string;
}

/**
 * Payment status query
 */
export interface PaymentStatusRequest {
  nonce: string;
  merchant_id: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  status: 'pending' | 'success' | 'failed' | 'expired';
  amount?: number;
  reference?: string;
  timestamp?: number;
  error?: string;
}

/**
 * Create NFC payload for merchant (Get Paid mode)
 */
export interface CreateNFCPayloadRequest {
  merchant_id: string;
  network: 'MTN' | 'AIRTEL';
  amount: number;
  reference?: string;
}

/**
 * Response with signed NFC payload
 */
export interface CreateNFCPayloadResponse extends Result<NFCPayload> {
  expires_in_seconds: number;
}
