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

      group_invites: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          group_id: string;
          id: string;
          invitee_msisdn: string | null;
          invitee_user_id: string | null;
          status: Database["public"]["Enums"]["group_invite_status"];
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          group_id: string;
          id?: string;
          invitee_msisdn?: string | null;
          invitee_user_id?: string | null;
          status?: Database["public"]["Enums"]["group_invite_status"];
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          group_id?: string;
          id?: string;
          invitee_msisdn?: string | null;
          invitee_user_id?: string | null;
          status?: Database["public"]["Enums"]["group_invite_status"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_invites_invitee_user_id_fkey";
            columns: ["invitee_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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

      join_requests: {
        Row: {
          created_at: string | null;
          decided_at: string | null;
          decided_by: string | null;
          group_id: string;
          id: string;
          note: string | null;
          sacco_id: string;
          status: Database["public"]["Enums"]["join_request_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          group_id: string;
          id?: string;
          note?: string | null;
          sacco_id: string;
          status?: Database["public"]["Enums"]["join_request_status"];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          group_id?: string;
          id?: string;
          note?: string | null;
          sacco_id?: string;
          status?: Database["public"]["Enums"]["join_request_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "join_requests_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "ibimina";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "join_requests_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "join_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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

      members_app_profiles: {
        Row: {
          created_at: string | null;
          id_files: Json | null;
          id_number: string | null;
          id_type: Database["public"]["Enums"]["member_id_type"] | null;
          is_verified: boolean | null;
          lang: string | null;
          momo_msisdn: string;
          ocr_json: Json | null;
          updated_at: string | null;
          user_id: string;
          whatsapp_msisdn: string;
        };
        Insert: {
          created_at?: string | null;
          id_files?: Json | null;
          id_number?: string | null;
          id_type?: Database["public"]["Enums"]["member_id_type"] | null;
          is_verified?: boolean | null;
          lang?: string | null;
          momo_msisdn: string;
          ocr_json?: Json | null;
          updated_at?: string | null;
          user_id: string;
          whatsapp_msisdn: string;
        };
        Update: {
          created_at?: string | null;
          id_files?: Json | null;
          id_number?: string | null;
          id_type?: Database["public"]["Enums"]["member_id_type"] | null;
          is_verified?: boolean | null;
          lang?: string | null;
          momo_msisdn?: string;
          ocr_json?: Json | null;
          updated_at?: string | null;
          user_id?: string;
          whatsapp_msisdn?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_app_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
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
          metadata: Json;
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
          updated_at: string;
          user_id: string | null;
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
          metadata?: Json;
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
          updated_at?: string;
          user_id?: string | null;
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
          metadata?: Json;
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
          updated_at?: string;
          user_id?: string | null;
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

      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          payload: Json | null;
          read_at: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          payload?: Json | null;
          read_at?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          payload?: Json | null;
          read_at?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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

      user_saccos: {
        Row: {
          created_at: string | null;
          sacco_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          sacco_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          sacco_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_saccos_sacco_id_fkey";
            columns: ["sacco_id"];
            isOneToOne: false;
            referencedRelation: "saccos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_saccos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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
      analytics_payment_rollups_mv: {
        Row: {
          sacco_id: string | null;
          month_total: number | null;
          week_total: number | null;
          today_total: number | null;
          unallocated_count: number | null;
          latest_payment_at: string | null;
          refreshed_at: string | null;
        };
      };
      analytics_ikimina_monthly_mv: {
        Row: {
          ikimina_id: string;
          sacco_id: string | null;
          name: string | null;
          code: string | null;
          status: string | null;
          updated_at: string | null;
          month_total: number | null;
          active_member_count: number | null;
          contributing_members: number | null;
          last_contribution_at: string | null;
          refreshed_at: string | null;
        };
      };
      analytics_member_last_payment_mv: {
        Row: {
          member_id: string;
          sacco_id: string | null;
          ikimina_id: string | null;
          member_code: string | null;
          full_name: string;
          msisdn: string | null;
          status: string | null;
          ikimina_name: string | null;
          last_payment_at: string | null;
          days_since_last: number | null;
          refreshed_at: string | null;
        };
      };
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
      search_saccos_trgm: {
        Args: { q: string };
        Returns: Array<{
          id: string;
          name: string;
          district: string;
          sector_code: string;
          similarity: number;
        }>;
      };
      sum_group_deposits: {
        Args: { gid: string };
        Returns: Json;
      };
    };

    Enums: {
      app_role: "SYSTEM_ADMIN" | "SACCO_MANAGER" | "SACCO_STAFF" | "SACCO_VIEWER";
      group_invite_status: "sent" | "accepted" | "expired";
      join_request_status: "pending" | "approved" | "rejected";
      member_id_type: "NID" | "DL" | "PASSPORT";
      notification_type: "new_member" | "payment_confirmed" | "invite_accepted";
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

  authx: {
    Tables: {
      user_mfa: {
        Row: {
          user_id: string;
          preferred_factor: string;
          enrollment: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferred_factor?: string;
          enrollment?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferred_factor?: string;
          enrollment?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_mfa_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      otp_issues: {
        Row: {
          id: string;
          user_id: string;
          channel: string;
          code_hash: string | null;
          legacy_code_id: string | null;
          meta: Json | null;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: string;
          code_hash?: string | null;
          legacy_code_id?: string | null;
          meta?: Json | null;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: string;
          code_hash?: string | null;
          legacy_code_id?: string | null;
          meta?: Json | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "otp_issues_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      audit: {
        Row: {
          id: string;
          actor: string | null;
          action: string;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor?: string | null;
          action: string;
          detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor?: string | null;
          action?: string;
          detail?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      webauthn_credentials: {
        Row: {
          id: string;
          user_id: string;
          credential_id: string;
          public_key: string;
          counter: number | null;
          transports: string[] | null;
          created_at: string | null;
          last_used_at: string | null;
        };
      };
      trusted_devices: {
        Row: {
          user_id: string;
          device_id: string;
          device_fingerprint_hash: string;
          user_agent_hash: string;
          ip_prefix: string | null;
          created_at: string | null;
          last_used_at: string | null;
        };
      };
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
