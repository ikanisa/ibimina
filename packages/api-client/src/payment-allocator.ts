/**
 * Payment allocation service
 * 
 * Handles matching parsed SMS payments to users and transactions
 */

import type {
  ParsedSMS,
  Payment,
  PaymentAllocationResult,
  Transaction,
  User,
} from '@ibimina/types';
import { getSupabaseAdmin } from './supabase';

export class PaymentAllocator {
  /**
   * Allocate parsed SMS payment to user account
   */
  async allocate(parsedSMS: ParsedSMS): Promise<PaymentAllocationResult> {
    const supabase = getSupabaseAdmin();

    try {
      // 1. Find user by phone number
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, phone, email')
        .eq('phone', parsedSMS.sender)
        .single();

      if (userError || !user) {
        // Create unmatched payment for manual review
        await this.createUnmatchedPayment(parsedSMS);
        return {
          matched: false,
          message: `No user found with phone ${parsedSMS.sender}`,
        };
      }

      // 2. Check for pending transactions
      const { data: pendingTxn } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('amount', parsedSMS.amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 3. Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          transaction_id: pendingTxn?.id || null,
          provider: parsedSMS.provider,
          amount: parsedSMS.amount,
          reference: parsedSMS.reference,
          sender_phone: parsedSMS.sender,
          status: pendingTxn ? 'approved' : 'pending_approval',
          parsed_at: new Date().toISOString(),
          sms_timestamp: parsedSMS.timestamp,
          sms_body: parsedSMS.raw_sms,
        })
        .select()
        .single();

      if (paymentError || !payment) {
        throw new Error(`Failed to create payment: ${paymentError?.message}`);
      }

      // 4. Auto-approve if matched to pending transaction
      let transaction = pendingTxn;
      if (pendingTxn) {
        const { data: updatedTxn } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            payment_id: payment.id,
            completed_at: new Date().toISOString(),
          })
          .eq('id', pendingTxn.id)
          .select()
          .single();

        transaction = updatedTxn || pendingTxn;
      }

      // 5. Send notification
      await this.sendPaymentNotification(user.id, payment, pendingTxn !== null);

      return {
        matched: true,
        payment: payment as unknown as Payment,
        user: user as unknown as User,
        transaction: transaction as unknown as Transaction | undefined,
        message: pendingTxn
          ? `Payment approved and matched to transaction ${pendingTxn.reference}`
          : `Payment received but no matching transaction. Requires approval.`,
      };
    } catch (error) {
      console.error('Payment allocation error:', error);
      throw error;
    }
  }

  /**
   * Create unmatched payment for manual review
   */
  private async createUnmatchedPayment(parsedSMS: ParsedSMS): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from('unmatched_payments').insert({
      sms_body: parsedSMS.raw_sms,
      parsed_data: parsedSMS as any,
      status: 'pending_review',
    });
  }

  /**
   * Send payment notification to user
   */
  private async sendPaymentNotification(
    userId: string,
    payment: any,
    autoApproved: boolean
  ): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'payment_received',
      title: autoApproved ? 'Payment Confirmed' : 'Payment Received',
      body: autoApproved
        ? `Your payment of ${payment.amount} RWF has been confirmed and your transaction is complete.`
        : `We received your payment of ${payment.amount} RWF. It will be reviewed shortly.`,
      priority: 'high',
      channels: ['push', 'in_app'],
      data: {
        payment_id: payment.id,
        amount: payment.amount,
        provider: payment.provider,
      },
    });
  }

  /**
   * Batch allocate multiple payments
   */
  async allocateBatch(parsedMessages: ParsedSMS[]): Promise<PaymentAllocationResult[]> {
    const results = await Promise.allSettled(parsedMessages.map(msg => this.allocate(msg)));

    return results
      .filter((r): r is PromiseFulfilledResult<PaymentAllocationResult> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /**
   * Get unmatched payments for manual review
   */
  async getUnmatchedPayments(limit: number = 50): Promise<any[]> {
    const supabase = getSupabaseAdmin();

    const { data } = await supabase
      .from('unmatched_payments')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

/**
 * Create payment allocator instance
 */
export function createPaymentAllocator(): PaymentAllocator {
  return new PaymentAllocator();
}
