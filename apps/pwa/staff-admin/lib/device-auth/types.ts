/**
 * Type definitions for Device Authentication
 */

/**
 * Challenge data from QR code
 */
export interface ChallengeData {
  ver: number;
  session_id: string;
  origin: string;
  nonce: string;
  exp: number; // Unix timestamp in seconds
  aud: string;
}

/**
 * Signed message from device
 */
export interface SignedMessage {
  ver: number;
  user_id: string;
  device_id: string;
  session_id: string;
  origin: string;
  nonce: string;
  ts: number;
  scope: string[];
  alg: string;
}

/**
 * Registered device
 */
export interface RegisteredDevice {
  id: string;
  device_id: string;
  device_label: string;
  key_algorithm: string;
  device_info: {
    model: string;
    manufacturer: string;
    osVersion: string;
    appVersion: string;
  };
  integrity_status: string | null;
  created_at: string;
  last_used_at: string;
  revoked_at: string | null;
}

/**
 * Authentication event for audit
 */
export interface AuthEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  device_key_id: string | null;
  challenge_id: string | null;
  success: boolean;
  failure_reason: string | null;
  metadata: any;
  created_at: string;
}
