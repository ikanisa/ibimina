/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_FEATURE_DOCUMENT_SCANNING?: string;
  readonly VITE_FEATURE_FRAUD_DETECTION?: string;
  readonly VITE_FEATURE_VOICE_COMMANDS?: string;
  readonly VITE_FEATURE_ACCESSIBILITY_ENHANCED?: string;
  readonly VITE_FEATURE_REALTIME_ANALYTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
