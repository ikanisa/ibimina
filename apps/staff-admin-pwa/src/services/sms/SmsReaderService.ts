import { Capacitor, registerPlugin } from '@capacitor/core';

export interface SmsMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
  type: number; // 1=inbox, 2=sent
}

export interface SmsReaderPlugin {
  requestPermissions(): Promise<{ granted: boolean; message?: string }>;
  readSms(options: { sender?: string; limit?: number; since?: number }): Promise<{ messages: SmsMessage[]; count: number }>;
  checkPermissions(): Promise<{ granted: boolean; readSms: boolean; receiveSms: boolean }>;
}

const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReader');

export class SmsReaderService {
  // Mobile money providers in Rwanda
  private static PAYMENT_SENDERS = [
    'MTN',
    'AIRTEL', 
    'TIGO',
    'MoMo',
    'MOBILE MONEY',
    '*182#', // MTN shortcode
    '*500#', // Airtel shortcode
  ];
  
  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      console.warn('SMS reading only available on Android');
      return false;
    }

    try {
      const result = await SmsReader.requestPermissions();
      return result.granted;
    } catch (error) {
      console.error('SMS permission denied:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<{ granted: boolean; readSms: boolean; receiveSms: boolean }> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: false, readSms: false, receiveSms: false };
    }

    try {
      return await SmsReader.checkPermissions();
    } catch (error) {
      console.error('Failed to check SMS permissions:', error);
      return { granted: false, readSms: false, receiveSms: false };
    }
  }

  async readPaymentSms(options: { limit?: number; since?: number } = {}): Promise<SmsMessage[]> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('SMS reading only available on native platforms');
      return [];
    }

    const allMessages: SmsMessage[] = [];

    // Read from all payment providers
    for (const sender of SmsReaderService.PAYMENT_SENDERS) {
      try {
        const result = await SmsReader.readSms({
          sender,
          limit: options.limit || 100,
          since: options.since || 0,
        });

        allMessages.push(...result.messages);
      } catch (error) {
        console.error(`Failed to read SMS from ${sender}:`, error);
      }
    }

    // Deduplicate by ID
    const uniqueMessages = Array.from(
      new Map(allMessages.map(msg => [msg.id, msg])).values()
    );

    // Sort by timestamp descending (newest first)
    return uniqueMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  async readLatestPaymentSms(sinceDays: number = 7): Promise<SmsMessage[]> {
    const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
    return this.readPaymentSms({ since, limit: 500 });
  }

  async readAllSms(options: { limit?: number; since?: number } = {}): Promise<SmsMessage[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    try {
      const result = await SmsReader.readSms({
        limit: options.limit || 100,
        since: options.since || 0,
      });

      return result.messages;
    } catch (error) {
      console.error('Failed to read SMS:', error);
      return [];
    }
  }

  /**
   * Filter payment-related SMS from a list
   */
  filterPaymentSms(messages: SmsMessage[]): SmsMessage[] {
    const paymentKeywords = [
      'received',
      'sent',
      'payment',
      'transfer',
      'balance',
      'RWF',
      'FRW',
      'ref',
      'transaction',
      'txn',
      'mobile money',
      'momo',
    ];

    return messages.filter(msg => {
      const text = (msg.sender + ' ' + msg.body).toLowerCase();
      
      // Check if it's from known provider
      const isFromProvider = SmsReaderService.PAYMENT_SENDERS.some(
        provider => text.includes(provider.toLowerCase())
      );

      // Check if it contains payment keywords
      const hasPaymentKeywords = paymentKeywords.some(
        keyword => text.includes(keyword)
      );

      // Check if it contains amount pattern (digits + RWF/FRW)
      const hasAmountPattern = /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:RWF|FRW)/i.test(text);

      return isFromProvider || (hasPaymentKeywords && hasAmountPattern);
    });
  }
}

export const smsReaderService = new SmsReaderService();
