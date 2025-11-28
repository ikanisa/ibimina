interface Transaction {
  id: string;
  amount: number;
  payerPhone: string;
  payerName: string;
  timestamp: Date;
  ikiminaId: string;
  memberId?: string;
  reference?: string;
}

interface FraudAlert {
  id: string;
  transactionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: FraudType;
  description: string;
  confidence: number;
  suggestedAction: string;
  relatedTransactions: string[];
}

type FraudType = 
  | 'duplicate_payment'
  | 'unusual_amount'
  | 'velocity_anomaly'
  | 'phone_mismatch'
  | 'timing_anomaly'
  | 'pattern_deviation'
  | 'identity_mismatch'
  | 'suspicious_reference';

interface MemberProfile {
  id: string;
  typicalAmount: { min: number; max: number; average: number };
  paymentFrequency: number;
  preferredPaymentDays: number[];
  usualPaymentHours: { start: number; end: number };
  knownPhoneNumbers: string[];
  riskScore: number;
}

export class FraudDetectionEngine {
  private memberProfiles: Map<string, MemberProfile> = new Map();
  private recentTransactions: Transaction[] = [];
  private alertThresholds = {
    amountDeviationMultiplier: 3,
    velocityWindowMinutes: 5,
    maxTransactionsInWindow: 3,
    suspiciousHoursStart: 23,
    suspiciousHoursEnd: 5,
  };

  constructor(private geminiApiKey: string) {}

  async analyzeTransaction(transaction: Transaction): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    alerts.push(...this.runRuleBasedChecks(transaction));

    if (alerts.length > 0 || this.shouldDeepAnalyze(transaction)) {
      const aiAlerts = await this.runAIAnalysis(transaction, alerts);
      alerts.push(...aiAlerts);
    }

    return this.prioritizeAlerts(alerts);
  }

  private runRuleBasedChecks(transaction: Transaction): FraudAlert[] {
    const alerts: FraudAlert[] = [];
    const profile = this.memberProfiles.get(transaction.memberId || '');

    const duplicate = this.recentTransactions.find(t => 
      t.id !== transaction.id &&
      t.amount === transaction.amount &&
      t.payerPhone === transaction.payerPhone &&
      Math.abs(t.timestamp.getTime() - transaction.timestamp.getTime()) < 300000
    );

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

    if (profile) {
      const deviation = Math.abs(transaction.amount - profile.typicalAmount.average);
      const threshold = profile.typicalAmount.average * this.alertThresholds.amountDeviationMultiplier;

      if (deviation > threshold) {
        alerts.push({
          id: crypto.randomUUID(),
          transactionId: transaction.id,
          severity: transaction.amount > profile.typicalAmount.max * 5 ? 'high' : 'medium',
          type: 'unusual_amount',
          description: `Amount ${transaction.amount} RWF deviates significantly from member's typical range (${profile.typicalAmount.min}-${profile.typicalAmount.max} RWF)`,
          confidence: 0.75,
          suggestedAction: 'Verify with member before allocation',
          relatedTransactions: [],
        });
      }
    }

    const recentFromSamePhone = this.recentTransactions.filter(t =>
      t.payerPhone === transaction.payerPhone &&
      Math.abs(t.timestamp.getTime() - transaction.timestamp.getTime()) < 
        this.alertThresholds.velocityWindowMinutes * 60000
    );

    if (recentFromSamePhone.length >= this.alertThresholds.maxTransactionsInWindow) {
      alerts.push({
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        severity: 'medium',
        type: 'velocity_anomaly',
        description: `${recentFromSamePhone.length + 1} transactions from same phone in ${this.alertThresholds.velocityWindowMinutes} minutes`,
        confidence: 0.7,
        suggestedAction: 'Review for potential automated fraud attempt',
        relatedTransactions: recentFromSamePhone.map(t => t.id),
      });
    }

    const hour = transaction.timestamp.getHours();
    if (hour >= this.alertThresholds.suspiciousHoursStart || 
        hour < this.alertThresholds.suspiciousHoursEnd) {
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

    if (profile && profile.knownPhoneNumbers.length > 0 && 
        !profile.knownPhoneNumbers.includes(transaction.payerPhone)) {
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

    this.recentTransactions.push(transaction);
    if (this.recentTransactions.length > 1000) {
      this.recentTransactions = this.recentTransactions.slice(-500);
    }

    return alerts;
  }

  private async runAIAnalysis(
    transaction: Transaction, 
    existingAlerts: FraudAlert[]
  ): Promise<FraudAlert[]> {
    const profile = this.memberProfiles.get(transaction.memberId || '');
    const relatedTransactions = this.recentTransactions
      .filter(t => t.ikiminaId === transaction.ikiminaId)
      .slice(-20);

    const prompt = `Analyze this SACCO transaction for potential fraud:

TRANSACTION:
- ID: ${transaction.id}
- Amount: ${transaction.amount} RWF
- Payer Phone: ${transaction.payerPhone}
- Payer Name: ${transaction.payerName}
- Time: ${transaction.timestamp.toISOString()}
- Reference: ${transaction.reference || 'None'}

MEMBER PROFILE:
${profile ? `
- Typical Amount Range: ${profile.typicalAmount.min}-${profile.typicalAmount.max} RWF
- Average Payment: ${profile.typicalAmount.average} RWF
- Payment Frequency: ${profile.paymentFrequency} per month
- Known Phone Numbers: ${profile.knownPhoneNumbers.join(', ')}
- Risk Score: ${profile.riskScore}/100
` : 'No profile available (new member or unallocated)'}

RECENT TRANSACTIONS IN SAME GROUP (last 20):
${relatedTransactions.map(t => 
  `- ${t.amount} RWF from ${t.payerPhone} at ${t.timestamp.toISOString()}`
).join('\n')}

EXISTING ALERTS:
${existingAlerts.map(a => `- ${a.type}: ${a.description}`).join('\n') || 'None'}

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

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const result = await response.json();
      const aiAlerts = JSON.parse(result.candidates[0].content.parts[0].text);

      return aiAlerts.map((alert: any) => ({
        id: crypto.randomUUID(),
        transactionId: transaction.id,
        ...alert,
        relatedTransactions: [],
      }));
    } catch (error) {
      console.error('AI fraud analysis failed:', error);
      return [];
    }
  }

  private shouldDeepAnalyze(transaction: Transaction): boolean {
    return transaction.amount > 100000 || !this.memberProfiles.has(transaction.memberId || '');
  }

  private prioritizeAlerts(alerts: FraudAlert[]): FraudAlert[] {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return alerts
      .sort((a, b) => 
        severityOrder[a.severity] - severityOrder[b.severity] ||
        b.confidence - a.confidence
      )
      .slice(0, 10);
  }

  updateMemberProfile(memberId: string, transactions: Transaction[]): void {
    if (transactions.length === 0) return;

    const amounts = transactions.map(t => t.amount);
    const phones = [...new Set(transactions.map(t => t.payerPhone))];
    const days = transactions.map(t => t.timestamp.getDate());
    const hours = transactions.map(t => t.timestamp.getHours());

    this.memberProfiles.set(memberId, {
      id: memberId,
      typicalAmount: {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        average: amounts.reduce((a, b) => a + b, 0) / amounts.length,
      },
      paymentFrequency: transactions.length / 
        (Math.max(1, this.monthsBetween(
          transactions[0].timestamp,
          transactions[transactions.length - 1].timestamp
        ))),
      preferredPaymentDays: this.mode(days),
      usualPaymentHours: {
        start: Math.min(...hours),
        end: Math.max(...hours),
      },
      knownPhoneNumbers: phones,
      riskScore: this.calculateRiskScore(transactions),
    });
  }

  private monthsBetween(d1: Date, d2: Date): number {
    return Math.abs(
      (d2.getFullYear() - d1.getFullYear()) * 12 +
      (d2.getMonth() - d1.getMonth())
    ) || 1;
  }

  private mode(arr: number[]): number[] {
    const counts = new Map<number, number>();
    arr.forEach(n => counts.set(n, (counts.get(n) || 0) + 1));
    const maxCount = Math.max(...counts.values());
    return [...counts.entries()]
      .filter(([_, count]) => count === maxCount)
      .map(([num]) => num);
  }

  private calculateRiskScore(transactions: Transaction[]): number {
    if (transactions.length < 3) return 50;

    const amounts = transactions.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const cv = Math.sqrt(variance) / avg;

    return Math.max(0, Math.min(100, Math.round(cv * 100)));
  }
}
