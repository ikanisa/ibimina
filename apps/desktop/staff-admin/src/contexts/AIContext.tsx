'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GeminiQuota {
  used: number;
  limit: number;
  resetAt: Date;
}

interface AIState {
  documentsEnabled: boolean;
  fraudDetectionEnabled: boolean;
  voiceCommandsEnabled: boolean;
  analyticsEnabled: boolean;
  accessibilityEnabled: boolean;
  geminiQuota: GeminiQuota;
  isLoading: boolean;
}

interface AIContextType {
  state: AIState;
  refreshQuota: () => Promise<void>;
  enableFeature: (feature: keyof Omit<AIState, 'geminiQuota' | 'isLoading'>) => Promise<void>;
  disableFeature: (feature: keyof Omit<AIState, 'geminiQuota' | 'isLoading'>) => Promise<void>;
  checkFeatureAvailability: (feature: string) => boolean;
}

const AIContext = createContext<AIContextType | null>(null);

const DEFAULT_STATE: AIState = {
  documentsEnabled: false,
  fraudDetectionEnabled: false,
  voiceCommandsEnabled: false,
  analyticsEnabled: false,
  accessibilityEnabled: true,
  geminiQuota: {
    used: 0,
    limit: 100,
    resetAt: new Date(Date.now() + 3600000),
  },
  isLoading: false,
};

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AIState>(DEFAULT_STATE);
  const supabase = createClient();

  useEffect(() => {
    loadAIState();
  }, []);

  const loadAIState = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data: flags } = await supabase
        .from('global_feature_flags')
        .select('key, enabled')
        .in('key', [
          'ai_document_scanning',
          'ai_fraud_detection',
          'voice_commands',
          'realtime_analytics',
          'accessibility_enhanced',
        ]);

      if (flags) {
        const flagMap = Object.fromEntries(flags.map(f => [f.key, f.enabled]));

        setState(prev => ({
          ...prev,
          documentsEnabled: flagMap.ai_document_scanning ?? false,
          fraudDetectionEnabled: flagMap.ai_fraud_detection ?? false,
          voiceCommandsEnabled: flagMap.voice_commands ?? false,
          analyticsEnabled: flagMap.realtime_analytics ?? false,
          accessibilityEnabled: flagMap.accessibility_enhanced ?? true,
        }));
      }

      await refreshQuota();
    } catch (error) {
      console.error('Failed to load AI state:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const refreshQuota = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rateLimitData } = await supabase
        .from('api_rate_limits')
        .select('request_count, window_start')
        .eq('user_id', user.id)
        .eq('endpoint', 'gemini-proxy')
        .single();

      if (rateLimitData) {
        const windowStart = new Date(rateLimitData.window_start);
        const now = new Date();
        const hoursDiff = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

        setState(prev => ({
          ...prev,
          geminiQuota: {
            used: hoursDiff < 1 ? rateLimitData.request_count : 0,
            limit: 100,
            resetAt: hoursDiff < 1 
              ? new Date(windowStart.getTime() + 3600000)
              : new Date(now.getTime() + 3600000),
          },
        }));
      }
    } catch (error) {
      console.error('Failed to refresh quota:', error);
    }
  }, [supabase]);

  const enableFeature = async (feature: keyof Omit<AIState, 'geminiQuota' | 'isLoading'>) => {
    setState(prev => ({ ...prev, [feature]: true }));
  };

  const disableFeature = async (feature: keyof Omit<AIState, 'geminiQuota' | 'isLoading'>) => {
    setState(prev => ({ ...prev, [feature]: false }));
  };

  const checkFeatureAvailability = (feature: string): boolean => {
    const featureMap: Record<string, boolean> = {
      documents: state.documentsEnabled,
      fraud: state.fraudDetectionEnabled,
      voice: state.voiceCommandsEnabled,
      analytics: state.analyticsEnabled,
      accessibility: state.accessibilityEnabled,
    };

    return featureMap[feature] ?? false;
  };

  return (
    <AIContext.Provider
      value={{
        state,
        refreshQuota,
        enableFeature,
        disableFeature,
        checkFeatureAvailability,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}

export function useAIFeature(feature: string) {
  const { checkFeatureAvailability } = useAI();
  return checkFeatureAvailability(feature);
}
