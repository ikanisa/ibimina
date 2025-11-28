/**
 * AI Configuration
 * Central configuration for all AI features
 */

export const AI_CONFIG = {
  // Gemini API
  gemini: {
    model: 'gemini-1.5-flash',
    maxRetries: 3,
    timeoutMs: 30000,
    rateLimit: {
      requestsPerHour: 100,
      requestsPerDay: 1000,
    },
  },

  // Document Intelligence
  documentScanning: {
    maxFileSizeMB: 5,
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    confidenceThreshold: 0.7,
    processingTimeoutMs: 60000,
  },

  // Fraud Detection
  fraudDetection: {
    enabled: true,
    severityThresholds: {
      critical: 0.9,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    },
    alertChannels: ['ui', 'email'], // 'sms', 'push' can be added
    autoBlockThreshold: 0.95,
    rules: {
      amountDeviationMultiplier: 3,
      velocityWindowMinutes: 5,
      maxTransactionsInWindow: 3,
      suspiciousHoursStart: 23,
      suspiciousHoursEnd: 5,
    },
  },

  // Voice Commands
  voiceCommands: {
    enabled: true,
    wakeWord: 'ibimina',
    languages: ['en-RW', 'rw-RW'],
    confidenceThreshold: 0.8,
    continuousListening: false,
    awakeTimeoutSeconds: 30,
    fuzzyMatchThreshold: 0.7,
  },

  // Accessibility
  accessibility: {
    defaultSettings: {
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      textScaling: 1.0,
      colorBlindMode: 'none' as const,
      cursorSize: 'normal' as const,
      screenReader: false,
      soundEffects: true,
      voiceFeedback: false,
      keyboardNavigation: true,
      stickyKeys: false,
      slowKeys: false,
      slowKeysDelay: 300,
      focusIndicator: 'default' as const,
      simplifiedUI: false,
      readingGuide: false,
      dyslexiaFont: false,
      lineSpacing: 1.5,
      wordSpacing: 0,
    },
  },

  // Real-Time Analytics
  analytics: {
    refreshIntervalMs: 5000,
    aiInsightsEnabled: true,
    aiInsightsIntervalMs: 60000, // Generate insights max once per minute
    chartCacheMs: 30000,
    maxDataPoints: 100,
  },
} as const;

export type AIConfig = typeof AI_CONFIG;

/**
 * Feature flags for gradual rollout
 */
export const AI_FEATURE_FLAGS = {
  documentScanning: false,
  fraudDetection: false,
  voiceCommands: false,
  accessibilityEnhanced: true,
  realtimeAnalytics: false,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof AI_FEATURE_FLAGS): boolean {
  // Check environment variable override first
  const envKey = `VITE_FEATURE_${feature.toUpperCase()}`;
  const envValue = import.meta.env[envKey];
  
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  return AI_FEATURE_FLAGS[feature];
}

/**
 * Get Supabase Edge Function URL for Gemini proxy
 */
export function getGeminiProxyUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }
  return `${supabaseUrl}/functions/v1/gemini-proxy`;
}
