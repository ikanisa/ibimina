/**
 * Supabase client for desktop app with Tauri secure storage integration
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ibimina/supabase-schemas";
import {
  getSecureCredentials,
  setSecureCredentials,
  deleteSecureCredentials,
} from "@/lib/tauri/commands";

// Vite uses import.meta.env instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

/**
 * Custom storage adapter that uses Tauri's secure credential storage
 * This stores auth tokens in the OS keychain instead of localStorage
 */
const tauriStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await getSecureCredentials();
      if (!credentials) return null;

      // Map Supabase storage keys to our credential structure
      if (key.includes("auth-token")) {
        return JSON.stringify({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          expires_at: credentials.expires_at,
        });
      }

      return null;
    } catch (error) {
      console.error("Failed to get credentials from secure storage:", error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (key.includes("auth-token")) {
        const session = JSON.parse(value);
        await setSecureCredentials({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        });
      }
    } catch (error) {
      console.error("Failed to set credentials in secure storage:", error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (key.includes("auth-token")) {
        await deleteSecureCredentials();
      }
    } catch (error) {
      console.error("Failed to remove credentials from secure storage:", error);
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: tauriStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desktop app doesn't use URL-based auth
  },
});
