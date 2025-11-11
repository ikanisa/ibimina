import { registerPlugin } from "@capacitor/core";

export interface UssdDialerPlugin {
  /**
   * Check if device has dual SIM capability
   */
  hasDualSim(): Promise<{ hasDualSim: boolean; simCount: number }>;

  /**
   * Get list of active SIM cards
   */
  getSimList(): Promise<{
    simCards: SimCard[];
    count: number;
  }>;

  /**
   * Dial USSD code
   * @param options.ussdCode - USSD code to dial (e.g., "*182*1*1#")
   * @param options.subscriptionId - Optional SIM subscription ID for dual SIM devices
   */
  dialUssd(options: {
    ussdCode: string;
    subscriptionId?: number;
  }): Promise<{
    success: boolean;
    method: "programmatic" | "dialer_intent";
    response?: string;
    message?: string;
  }>;

  /**
   * Request CALL_PHONE permission
   */
  requestCallPermission(): Promise<{ granted: boolean }>;

  /**
   * Request READ_PHONE_STATE permission
   */
  requestPhoneStatePermission(): Promise<{ granted: boolean }>;
}

export interface SimCard {
  subscriptionId: number;
  slotIndex: number;
  displayName: string;
  carrierName: string;
  countryIso: string;
  phoneNumber?: string;
}

const UssdDialer = registerPlugin<UssdDialerPlugin>("UssdDialer");

export default UssdDialer;
