import { registerPlugin } from "@capacitor/core";

export interface NfcReaderPlugin {
  /**
   * Check if NFC is available on this device
   */
  isAvailable(): Promise<{ available: boolean }>;

  /**
   * Check if NFC is currently enabled
   */
  isEnabled(): Promise<{ enabled: boolean }>;

  /**
   * Start NFC reader mode to detect tags
   */
  startReaderMode(): Promise<{ started: boolean }>;

  /**
   * Stop NFC reader mode
   */
  stopReaderMode(): Promise<{ stopped: boolean }>;

  /**
   * Write NDEF URI to a tag (when tag is detected)
   */
  writeNdefUri(options: { uri: string }): Promise<{ success: boolean }>;
}

export interface NfcTagPayload {
  tagId: string;
  techList: string[];
  type: "ndef" | "isodep_hce" | "unknown";
  uri?: string;
  payload?: {
    network?: string;
    merchant_msisdn?: string;
    merchant_code?: string;
    amount?: number;
    currency?: string;
    ref?: string;
    nonce?: string;
    timestamp?: number;
    signature?: string;
    expires_at?: number;
    valid?: boolean;
    error?: string;
    message?: string;
  };
  error?: string;
}

const NfcReader = registerPlugin<NfcReaderPlugin>("NfcReader");

export default NfcReader;
