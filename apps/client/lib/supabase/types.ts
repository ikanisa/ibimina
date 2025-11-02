/**
 * Supabase Database Type Definitions for Client App
 *
 * These types represent the database schema for the client-facing
 * member onboarding and profile management features.
 *
 * Key tables:
 * - members_app_profiles: User profile data for client app users
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      members_app_profiles: {
        Row: {
          user_id: string;
          whatsapp_msisdn: string;
          momo_msisdn: string;
          id_type: "NID" | "DL" | "PASSPORT" | null;
          id_number: string | null;
          id_files: Json | null;
          ocr_json: Json | null;
          lang: string | null;
          is_verified: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          whatsapp_msisdn: string;
          momo_msisdn: string;
          id_type?: "NID" | "DL" | "PASSPORT" | null;
          id_number?: string | null;
          id_files?: Json | null;
          ocr_json?: Json | null;
          lang?: string | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          whatsapp_msisdn?: string;
          momo_msisdn?: string;
          id_type?: "NID" | "DL" | "PASSPORT" | null;
          id_number?: string | null;
          id_files?: Json | null;
          ocr_json?: Json | null;
          lang?: string | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ibimina: {
        Row: {
          code: string | null;
          created_at: string | null;
          id: string;
          name: string | null;
          sacco_id: string | null;
          settings_json: Json | null;
          status: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          sacco_id?: string | null;
          settings_json?: Json | null;
          status?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          sacco_id?: string | null;
          settings_json?: Json | null;
          status?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ibimina_sacco_id_fkey";
            columns: ["sacco_id"];
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          },
        ];
      };
      ikimina_members: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          id: string;
          ikimina_id: string | null;
          joined_at: string | null;
          member_code: string | null;
          msisdn: string | null;
          msisdn_encrypted: string | null;
          msisdn_hash: string | null;
          msisdn_masked: string | null;
          national_id: string | null;
          national_id_encrypted: string | null;
          national_id_hash: string | null;
          national_id_masked: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          ikimina_id?: string | null;
          joined_at?: string | null;
          member_code?: string | null;
          msisdn?: string | null;
          msisdn_encrypted?: string | null;
          msisdn_hash?: string | null;
          msisdn_masked?: string | null;
          national_id?: string | null;
          national_id_encrypted?: string | null;
          national_id_hash?: string | null;
          national_id_masked?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          ikimina_id?: string | null;
          joined_at?: string | null;
          member_code?: string | null;
          msisdn?: string | null;
          msisdn_encrypted?: string | null;
          msisdn_hash?: string | null;
          msisdn_masked?: string | null;
          national_id?: string | null;
          national_id_encrypted?: string | null;
          national_id_hash?: string | null;
          national_id_masked?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ikimina_members_ikimina_id_fkey";
            columns: ["ikimina_id"];
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          },
        ];
      };
      saccos: {
        Row: {
          brand_color: string | null;
          category: string | null;
          created_at: string;
          district: string;
          email: string | null;
          id: string;
          logo_url: string | null;
          merchant_code: string | null;
          metadata: Json;
          name: string;
          province: string | null;
          search_document: unknown | null;
          search_slug: string | null;
          sector: string | null;
          sector_code: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          brand_color?: string | null;
          category?: string | null;
          created_at?: string;
          district: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          merchant_code?: string | null;
          metadata?: Json;
          name: string;
          province?: string | null;
          search_document?: unknown | null;
          search_slug?: string | null;
          sector?: string | null;
          sector_code: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          brand_color?: string | null;
          category?: string | null;
          created_at?: string;
          district?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          merchant_code?: string | null;
          metadata?: Json;
          name?: string;
          province?: string | null;
          search_document?: unknown | null;
          search_slug?: string | null;
          sector?: string | null;
          sector_code?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      partner_config: {
        Row: {
          org_id: string;
          enabled_features: string[] | null;
          merchant_code: string | null;
          telco_ids: string[] | null;
          language_pack: string[] | null;
          reference_prefix: string | null;
          contact: Json | null;
        };
        Insert: {
          org_id: string;
          enabled_features?: string[] | null;
          merchant_code?: string | null;
          telco_ids?: string[] | null;
          language_pack?: string[] | null;
          reference_prefix?: string | null;
          contact?: Json | null;
        };
        Update: {
          org_id?: string;
          enabled_features?: string[] | null;
          merchant_code?: string | null;
          telco_ids?: string[] | null;
          language_pack?: string[] | null;
          reference_prefix?: string | null;
          contact?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "partner_config_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      member_reference_tokens: {
        Row: {
          token: string | null;
          group_id: string | null;
          group_name: string | null;
          sacco_id: string | null;
          expires_at: string | null;
          created_at: string | null;
        };
        Insert: {
          token?: string | null;
          group_id?: string | null;
          group_name?: string | null;
          sacco_id?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          token?: string | null;
          group_id?: string | null;
          group_name?: string | null;
          sacco_id?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "member_reference_tokens_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_reference_tokens_sacco_id_fkey";
            columns: ["sacco_id"];
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          },
        ];
      };
      allocations: {
        Row: {
          id: string;
          reference_token: string | null;
          amount: number;
          currency: string | null;
          status: string | null;
          momo_txn_id: string | null;
          posted_at: string | null;
          created_at: string | null;
          group_id: string | null;
          group_name: string | null;
          msisdn: string | null;
          narration: string | null;
        };
        Insert: {
          id?: string;
          reference_token?: string | null;
          amount?: number;
          currency?: string | null;
          status?: string | null;
          momo_txn_id?: string | null;
          posted_at?: string | null;
          created_at?: string | null;
          group_id?: string | null;
          group_name?: string | null;
          msisdn?: string | null;
          narration?: string | null;
        };
        Update: {
          id?: string;
          reference_token?: string | null;
          amount?: number;
          currency?: string | null;
          status?: string | null;
          momo_txn_id?: string | null;
          posted_at?: string | null;
          created_at?: string | null;
          group_id?: string | null;
          group_name?: string | null;
          msisdn?: string | null;
          narration?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "allocations_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      member_profiles_public: {
        Row: {
          id: string | null;
          full_name: string | null;
          primary_msisdn: string | null;
          whatsapp_msisdn: string | null;
          momo_msisdn: string | null;
          locale: string | null;
          avatar_url: string | null;
          reference_token: string | null;
          created_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      search_saccos: {
        Args: {
          district_filter?: string | null;
          limit_count?: number;
          sector_filter?: string | null;
          query: string | null;
        };
        Returns: {
          category: string | null;
          district: string;
          email: string | null;
          id: string;
          name: string;
          province: string | null;
          rank_score: number;
          sector: string | null;
          sector_code: string;
          merchant_code: string | null;
          similarity_score: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
