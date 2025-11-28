import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
  geminiQuota: GeminiQuota | null;
  loading: boolean;
}

interface AIContextType {
  state: AIState;
  refreshQuota: () => Promise<void>;
  enableFeature: (feature: keyof Omit<AIState, "geminiQuota" | "loading">) => Promise<void>;
  disableFeature: (feature: keyof Omit<AIState, "geminiQuota" | "loading">) => Promise<void>;
}

const AIContext = createContext<AIContextType | null>(null);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AIState>({
    documentsEnabled: false,
    fraudDetectionEnabled: false,
    voiceCommandsEnabled: false,
    analyticsEnabled: false,
    accessibilityEnabled: true,
    geminiQuota: null,
    loading: true,
  });

  const supabase = createClient();

  useEffect(() => {
    loadFeatureFlags();
    refreshQuota();
  }, []);

  async function loadFeatureFlags() {
    try {
      const { data } = await supabase
        .from("global_feature_flags")
        .select("key, enabled")
        .in("key", [
          "ai_document_scanning",
          "ai_fraud_detection",
          "voice_commands",
          "realtime_analytics",
          "accessibility_enhanced",
        ]);

      if (data) {
        setState((prev) => ({
          ...prev,
          documentsEnabled: data.find((f) => f.key === "ai_document_scanning")?.enabled || false,
          fraudDetectionEnabled: data.find((f) => f.key === "ai_fraud_detection")?.enabled || false,
          voiceCommandsEnabled: data.find((f) => f.key === "voice_commands")?.enabled || false,
          analyticsEnabled: data.find((f) => f.key === "realtime_analytics")?.enabled || false,
          accessibilityEnabled:
            data.find((f) => f.key === "accessibility_enhanced")?.enabled || true,
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load feature flags:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }

  async function refreshQuota() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("api_rate_limits")
        .select("request_count, window_start")
        .eq("user_id", user.id)
        .eq("endpoint", "gemini-proxy")
        .single();

      if (data) {
        setState((prev) => ({
          ...prev,
          geminiQuota: {
            used: data.request_count,
            limit: 100,
            resetAt: new Date(new Date(data.window_start).getTime() + 3600000),
          },
        }));
      }
    } catch (error) {
      console.error("Failed to refresh quota:", error);
    }
  }

  async function enableFeature(feature: keyof Omit<AIState, "geminiQuota" | "loading">) {
    setState((prev) => ({ ...prev, [feature]: true }));
  }

  async function disableFeature(feature: keyof Omit<AIState, "geminiQuota" | "loading">) {
    setState((prev) => ({ ...prev, [feature]: false }));
  }

  return (
    <AIContext.Provider value={{ state, refreshQuota, enableFeature, disableFeature }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within AIProvider");
  }
  return context;
}
