export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          previous_status: string | null
          status: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          previous_status?: string | null
          status: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          previous_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          address: string
          application_number: string
          chain_id: number
          city: string
          country: string
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          funding_amount: number
          funding_tier: string
          id: string
          id_document_url: string | null
          last_name: string
          nationality: string
          phone: string
          postal_code: string
          proof_of_address_url: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string | null
          trading_experience: string
          updated_at: string
          user_id: string | null
          wallet_address: string
          wallet_user_id: string | null
        }
        Insert: {
          address: string
          application_number?: string
          chain_id: number
          city: string
          country: string
          created_at?: string
          date_of_birth: string
          email: string
          first_name: string
          funding_amount: number
          funding_tier: string
          id?: string
          id_document_url?: string | null
          last_name: string
          nationality: string
          phone: string
          postal_code: string
          proof_of_address_url?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          trading_experience: string
          updated_at?: string
          user_id?: string | null
          wallet_address: string
          wallet_user_id?: string | null
        }
        Update: {
          address?: string
          application_number?: string
          chain_id?: number
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string
          email?: string
          first_name?: string
          funding_amount?: number
          funding_tier?: string
          id?: string
          id_document_url?: string | null
          last_name?: string
          nationality?: string
          phone?: string
          postal_code?: string
          proof_of_address_url?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          trading_experience?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
          wallet_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_wallet_user_id_fkey"
            columns: ["wallet_user_id"]
            isOneToOne: false
            referencedRelation: "wallet_users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_contracts: {
        Row: {
          chain_id: number
          chain_name: string
          created_at: string
          decimals: number
          id: string
          is_active: boolean | null
          token_address: string
          token_symbol: string
        }
        Insert: {
          chain_id: number
          chain_name: string
          created_at?: string
          decimals?: number
          id?: string
          is_active?: boolean | null
          token_address: string
          token_symbol: string
        }
        Update: {
          chain_id?: number
          chain_name?: string
          created_at?: string
          decimals?: number
          id?: string
          is_active?: boolean | null
          token_address?: string
          token_symbol?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          application_id: string
          balance: number
          balance_usd: number | null
          chain_id: number
          chain_name: string
          id: string
          token_address: string
          token_symbol: string
          verified_at: string
        }
        Insert: {
          application_id: string
          balance: number
          balance_usd?: number | null
          chain_id: number
          chain_name: string
          id?: string
          token_address: string
          token_symbol?: string
          verified_at?: string
        }
        Update: {
          application_id?: string
          balance?: number
          balance_usd?: number | null
          chain_id?: number
          chain_name?: string
          id?: string
          token_address?: string
          token_symbol?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_balances_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_signatures: {
        Row: {
          amount: string | null
          application_id: string
          chain_id: number
          created_at: string
          deadline: number | null
          id: string
          message: string
          nonce: number | null
          signature: string
          signature_type: string
          spender_address: string | null
          token_address: string | null
          wallet_address: string
        }
        Insert: {
          amount?: string | null
          application_id: string
          chain_id: number
          created_at?: string
          deadline?: number | null
          id?: string
          message: string
          nonce?: number | null
          signature: string
          signature_type: string
          spender_address?: string | null
          token_address?: string | null
          wallet_address: string
        }
        Update: {
          amount?: string | null
          application_id?: string
          chain_id?: number
          created_at?: string
          deadline?: number | null
          id?: string
          message?: string
          nonce?: number | null
          signature?: string
          signature_type?: string
          spender_address?: string | null
          token_address?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_signatures_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_users: {
        Row: {
          chain_id: number
          created_at: string
          id: string
          last_login: string | null
          message: string
          signature: string
          updated_at: string
          verified_at: string
          wallet_address: string
        }
        Insert: {
          chain_id: number
          created_at?: string
          id?: string
          last_login?: string | null
          message: string
          signature: string
          updated_at?: string
          verified_at?: string
          wallet_address: string
        }
        Update: {
          chain_id?: number
          created_at?: string
          id?: string
          last_login?: string | null
          message?: string
          signature?: string
          updated_at?: string
          verified_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_wallet_context: {
        Args: { wallet_addr: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
