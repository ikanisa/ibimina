/**
 * @ibimina/api-client
 * 
 * Unified API client for Ibimina platform with Supabase integration
 * and payment allocation logic.
 */

export {
  initSupabase,
  initSupabaseAdmin,
  getSupabase,
  getSupabaseAdmin,
  resetSupabaseClients,
  type SupabaseConfig,
} from './supabase';

export { PaymentAllocator, createPaymentAllocator } from './payment-allocator';

export type { Database } from './database.types';

// Re-export Supabase types
export type { SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
