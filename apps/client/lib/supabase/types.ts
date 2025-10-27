/**
 * Supabase Database Type Definitions for Client App
 * 
 * These types represent the database schema for the client-facing
 * member onboarding and profile management features.
 * 
 * Key tables:
 * - members_app_profiles: User profile data for client app users
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      members_app_profiles: {
        Row: {
          user_id: string
          whatsapp_msisdn: string
          momo_msisdn: string
          id_type: 'NID' | 'DL' | 'PASSPORT' | null
          id_number: string | null
          id_files: Json | null
          ocr_json: Json | null
          lang: string | null
          is_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          whatsapp_msisdn: string
          momo_msisdn: string
          id_type?: 'NID' | 'DL' | 'PASSPORT' | null
          id_number?: string | null
          id_files?: Json | null
          ocr_json?: Json | null
          lang?: string | null
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          whatsapp_msisdn?: string
          momo_msisdn?: string
          id_type?: 'NID' | 'DL' | 'PASSPORT' | null
          id_number?: string | null
          id_files?: Json | null
          ocr_json?: Json | null
          lang?: string | null
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
