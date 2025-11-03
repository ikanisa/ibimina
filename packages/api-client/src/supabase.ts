/**
 * Supabase client configuration for Ibimina platform
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

let supabaseClient: SupabaseClient<Database> | null = null;
let supabaseAdminClient: SupabaseClient<Database> | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(config: SupabaseConfig): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

/**
 * Initialize Supabase admin client (service role)
 */
export function initSupabaseAdmin(config: SupabaseConfig): SupabaseClient<Database> {
  if (!config.serviceRoleKey) {
    throw new Error('Service role key required for admin client');
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient<Database>(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminClient;
}

/**
 * Get Supabase client instance
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return supabaseClient;
}

/**
 * Get Supabase admin client instance
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdminClient) {
    throw new Error('Supabase admin not initialized. Call initSupabaseAdmin() first.');
  }
  return supabaseAdminClient;
}

/**
 * Reset clients (useful for testing)
 */
export function resetSupabaseClients(): void {
  supabaseClient = null;
  supabaseAdminClient = null;
}
