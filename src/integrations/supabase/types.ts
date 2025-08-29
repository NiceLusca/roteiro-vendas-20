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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      automation_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          process_type: string
          processed_count: number | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          process_type: string
          processed_count?: number | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          process_type?: string
          processed_count?: number | null
          status?: string
        }
        Relationships: []
      }
      message_log: {
        Row: {
          created_at: string
          id: string
          message_type: string
          sent_at: string
          status: string | null
          subscription_id: string
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_type: string
          sent_at?: string
          status?: string | null
          subscription_id: string
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          message_type?: string
          sent_at?: string
          status?: string | null
          subscription_id?: string
          webhook_data?: Json | null
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number
          message_type: string
          scheduled_time: string
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          message_type: string
          scheduled_time: string
          status?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          message_type?: string
          scheduled_time?: string
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          changed_by: string | null
          created_at: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          subscription_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          subscription_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          subscription_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_messages_enabled: boolean | null
          billing_history: Json | null
          closer: string | null
          cobranca_1: string | null
          cobranca_2: string | null
          cobranca_3: string | null
          created_at: string
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string
          customer_whatsapp: string | null
          end_date: string | null
          id: string
          installment_value: number | null
          installments_count: number | null
          last_message_sent_at: string | null
          last_payment_date: string | null
          manual_negotiation: boolean | null
          mentoria: string
          next_due_date: string | null
          observations: Json | null
          paid_installments: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          remaining_installments: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          subscription_code: string | null
          total_value: number | null
          updated_at: string
          user_id: string
          welcome_sent: boolean | null
        }
        Insert: {
          auto_messages_enabled?: boolean | null
          billing_history?: Json | null
          closer?: string | null
          cobranca_1?: string | null
          cobranca_2?: string | null
          cobranca_3?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name: string
          customer_whatsapp?: string | null
          end_date?: string | null
          id?: string
          installment_value?: number | null
          installments_count?: number | null
          last_message_sent_at?: string | null
          last_payment_date?: string | null
          manual_negotiation?: boolean | null
          mentoria: string
          next_due_date?: string | null
          observations?: Json | null
          paid_installments?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          remaining_installments?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          subscription_code?: string | null
          total_value?: number | null
          updated_at?: string
          user_id: string
          welcome_sent?: boolean | null
        }
        Update: {
          auto_messages_enabled?: boolean | null
          billing_history?: Json | null
          closer?: string | null
          cobranca_1?: string | null
          cobranca_2?: string | null
          cobranca_3?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_whatsapp?: string | null
          end_date?: string | null
          id?: string
          installment_value?: number | null
          installments_count?: number | null
          last_message_sent_at?: string | null
          last_payment_date?: string | null
          manual_negotiation?: boolean | null
          mentoria?: string
          next_due_date?: string | null
          observations?: Json | null
          paid_installments?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          remaining_installments?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          subscription_code?: string | null
          total_value?: number | null
          updated_at?: string
          user_id?: string
          welcome_sent?: boolean | null
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
      lead_status:
        | "ativo"
        | "pago"
        | "cancelado"
        | "vencido"
        | "quitado"
        | "negociando"
      payment_method:
        | "PIX"
        | "Cartão"
        | "Boleto"
        | "Outro"
        | "PIX OCEANO"
        | "PIX EDUZZ"
        | "CARTÃO EDUZZ"
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
      lead_status: [
        "ativo",
        "pago",
        "cancelado",
        "vencido",
        "quitado",
        "negociando",
      ],
      payment_method: [
        "PIX",
        "Cartão",
        "Boleto",
        "Outro",
        "PIX OCEANO",
        "PIX EDUZZ",
        "CARTÃO EDUZZ",
      ],
    },
  },
} as const
