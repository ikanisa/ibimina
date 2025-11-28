/**
 * Fraud Detection Engine
 * Hybrid rule-based + AI fraud detection system
 */

import { createClient } from '@supabase/supabase-js';
import { gemini } from './gemini-client';
import { AI_CONFIG } from '../config/ai-config';
import type {
  FraudAlert,
  Transaction,
  MemberFraudProfile,
  FraudSeverity,
  FraudType,
} from './types';

export class FraudDetectionEngine {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  /**
   * Analyze a transaction for potential fraud
   */
  async analyzeTransaction(transaction: Transaction): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // Run fast rule-based checks first
    const ruleAlerts = await this.runRuleBasedChecks(transaction);
    alerts.push(...ruleAlerts);

    // If we have alerts or this is a high-value transaction, use AI
    if (alerts.length > 0 || this.shouldDeepAnalyze(transaction)) {
      try {
        const aiAlerts = await this.runAIAnalysis(transaction, alerts);
        alerts.push(...aiAlerts);
      } catch (error) {
        console.error('AI fraud analysis failed:', error);
        // Continue with rule-based alerts only
      }
    }

    // Save alerts to database
    await this.saveAlerts(alerts);

    // Return prioritized alerts
    return this.prioritizeAlerts(alerts);
  }

  /**
   * Fast rule-based fraud detection
   */
  private async runRuleBasedChecks(transaction: Transaction): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // Get member profile
    const profile = transaction.memberId
      ? await this.getMemberProfile(transaction.memberId)
      : null;

    // Check 1: Duplicate payment detection
    const duplicate = await this.checkDuplicatePayment(transaction);
    if (duplicate) {
      alerts.push({
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        severity: 'high',
        type: 'duplicate_payment',
        description: `Possible duplicate payment. Same amount (${transaction.amount} RWF) from same phone within 5 minutes.`,
        confidence: 0.9,
        suggestedAction: 'Review and potentially reverse one transaction',
        relatedTransactions: [duplicate.id],
      });
    }

    // Check 2: Unusual amount
    if (profile) {
      const deviation = Math.abs(transaction.amount - profile.typicalAmount.average);
      const threshold =
        profile.typicalAmount.average *
        AI_CONFIG.fraudDetection.rules.amountDeviationMultiplier;

      if (deviation > threshold) {
        const severity: FraudSeverity =
          transaction.amount > profile.typicalAmount.max * 5 ? 'high' : 'medium';

        alerts.push({
          id: crypto.randomUUID(),
          transactionId: transaction.id,
          severity,
          type: 'unusual_amount',
          description: `Amount ${transaction.amount} RWF deviates significantly from member's typical range (${profile.typicalAmount.min}-${profile.typicalAmount.max} RWF)`,
          confidence: 0.75,
          suggestedAction: 'Verify with member before allocation',
          relatedTransactions: [],
        });
      }
    }

    // Check 3: Velocity check (too many transactions in short time)
    const velocityIssue = await this.checkVelocity(transaction);
    if (velocityIssue) {
      alerts.push({
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        severity: 'medium',
        type: 'velocity_anomaly',
        description: `${velocityIssue.count} transactions from same phone in ${AI_CONFIG.fraudDetection.rules.velocityWindowMinutes} minutes`,
        confidence: 0.7,
        suggestedAction: 'Review for potential automated fraud attempt',
        relatedTransactions: velocityIssue.relatedIds,
      });
    }

    // Check 4: Suspicious timing
    const hour = transaction.timestamp.getHours();
    if (
      hour >= AI_CONFIG.fraudDetection.rules.suspiciousHoursStart ||
      hour < AI_CONFIG.fraudDetection.rules.suspiciousHoursEnd
    ) {
      alerts.push({
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        severity: 'low',
        type: 'timing_anomaly',
        description: `Transaction at unusual hour (${hour}:00). Most SACCO transactions occur during business hours.`,
        confidence: 0.5,
        suggestedAction: 'Flag for manual review',
        relatedTransactions: [],
      });
    }

    // Check 5: Phone number mismatch
    if (
      profile &&
      profile.knownPhoneNumbers.length > 0 &&
      !profile.knownPhoneNumbers.includes(transaction.payerPhone)
    ) {
      alerts.push({
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        severity: 'medium',
        type: 'phone_mismatch',
        description: `Payment from unregistered phone number. Known numbers: ${profile.knownPhoneNumbers.join(', ')}`,
        confidence: 0.6,
        suggestedAction: 'Verify member identity before allocation',
        relatedTransactions: [],
      });
    }

    return alerts;
  }

  /**
   * Deep AI-powered fraud analysis
   */
  private async runAIAnalysis(
    transaction: Transaction,
    existingAlerts: FraudAlert[]
  ): Promise<FraudAlert[]> {
    const profile = transaction.memberId
      ? await this.getMemberProfile(transaction.memberId)
      : null;

    const recentTransactions = await this.getRecentTransactions(
      transaction.ikiminaId,
      20
    );

    const prompt = `Analyze this SACCO transaction for potential fraud:

TRANSACTION:
- ID: ${transaction.id}
- Amount: ${transaction.amount} RWF
- Payer Phone: ${transaction.payerPhone}
- Payer Name: ${transaction.payerName}
- Time: ${transaction.timestamp.toISOString()}
- Reference: ${transaction.reference || 'None'}

MEMBER PROFILE:
${
  profile
    ? `
- Typical Amount Range: ${profile.typicalAmount.min}-${profile.typicalAmount.max} RWF
- Average Payment: ${profile.typicalAmount.average} RWF
- Payment Frequency: ${profile.paymentFrequency} per month
- Known Phone Numbers: ${profile.knownPhoneNumbers.join(', ')}
- Risk Score: ${profile.riskScore}/100
- Transaction Count: ${profile.transactionCount}
`
    : 'No profile available (new member or unallocated)'
}

RECENT TRANSACTIONS IN SAME GROUP (last 20):
${recentTransactions
  .map(
    (t) =>
      `- ${t.amount} RWF from ${t.payerPhone} at ${t.timestamp.toISOString()}`
  )
  .join('\n')}

EXISTING ALERTS:
${existingAlerts.map((a) => `- ${a.type}: ${a.description}`).join('\n') || 'None'}

Analyze for:
1. Pattern deviations from member behavior
2. Coordinated fraud attempts (multiple related suspicious transactions)
3. Identity theft indicators
4. Money laundering patterns
5. Social engineering indicators

Return JSON array of additional alerts (empty if none):
[{
  "type": "pattern_deviation|identity_mismatch|suspicious_reference",
  "severity": "low|medium|high|critical",
  "description": "string",
  "confidence": 0.0-1.0,
  "suggestedAction": "string"
}]`;

    const response = await gemini.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    const aiAlerts = JSON.parse(text) as Array<{
      type: string;
      severity: FraudSeverity;
      description: string;
      confidence: number;
      suggestedAction: string;
    }>;

    return aiAlerts.map((alert) => ({
      id: crypto.randomUUID(),
      transactionId: transaction.id,
      ...alert,
      type: alert.type as FraudType,
      relatedTransactions: [],
    }));
  }

  /**
   * Update member fraud profile with new transaction
   */
  async updateMemberProfile(
    memberId: string,
    transaction: Transaction
  ): Promise<void> {
    // Call database function to update profile
    await this.supabase.rpc('update_member_fraud_profile', {
      p_member_id: memberId,
      p_amount: transaction.amount,
      p_phone: transaction.payerPhone,
      p_timestamp: transaction.timestamp.toISOString(),
    });
  }

  /**
   * Get member fraud profile
   */
  private async getMemberProfile(
    memberId: string
  ): Promise<MemberFraudProfile | null> {
    const { data, error } = await this.supabase
      .from('member_fraud_profiles')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      memberId: data.member_id,
      typicalAmount: {
        min: data.typical_amount_min,
        max: data.typical_amount_max,
        average: data.typical_amount_avg,
      },
      paymentFrequency: data.payment_frequency,
      preferredPaymentDays: data.preferred_payment_days,
      usualPaymentHours: data.usual_payment_hours as { start: number; end: number },
      knownPhoneNumbers: data.known_phone_numbers,
      riskScore: data.risk_score,
      transactionCount: data.transaction_count,
      lastTransactionAt: data.last_transaction_at
        ? new Date(data.last_transaction_at)
        : undefined,
      lastUpdated: new Date(data.last_updated),
    };
  }

  /**
   * Check for duplicate payments
   */
  private async checkDuplicatePayment(
    transaction: Transaction
  ): Promise<Transaction | null> {
    // Query recent transactions (last 5 minutes)
    const fiveMinutesAgo = new Date(
      transaction.timestamp.getTime() - 5 * 60 * 1000
    );

    const { data } = await this.supabase
      .from('allocations')
      .select('id, amount, payer_phone, created_at')
      .eq('amount', transaction.amount)
      .eq('payer_phone', transaction.payerPhone)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .neq('id', transaction.id)
      .limit(1);

    if (data && data.length > 0) {
      return {
        id: data[0].id,
        amount: data[0].amount,
        payerPhone: data[0].payer_phone,
        payerName: '',
        timestamp: new Date(data[0].created_at),
        ikiminaId: transaction.ikiminaId,
      };
    }

    return null;
  }

  /**
   * Check transaction velocity
   */
  private async checkVelocity(
    transaction: Transaction
  ): Promise<{ count: number; relatedIds: string[] } | null> {
    const windowStart = new Date(
      transaction.timestamp.getTime() -
        AI_CONFIG.fraudDetection.rules.velocityWindowMinutes * 60 * 1000
    );

    const { data } = await this.supabase
      .from('allocations')
      .select('id')
      .eq('payer_phone', transaction.payerPhone)
      .gte('created_at', windowStart.toISOString());

    if (data && data.length >= AI_CONFIG.fraudDetection.rules.maxTransactionsInWindow) {
      return {
        count: data.length,
        relatedIds: data.map((t) => t.id),
      };
    }

    return null;
  }

  /**
   * Get recent transactions for a group
   */
  private async getRecentTransactions(
    ikiminaId: string,
    limit: number
  ): Promise<Transaction[]> {
    const { data } = await this.supabase
      .from('allocations')
      .select('*')
      .eq('group_id', ikiminaId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      amount: row.amount,
      payerPhone: row.payer_phone || '',
      payerName: row.payer_name || '',
      timestamp: new Date(row.created_at),
      ikiminaId: row.group_id,
      memberId: row.member_id,
      reference: row.reference,
    }));
  }

  /**
   * Save fraud alerts to database
   */
  private async saveAlerts(alerts: FraudAlert[]): Promise<void> {
    if (alerts.length === 0) return;

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    const { data: orgData } = await this.supabase
      .from('staff_assignments')
      .select('organization_id, country_id')
      .eq('user_id', user.id)
      .single();

    if (!orgData) return;

    const records = alerts.map((alert) => ({
      organization_id: orgData.organization_id,
      country_id: orgData.country_id,
      transaction_id: alert.transactionId,
      severity: alert.severity,
      type: alert.type,
      description: alert.description,
      confidence: alert.confidence,
      suggested_action: alert.suggestedAction,
      related_transactions: alert.relatedTransactions,
    }));

    await this.supabase.from('fraud_alerts').insert(records);
  }

  /**
   * Determine if transaction needs deep AI analysis
   */
  private shouldDeepAnalyze(transaction: Transaction): boolean {
    return transaction.amount > 100000; // > 100,000 RWF
  }

  /**
   * Prioritize and deduplicate alerts
   */
  private prioritizeAlerts(alerts: FraudAlert[]): FraudAlert[] {
    const severityOrder: Record<FraudSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return alerts
      .sort(
        (a, b) =>
          severityOrder[a.severity] - severityOrder[b.severity] ||
          b.confidence - a.confidence
      )
      .slice(0, 10); // Max 10 alerts per transaction
  }

  /**
   * Get pending fraud alerts for current user's organization
   */
  async getPendingAlerts(limit: number = 50) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: orgData } = await this.supabase
      .from('staff_assignments')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!orgData) return [];

    const { data, error } = await this.supabase
      .from('fraud_alerts')
      .select('*')
      .eq('organization_id', orgData.organization_id)
      .eq('status', 'pending')
      .order('severity', { ascending: true }) // critical first
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark alert as reviewed
   */
  async reviewAlert(
    alertId: string,
    status: 'reviewed' | 'dismissed' | 'escalated'
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await this.supabase
      .from('fraud_alerts')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', alertId);
  }
}

// Singleton instance
export const fraudDetection = new FraudDetectionEngine();
