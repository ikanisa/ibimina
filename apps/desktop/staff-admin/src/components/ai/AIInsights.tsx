/**
 * AI Insights Panel
 * Real-time AI-generated insights and recommendations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { geminiClient } from '@/lib/ai';

interface Insight {
  id: string;
  type: 'trend' | 'alert' | 'recommendation' | 'success';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  confidence: number;
  timestamp: Date;
}

interface AIInsightsProps {
  context?: 'dashboard' | 'fraud' | 'analytics' | 'reconciliation';
  data?: any;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AIInsights({
  context = 'dashboard',
  data,
  autoRefresh = true,
  refreshInterval = 300000,
}: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  useEffect(() => {
    generateInsights();

    if (autoRefresh) {
      const interval = setInterval(generateInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [context, data]);

  const generateInsights = async () => {
    try {
      setLoading(true);

      const prompt = getPromptForContext(context, data);
      const response = await geminiClient.generateContent(prompt, {
        temperature: 0.3,
        responseFormat: 'json',
      });

      const parsed = JSON.parse(response);
      const newInsights: Insight[] = parsed.insights.map((i: any) => ({
        id: crypto.randomUUID(),
        ...i,
        timestamp: new Date(),
      }));

      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromptForContext = (ctx: string, contextData: any) => {
    return `Analyze SACCO+ ${ctx} data and provide 3-5 actionable insights in JSON format.`;
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      trend: TrendingUp,
      alert: AlertTriangle,
      recommendation: Lightbulb,
      success: CheckCircle,
    };
    return icons[type as keyof typeof icons] || Sparkles;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${insight.confidence * 100}%` }}
                          className="h-full bg-purple-500"
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
