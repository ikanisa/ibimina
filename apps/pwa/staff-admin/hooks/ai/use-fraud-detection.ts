import { useState, useCallback } from 'react';
import { FraudDetectionEngine } from '@/lib/ai/fraud-detection';

interface FraudAlert {
  id: string;
  transactionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  confidence: number;
  suggestedAction: string;
  relatedTransactions: string[];
  timestamp?: Date;
}

export function useFraudDetection(transactionId?: string) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const engine = new FraudDetectionEngine(apiKey);

  const analyzeTransaction = useCallback(async (transaction: any) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const detectedAlerts = await engine.analyzeTransaction(transaction);
      setAlerts(prev => [...detectedAlerts, ...prev]);
      return detectedAlerts;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [engine]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    isAnalyzing,
    error,
    analyzeTransaction,
    dismissAlert,
    clearAlerts,
  };
}
