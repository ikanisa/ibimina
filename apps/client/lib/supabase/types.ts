/**
 * Supabase database types
 * Generated types for type-safe database access
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      saccos: {
        Row: {
          id: string;
          name: string;
          district: string;
          sector_code: string;
          merchant_code: string | null;
          province: string | null;
          category: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          district: string;
          sector_code: string;
          merchant_code?: string | null;
          province?: string | null;
          category?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          district?: string;
          sector_code?: string;
          merchant_code?: string | null;
          province?: string | null;
          category?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ibimina: {
        Row: {
          id: string;
          sacco_id: string;
          code: string;
          name: string;
          type: string;
          settings_json: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sacco_id: string;
          code: string;
          name: string;
          type: string;
          settings_json?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sacco_id?: string;
          code?: string;
          name?: string;
          type?: string;
          settings_json?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ikimina_members: {
        Row: {
          id: string;
          ikimina_id: string;
          member_code: string | null;
          full_name: string;
          national_id: string | null;
          msisdn: string;
          joined_at: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ikimina_id: string;
          member_code?: string | null;
          full_name: string;
          national_id?: string | null;
          msisdn: string;
          joined_at?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ikimina_id?: string;
          member_code?: string | null;
          full_name?: string;
          national_id?: string | null;
          msisdn?: string;
          joined_at?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      search_saccos: {
        Args: {
          query?: string | null;
          limit_count?: number;
          district_filter?: string | null;
          sector_filter?: string | null;
        };
        Returns: Array<{
          id: string;
          name: string;
          district: string;
          sector_code: string;
          merchant_code: string | null;
          province: string | null;
          category: string | null;
        }>;
      };
    };
  };
}
