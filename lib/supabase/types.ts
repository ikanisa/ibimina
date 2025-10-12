export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null;
          created_at: string | null;
          currency: string;
          id: string;
          owner_id: string;
          owner_type: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          balance?: number | null;
          created_at?: string | null;
          currency?: string;
          id?: string;
          owner_id: string;
          owner_type: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          balance?: number | null;
          created_at?: string | null;
          currency?: string;
          id?: string;
          owner_id?: string;
          owner_type?: string;
          status?: string;
          updated_at?: string | null;
      };
      Relationships: [];
    };
      configuration: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string | null;
          diff_json: Json | null;
          entity: string;
          entity_id: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string;
          created_at?: string | null;
          diff_json?: Json | null;
          entity: string;
          entity_id: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string | null;
          diff_json?: Json | null;
          entity?: string;
          entity_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      ibimina: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          sacco_id: string;
          settings_json: Json;
          status: string;
          type: string;
          updated_at: string | null;
          code: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          sacco_id: string;
          settings_json?: Json;
          status?: string;
          type: string;
          updated_at?: string | null;
          code: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          sacco_id?: string;
          settings_json?: Json;
          status?: string;
          type?: string;
          updated_at?: string | null;
          code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ibimina_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          }
        ];
      };
      ikimina_members: {
        Row: {
          created_at: string | null;
          id: string;
          ikimina_id: string;
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
          status: string;
          updated_at: string | null;
          full_name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          ikimina_id: string;
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
          status?: string;
          updated_at?: string | null;
          full_name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          ikimina_id?: string;
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
          status?: string;
          updated_at?: string | null;
          full_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ikimina_members_ikimina_id_fkey";
            columns: ["ikimina_id"];
            isOneToOne: false;
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          }
        ];
      };
      ledger_entries: {
        Row: {
          amount: number;
          created_at: string | null;
          credit_id: string;
          currency: string;
          debit_id: string;
          external_id: string | null;
          id: string;
          memo: string | null;
          value_date: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          credit_id: string;
          currency?: string;
          debit_id: string;
          external_id?: string | null;
          id?: string;
          memo?: string | null;
          value_date: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          credit_id?: string;
          currency?: string;
          debit_id?: string;
          external_id?: string | null;
          id?: string;
          memo?: string | null;
          value_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_entries_credit_id_fkey";
            columns: ["credit_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_debit_id_fkey";
            columns: ["debit_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          ai_version: string | null;
          amount: number;
          channel: string;
          confidence: number | null;
          created_at: string | null;
          currency: string;
          id: string;
          ikimina_id: string | null;
          member_id: string | null;
          msisdn: string;
          msisdn_encrypted: string | null;
          msisdn_hash: string | null;
          msisdn_masked: string | null;
          occurred_at: string;
          reference: string | null;
          sacco_id: string;
          source_id: string | null;
          status: string;
          txn_id: string;
        };
        Insert: {
          ai_version?: string | null;
          amount: number;
          channel?: string;
          confidence?: number | null;
          created_at?: string | null;
          currency?: string;
          id?: string;
          ikimina_id?: string | null;
          member_id?: string | null;
          msisdn: string;
          msisdn_encrypted?: string | null;
          msisdn_hash?: string | null;
          msisdn_masked?: string | null;
          occurred_at: string;
          reference?: string | null;
          sacco_id: string;
          source_id?: string | null;
          status?: string;
          txn_id: string;
        };
        Update: {
          ai_version?: string | null;
          amount?: number;
          channel?: string;
          confidence?: number | null;
          created_at?: string | null;
          currency?: string;
          id?: string;
          ikimina_id?: string | null;
          member_id?: string | null;
          msisdn?: string;
          msisdn_encrypted?: string | null;
          msisdn_hash?: string | null;
          msisdn_masked?: string | null;
          occurred_at?: string;
          reference?: string | null;
          sacco_id?: string;
          source_id?: string | null;
          status?: string;
          txn_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_ikimina_id_fkey";
            columns: ["ikimina_id"];
            isOneToOne: false;
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "ikimina_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sms_inbox";
            referencedColumns: ["id"];
          }
        ];
      };
      rate_limit_counters: {
        Row: {
          hits: number;
          key: string;
          window_expires: string;
        };
        Insert: {
          hits?: number;
          key: string;
          window_expires?: string;
        };
        Update: {
          hits?: number;
          key?: string;
          window_expires?: string;
        };
        Relationships: [];
      };
      saccos: {
        Row: {
          category: string;
          created_at: string | null;
          district: string;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          province: string;
          search_document: string | null;
          search_slug: string | null;
          sector: string;
          sector_code: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          district: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          province: string;
          search_document?: string | null;
          search_slug?: string | null;
          sector: string;
          sector_code: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          district?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          province?: string;
          search_document?: string | null;
          search_slug?: string | null;
          sector?: string;
          sector_code?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sms_templates: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          sacco_id: string;
          version: number;
          tokens: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sacco_id: string;
          version?: number;
          tokens?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sacco_id?: string;
          version?: number;
          tokens?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sms_templates_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          }
        ];
      };
      sms_inbox: {
        Row: {
          confidence: number | null;
          created_at: string | null;
          error: string | null;
          id: string;
          msisdn: string | null;
          msisdn_encrypted: string | null;
          msisdn_hash: string | null;
          msisdn_masked: string | null;
          parse_source: string | null;
          parsed_json: Json | null;
          raw_text: string;
          received_at: string;
          sacco_id: string | null;
          status: string;
          vendor_meta: Json | null;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string | null;
          error?: string | null;
          id?: string;
          msisdn?: string | null;
          msisdn_encrypted?: string | null;
          msisdn_hash?: string | null;
          msisdn_masked?: string | null;
          parse_source?: string | null;
          parsed_json?: Json | null;
          raw_text: string;
          received_at: string;
          sacco_id?: string | null;
          status?: string;
          vendor_meta?: Json | null;
        };
        Update: {
          confidence?: number | null;
          created_at?: string | null;
          error?: string | null;
          id?: string;
          msisdn?: string | null;
          msisdn_encrypted?: string | null;
          msisdn_hash?: string | null;
          msisdn_masked?: string | null;
          parse_source?: string | null;
          parsed_json?: Json | null;
          raw_text?: string;
          received_at?: string;
          sacco_id?: string | null;
          status?: string;
          vendor_meta?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "sms_inbox_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
          referencedColumns: ["id"];
        }
      ];
      };
      notification_queue: {
        Row: {
          created_at: string | null;
          event: string;
          id: string;
          payload: Json | null;
          payment_id: string | null;
          sacco_id: string | null;
          scheduled_for: string | null;
          status: string | null;
          template_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event: string;
          id?: string;
          payload?: Json | null;
          payment_id?: string | null;
          sacco_id?: string | null;
          scheduled_for?: string | null;
          status?: string | null;
          template_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event?: string;
          id?: string;
          payload?: Json | null;
          payment_id?: string | null;
          sacco_id?: string | null;
          scheduled_for?: string | null;
          status?: string | null;
          template_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notification_queue_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_queue_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_queue_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "sms_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      system_metrics: {
        Row: {
          event: string;
          last_occurred: string | null;
          meta: Json | null;
          total: number;
        };
        Insert: {
          event: string;
          last_occurred?: string | null;
          meta?: Json | null;
          total?: number;
        };
        Update: {
          event?: string;
          last_occurred?: string | null;
          meta?: Json | null;
          total?: number;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          failed_mfa_count: number;
          id: string;
          last_mfa_step: number | null;
          last_mfa_success_at: string | null;
          mfa_backup_hashes: string[];
          mfa_enabled: boolean;
          mfa_enrolled_at: string | null;
          mfa_passkey_enrolled: boolean;
          mfa_methods: string[];
          mfa_secret_enc: string | null;
          role: Database["public"]["Enums"]["app_role"];
          sacco_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          failed_mfa_count?: number;
          id: string;
          last_mfa_step?: number | null;
          last_mfa_success_at?: string | null;
          mfa_backup_hashes?: string[];
          mfa_enabled?: boolean;
          mfa_enrolled_at?: string | null;
          mfa_passkey_enrolled?: boolean;
          mfa_methods?: string[];
          mfa_secret_enc?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          sacco_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          failed_mfa_count?: number;
          id?: string;
          last_mfa_step?: number | null;
          last_mfa_success_at?: string | null;
          mfa_backup_hashes?: string[];
          mfa_enabled?: boolean;
          mfa_enrolled_at?: string | null;
          mfa_passkey_enrolled?: boolean;
          mfa_methods?: string[];
          mfa_secret_enc?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          sacco_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          }
        ];
      };
      trusted_devices: {
        Row: {
          created_at: string;
          device_fingerprint_hash: string;
          device_id: string;
          id: string;
          ip_prefix: string | null;
          last_used_at: string;
          user_agent_hash: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_fingerprint_hash: string;
          device_id: string;
          id?: string;
          ip_prefix?: string | null;
          last_used_at?: string;
          user_agent_hash: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_fingerprint_hash?: string;
          device_id?: string;
          id?: string;
          ip_prefix?: string | null;
          last_used_at?: string;
          user_agent_hash?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trusted_devices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      mfa_recovery_codes: {
        Row: {
          codes: string[];
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          codes?: string[];
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          codes?: string[];
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_recovery_codes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      webauthn_credentials: {
        Row: {
          backed_up: boolean;
          created_at: string;
          credential_id: string;
          credential_public_key: string;
          device_type: string | null;
          friendly_name: string | null;
          id: string;
          last_used_at: string | null;
          sign_count: number;
          transports: string[];
          user_id: string;
        };
        Insert: {
          backed_up?: boolean;
          created_at?: string;
          credential_id: string;
          credential_public_key: string;
          device_type?: string | null;
          friendly_name?: string | null;
          id?: string;
          last_used_at?: string | null;
          sign_count?: number;
          transports?: string[];
          user_id: string;
        };
        Update: {
          backed_up?: boolean;
          created_at?: string;
          credential_id?: string;
          credential_public_key?: string;
          device_type?: string | null;
          friendly_name?: string | null;
          id?: string;
          last_used_at?: string | null;
          sign_count?: number;
          transports?: string[];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      ikimina_members_public: {
        Row: {
          id: string;
          ikimina_id: string;
          member_code: string | null;
          full_name: string;
          status: string;
          joined_at: string | null;
          msisdn: string | null;
          national_id: string | null;
          ikimina_name: string | null;
          sacco_id: string | null;
        };
      };
    };
    Functions: {
      get_user_sacco: {
        Args: { _user_id: string };
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      search_saccos: {
        Args: {
          district_filter?: string | null;
          limit_count?: number | null;
          province_filter?: string | null;
          query?: string | null;
        };
        Returns: Array<{
          category: string;
          district: string;
          email: string | null;
          id: string;
          name: string;
          province: string;
          rank_score: number | null;
          sector: string;
          similarity_score: number | null;
        }>;
      };
    };
    Enums: {
      app_role: "SYSTEM_ADMIN" | "SACCO_MANAGER" | "SACCO_STAFF" | "SACCO_VIEWER";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  app: {
    Tables: {
      mfa_email_codes: {
        Row: {
          id: string;
          user_id: string;
          code_hash: string;
          salt: string;
          expires_at: string;
          attempt_count: number;
          consumed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_hash: string;
          salt: string;
          expires_at: string;
          attempt_count?: number;
          consumed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_hash?: string;
          salt?: string;
          expires_at?: string;
          attempt_count?: number;
          consumed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_email_codes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
