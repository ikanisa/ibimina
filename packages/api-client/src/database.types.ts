/**
 * Database types placeholder
 * 
 * These types should be generated from your Supabase schema using:
 * npx supabase gen types typescript --project-id <project-id> > database.types.ts
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          role: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          email: string;
          phone: string;
          role?: string;
          status?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          role?: string;
          status?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          provider: string;
          amount: number;
          reference: string;
          sender_phone: string;
          status: string;
          parsed_at: string | null;
          sms_timestamp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          transaction_id?: string | null;
          provider: string;
          amount: number;
          reference: string;
          sender_phone: string;
          status?: string;
          parsed_at?: string | null;
          sms_timestamp?: string | null;
        };
        Update: {
          status?: string;
          transaction_id?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          currency: string;
          status: string;
          reference: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          amount: number;
          currency?: string;
          status?: string;
          reference: string;
          description?: string | null;
        };
        Update: {
          status?: string;
          description?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
  };
}
