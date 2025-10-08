export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string
          id: string
          owner_id: string
          owner_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          owner_id: string
          owner_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          owner_id?: string
          owner_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string | null
          diff_json: Json | null
          entity: string
          entity_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string | null
          diff_json?: Json | null
          entity: string
          entity_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string | null
          diff_json?: Json | null
          entity?: string
          entity_id?: string
          id?: string
        }
        Relationships: []
      }
      ibimina: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          sacco_id: string
          settings_json: Json
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          sacco_id: string
          settings_json?: Json
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          sacco_id?: string
          settings_json?: Json
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ibimina_sacco_id_fkey"
            columns: ["sacco_id"]
            isOneToOne: false
            referencedRelation: "saccos"
            referencedColumns: ["id"]
          },
        ]
      }
      ikimina_members: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          ikimina_id: string
          joined_at: string | null
          member_code: string | null
          msisdn: string
          msisdn_encrypted: string | null
          msisdn_hash: string | null
          msisdn_masked: string | null
          national_id: string | null
          national_id_encrypted: string | null
          national_id_hash: string | null
          national_id_masked: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          ikimina_id: string
          joined_at?: string | null
          member_code?: string | null
          msisdn: string
          msisdn_encrypted?: string | null
          msisdn_hash?: string | null
          msisdn_masked?: string | null
          national_id?: string | null
          national_id_encrypted?: string | null
          national_id_hash?: string | null
          national_id_masked?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          ikimina_id?: string
          joined_at?: string | null
          member_code?: string | null
          msisdn?: string
          msisdn_encrypted?: string | null
          msisdn_hash?: string | null
          msisdn_masked?: string | null
          national_id?: string | null
          national_id_encrypted?: string | null
          national_id_hash?: string | null
          national_id_masked?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ikimina_members_ikimina_id_fkey"
            columns: ["ikimina_id"]
            isOneToOne: false
            referencedRelation: "ibimina"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string | null
          credit_id: string
          currency: string
          debit_id: string
          external_id: string | null
          id: string
          memo: string | null
          value_date: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_id: string
          currency?: string
          debit_id: string
          external_id?: string | null
          id?: string
          memo?: string | null
          value_date: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_id?: string
          currency?: string
          debit_id?: string
          external_id?: string | null
          id?: string
          memo?: string | null
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_debit_id_fkey"
            columns: ["debit_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          ai_version: string | null
          amount: number
          channel: string
          confidence: number | null
          created_at: string | null
          currency: string
          id: string
          ikimina_id: string | null
          member_id: string | null
          msisdn: string
          msisdn_encrypted: string | null
          msisdn_hash: string | null
          msisdn_masked: string | null
          occurred_at: string
          reference: string | null
          sacco_id: string
          source_id: string | null
          status: string
          txn_id: string
        }
        Insert: {
          ai_version?: string | null
          amount: number
          channel?: string
          confidence?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ikimina_id?: string | null
          member_id?: string | null
          msisdn: string
          msisdn_encrypted?: string | null
          msisdn_hash?: string | null
          msisdn_masked?: string | null
          occurred_at: string
          reference?: string | null
          sacco_id: string
          source_id?: string | null
          status?: string
          txn_id: string
        }
        Update: {
          ai_version?: string | null
          amount?: number
          channel?: string
          confidence?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ikimina_id?: string | null
          member_id?: string | null
          msisdn?: string
          msisdn_encrypted?: string | null
          msisdn_hash?: string | null
          msisdn_masked?: string | null
          occurred_at?: string
          reference?: string | null
          sacco_id?: string
          source_id?: string | null
          status?: string
          txn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_ikimina_id_fkey"
            columns: ["ikimina_id"]
            isOneToOne: false
            referencedRelation: "ibimina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "ikimina_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sacco_id_fkey"
            columns: ["sacco_id"]
            isOneToOne: false
            referencedRelation: "saccos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sms_inbox"
            referencedColumns: ["id"]
          },
        ]
      }
      saccos: {
        Row: {
          category: string | null
          created_at: string | null
          district: string
          email: string | null
          id: string
          merchant_code: string | null
          name: string
          province: string | null
          sector_code: string
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          district: string
          email?: string | null
          id?: string
          merchant_code?: string | null
          name: string
          province?: string | null
          sector_code: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          district?: string
          email?: string | null
          id?: string
          merchant_code?: string | null
          name?: string
          province?: string | null
          sector_code?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_inbox: {
        Row: {
          confidence: number | null
          created_at: string | null
          error: string | null
          id: string
          msisdn: string | null
          msisdn_encrypted: string | null
          msisdn_hash: string | null
          msisdn_masked: string | null
          parse_source: string | null
          parsed_json: Json | null
          raw_text: string
          received_at: string
          sacco_id: string | null
          status: string
          vendor_meta: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          msisdn?: string | null
          msisdn_encrypted?: string | null
          msisdn_hash?: string | null
          msisdn_masked?: string | null
          parse_source?: string | null
          parsed_json?: Json | null
          raw_text: string
          received_at: string
          sacco_id?: string | null
          status?: string
          vendor_meta?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          msisdn?: string | null
          msisdn_encrypted?: string | null
          msisdn_hash?: string | null
          msisdn_masked?: string | null
          parse_source?: string | null
          parsed_json?: Json | null
          raw_text?: string
          received_at?: string
          sacco_id?: string | null
          status?: string
          vendor_meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_inbox_sacco_id_fkey"
            columns: ["sacco_id"]
            isOneToOne: false
            referencedRelation: "saccos"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          sacco_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          sacco_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          sacco_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_sacco_id_fkey"
            columns: ["sacco_id"]
            isOneToOne: false
            referencedRelation: "saccos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ikimina_members_public: {
        Row: {
          id: string
          ikimina_id: string
          member_code: string | null
          full_name: string
          status: string
          joined_at: string | null
          msisdn: string | null
          national_id: string | null
          ikimina_name: string | null
          sacco_id: string | null
        }
      }
    }
    Functions: {
      get_user_sacco: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "SYSTEM_ADMIN" | "SACCO_MANAGER" | "SACCO_STAFF"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["SYSTEM_ADMIN", "SACCO_MANAGER", "SACCO_STAFF"],
    },
  },
} as const
