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
      appointments: {
        Row: {
          created_at: string | null
          data_hora: string
          duracao_minutos: number | null
          end_at: string | null
          id: string
          lead_id: string
          notas: string | null
          resultado_sessao:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          start_at: string | null
          status: Database["public"]["Enums"]["status_appointment"] | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora: string
          duracao_minutos?: number | null
          end_at?: string | null
          id?: string
          lead_id: string
          notas?: string | null
          resultado_sessao?:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["status_appointment"] | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string
          duracao_minutos?: number | null
          end_at?: string | null
          id?: string
          lead_id?: string
          notas?: string | null
          resultado_sessao?:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["status_appointment"] | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          alteracao: Json | null
          ator: string | null
          entidade: string
          entidade_id: string
          id: string
          timestamp: string | null
        }
        Insert: {
          alteracao?: Json | null
          ator?: string | null
          entidade: string
          entidade_id: string
          id?: string
          timestamp?: string | null
        }
        Update: {
          alteracao?: Json | null
          ator?: string | null
          entidade?: string
          entidade_id?: string
          id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      bulk_import_logs: {
        Row: {
          created_at: string | null
          error_count: number | null
          errors: Json | null
          id: string
          status: string
          success_count: number | null
          total_records: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          status: string
          success_count?: number | null
          total_records?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          status?: string
          success_count?: number | null
          total_records?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      deal_products: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          product_id: string
          quantidade: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          product_id: string
          quantidade?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          product_id?: string
          quantidade?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_products_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string | null
          data_fechamento: string | null
          id: string
          lead_id: string
          motivo_perda: string | null
          produto_id: string | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["status_deal"] | null
          updated_at: string | null
          valor_proposto: number
          valor_recorrente: number | null
        }
        Insert: {
          created_at?: string | null
          data_fechamento?: string | null
          id?: string
          lead_id: string
          motivo_perda?: string | null
          produto_id?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["status_deal"] | null
          updated_at?: string | null
          valor_proposto: number
          valor_recorrente?: number | null
        }
        Update: {
          created_at?: string | null
          data_fechamento?: string | null
          id?: string
          lead_id?: string
          motivo_perda?: string | null
          produto_id?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["status_deal"] | null
          updated_at?: string | null
          valor_proposto?: number
          valor_recorrente?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          canal: Database["public"]["Enums"]["canal_interacao"]
          created_at: string | null
          data_hora: string | null
          descricao: string
          id: string
          lead_id: string
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal_interacao"]
          created_at?: string | null
          data_hora?: string | null
          descricao: string
          id?: string
          lead_id: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_interacao"]
          created_at?: string | null
          data_hora?: string | null
          descricao?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json | null
          id: string
          lead_id: string
          performed_by: string | null
          performed_by_name: string | null
          pipeline_entry_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          lead_id: string
          performed_by?: string | null
          performed_by_name?: string | null
          pipeline_entry_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          lead_id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          pipeline_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_log_pipeline_entry_id_fkey"
            columns: ["pipeline_entry_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attachments_metadata: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          lead_id: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_attachments_metadata_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attachments_metadata_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_criteria_state: {
        Row: {
          created_at: string | null
          criterio_id: string
          id: string
          lead_id: string
          status: string
          updated_at: string | null
          validado_em: string | null
          validado_por: string | null
          valor_validacao: string | null
        }
        Insert: {
          created_at?: string | null
          criterio_id: string
          id?: string
          lead_id: string
          status: string
          updated_at?: string | null
          validado_em?: string | null
          validado_por?: string | null
          valor_validacao?: string | null
        }
        Update: {
          created_at?: string | null
          criterio_id?: string
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string | null
          validado_em?: string | null
          validado_por?: string | null
          valor_validacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_criteria_states_criterio_id_fkey"
            columns: ["criterio_id"]
            isOneToOne: false
            referencedRelation: "stage_advancement_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_criteria_states_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          note_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          note_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          note_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_pipeline_entries: {
        Row: {
          agendamento_sla_id: string | null
          created_at: string | null
          data_conclusao: string | null
          data_entrada_etapa: string | null
          data_inscricao: string | null
          etapa_atual_id: string | null
          id: string
          lead_id: string
          pipeline_id: string
          saude_etapa: string | null
          status_inscricao: string | null
          updated_at: string | null
        }
        Insert: {
          agendamento_sla_id?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_entrada_etapa?: string | null
          data_inscricao?: string | null
          etapa_atual_id?: string | null
          id?: string
          lead_id: string
          pipeline_id: string
          saude_etapa?: string | null
          status_inscricao?: string | null
          updated_at?: string | null
        }
        Update: {
          agendamento_sla_id?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          data_entrada_etapa?: string | null
          data_inscricao?: string | null
          etapa_atual_id?: string | null
          id?: string
          lead_id?: string
          pipeline_id?: string
          saude_etapa?: string | null
          status_inscricao?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_pipeline_entries_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_pipeline_entries_pipeline"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_pipeline_entries_stage"
            columns: ["etapa_atual_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_pipeline_entries_agendamento_sla_id_fkey"
            columns: ["agendamento_sla_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_responsibility_history: {
        Row: {
          action: string
          created_at: string | null
          id: string
          lead_id: string
          notes: string | null
          performed_by: string | null
          performed_by_name: string | null
          pipeline_entry_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          pipeline_entry_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          pipeline_entry_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_responsibility_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_responsibility_history_pipeline_entry_id_fkey"
            columns: ["pipeline_entry_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_responsibles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          lead_id: string
          pipeline_entry_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          lead_id: string
          pipeline_entry_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          lead_id?: string
          pipeline_entry_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_responsibles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_responsibles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_responsibles_pipeline_entry_id_fkey"
            columns: ["pipeline_entry_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_responsibles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_tag_assignments: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closer: string | null
          created_at: string | null
          desejo_na_sessao: string | null
          email: string | null
          faturamento_medio: number | null
          id: string
          ja_vendeu_no_digital: boolean | null
          lead_score: number | null
          lead_score_classification: string | null
          meta_faturamento: number | null
          nome: string
          objecao_obs: string | null
          objecao_principal:
            | Database["public"]["Enums"]["objecao_principal"]
            | null
          observacoes: string | null
          origem: string | null
          resultado_obs_ultima_sessao: string | null
          resultado_sessao_ultimo: string | null
          segmento: string | null
          seguidores: number | null
          status_geral: Database["public"]["Enums"]["status_geral"] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          valor_lead: number | null
          whatsapp: string | null
        }
        Insert: {
          closer?: string | null
          created_at?: string | null
          desejo_na_sessao?: string | null
          email?: string | null
          faturamento_medio?: number | null
          id?: string
          ja_vendeu_no_digital?: boolean | null
          lead_score?: number | null
          lead_score_classification?: string | null
          meta_faturamento?: number | null
          nome: string
          objecao_obs?: string | null
          objecao_principal?:
            | Database["public"]["Enums"]["objecao_principal"]
            | null
          observacoes?: string | null
          origem?: string | null
          resultado_obs_ultima_sessao?: string | null
          resultado_sessao_ultimo?: string | null
          segmento?: string | null
          seguidores?: number | null
          status_geral?: Database["public"]["Enums"]["status_geral"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          valor_lead?: number | null
          whatsapp?: string | null
        }
        Update: {
          closer?: string | null
          created_at?: string | null
          desejo_na_sessao?: string | null
          email?: string | null
          faturamento_medio?: number | null
          id?: string
          ja_vendeu_no_digital?: boolean | null
          lead_score?: number | null
          lead_score_classification?: string | null
          meta_faturamento?: number | null
          nome?: string
          objecao_obs?: string | null
          objecao_principal?:
            | Database["public"]["Enums"]["objecao_principal"]
            | null
          observacoes?: string | null
          origem?: string | null
          resultado_obs_ultima_sessao?: string | null
          resultado_sessao_ultimo?: string | null
          segmento?: string | null
          seguidores?: number | null
          status_geral?: Database["public"]["Enums"]["status_geral"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          valor_lead?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          appointment_reminders: boolean | null
          automation_updates: boolean | null
          browser_notifications: boolean | null
          created_at: string | null
          id: string
          inactivity_alerts: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sla_breaches: boolean | null
          sound_enabled: boolean | null
          stage_timeouts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean | null
          automation_updates?: boolean | null
          browser_notifications?: boolean | null
          created_at?: string | null
          id?: string
          inactivity_alerts?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sla_breaches?: boolean | null
          sound_enabled?: boolean | null
          stage_timeouts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean | null
          automation_updates?: boolean | null
          browser_notifications?: boolean | null
          created_at?: string | null
          id?: string
          inactivity_alerts?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sla_breaches?: boolean | null
          sound_enabled?: boolean | null
          stage_timeouts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          dismissed: boolean | null
          id: string
          lead_id: string | null
          lead_name: string | null
          message: string
          priority: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          message: string
          priority?: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          message?: string
          priority?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          recorrencia: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id?: string | null
          quantidade?: number
          recorrencia?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          recorrencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          closer: string | null
          created_at: string | null
          data_pedido: string | null
          data_venda: string | null
          deal_id: string
          id: string
          lead_id: string | null
          status_pagamento: Database["public"]["Enums"]["status_pedido"] | null
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          closer?: string | null
          created_at?: string | null
          data_pedido?: string | null
          data_venda?: string | null
          deal_id: string
          id?: string
          lead_id?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pedido"] | null
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          closer?: string | null
          created_at?: string | null
          data_pedido?: string | null
          data_venda?: string | null
          deal_id?: string
          id?: string
          lead_id?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pedido"] | null
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_access: {
        Row: {
          access_level: string
          created_at: string | null
          created_by: string | null
          id: string
          pipeline_id: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          pipeline_id: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          pipeline_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_access_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          ativo: boolean | null
          closer_padrao: string | null
          cor_grupo: string | null
          created_at: string | null
          criterios_avanco: Json | null
          duracao_minutos: number | null
          entrada_criteria: Json | null
          gerar_agendamento_auto: boolean | null
          grupo: string | null
          horarios_preferenciais: Json | null
          id: string
          nome: string
          ordem: number
          pipeline_id: string
          prazo_em_dias: number | null
          proxima_etapa_id: string | null
          proximo_passo_label: string | null
          proximo_passo_template: string | null
          proximo_passo_tipo: string | null
          requer_agendamento: boolean | null
          saida_criteria: Json | null
          sla_baseado_em: string | null
          sla_horas: number | null
          template_agendamento: string | null
          tipo_agendamento: string | null
          updated_at: string | null
          wip_limit: number | null
        }
        Insert: {
          ativo?: boolean | null
          closer_padrao?: string | null
          cor_grupo?: string | null
          created_at?: string | null
          criterios_avanco?: Json | null
          duracao_minutos?: number | null
          entrada_criteria?: Json | null
          gerar_agendamento_auto?: boolean | null
          grupo?: string | null
          horarios_preferenciais?: Json | null
          id?: string
          nome: string
          ordem: number
          pipeline_id: string
          prazo_em_dias?: number | null
          proxima_etapa_id?: string | null
          proximo_passo_label?: string | null
          proximo_passo_template?: string | null
          proximo_passo_tipo?: string | null
          requer_agendamento?: boolean | null
          saida_criteria?: Json | null
          sla_baseado_em?: string | null
          sla_horas?: number | null
          template_agendamento?: string | null
          tipo_agendamento?: string | null
          updated_at?: string | null
          wip_limit?: number | null
        }
        Update: {
          ativo?: boolean | null
          closer_padrao?: string | null
          cor_grupo?: string | null
          created_at?: string | null
          criterios_avanco?: Json | null
          duracao_minutos?: number | null
          entrada_criteria?: Json | null
          gerar_agendamento_auto?: boolean | null
          grupo?: string | null
          horarios_preferenciais?: Json | null
          id?: string
          nome?: string
          ordem?: number
          pipeline_id?: string
          prazo_em_dias?: number | null
          proxima_etapa_id?: string | null
          proximo_passo_label?: string | null
          proximo_passo_template?: string | null
          proximo_passo_tipo?: string | null
          requer_agendamento?: boolean | null
          saida_criteria?: Json | null
          sla_baseado_em?: string | null
          sla_horas?: number | null
          template_agendamento?: string | null
          tipo_agendamento?: string | null
          updated_at?: string | null
          wip_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_proxima_etapa_id_fkey"
            columns: ["proxima_etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          display_config: Json | null
          id: string
          nome: string
          objetivo: string | null
          primary_pipeline: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          display_config?: Json | null
          id?: string
          nome: string
          objetivo?: string | null
          primary_pipeline?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          display_config?: Json | null
          id?: string
          nome?: string
          objetivo?: string | null
          primary_pipeline?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          nome: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          nome?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          nome?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          success: boolean | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity: string
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stage_advancement_criteria: {
        Row: {
          ativo: boolean | null
          campo: string | null
          created_at: string | null
          etapa_id: string
          id: string
          obrigatorio: boolean | null
          operador: string | null
          tipo: string
          updated_at: string | null
          valor_esperado: string | null
        }
        Insert: {
          ativo?: boolean | null
          campo?: string | null
          created_at?: string | null
          etapa_id: string
          id?: string
          obrigatorio?: boolean | null
          operador?: string | null
          tipo: string
          updated_at?: string | null
          valor_esperado?: string | null
        }
        Update: {
          ativo?: boolean | null
          campo?: string | null
          created_at?: string | null
          etapa_id?: string
          id?: string
          obrigatorio?: boolean | null
          operador?: string | null
          tipo?: string
          updated_at?: string | null
          valor_esperado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advancement_criteria_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_checklist_items: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          etapa_id: string
          id: string
          obrigatorio: boolean | null
          ordem: number | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          etapa_id: string
          id?: string
          obrigatorio?: boolean | null
          ordem?: number | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          etapa_id?: string
          id?: string
          obrigatorio?: boolean | null
          ordem?: number | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_checklist_items_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decode_html_entities: { Args: { input_text: string }; Returns: string }
      fix_utf8_encoding: { Args: { input_text: string }; Returns: string }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_pipeline_access_level: {
        Args: { _pipeline_id: string; _user_id: string }
        Returns: string
      }
      has_pipeline_access: {
        Args: { _min_level?: string; _pipeline_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: string
          p_severity: string
          p_success?: boolean
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      refresh_pipeline_metrics: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      canal_interacao:
        | "whatsapp"
        | "email"
        | "telefone"
        | "presencial"
        | "outro"
      objecao_principal:
        | "preco"
        | "tempo"
        | "confianca"
        | "necessidade"
        | "outro"
      resultado_sessao: "positivo" | "neutro" | "negativo"
      status_appointment:
        | "agendado"
        | "confirmado"
        | "realizado"
        | "cancelado"
        | "remarcado"
      status_deal: "aberto" | "ganho" | "perdido"
      status_geral:
        | "lead"
        | "qualificado"
        | "reuniao_marcada"
        | "em_negociacao"
        | "cliente"
        | "perdido"
      status_pedido: "pendente" | "pago" | "cancelado"
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
      app_role: ["admin", "moderator", "user"],
      canal_interacao: ["whatsapp", "email", "telefone", "presencial", "outro"],
      objecao_principal: [
        "preco",
        "tempo",
        "confianca",
        "necessidade",
        "outro",
      ],
      resultado_sessao: ["positivo", "neutro", "negativo"],
      status_appointment: [
        "agendado",
        "confirmado",
        "realizado",
        "cancelado",
        "remarcado",
      ],
      status_deal: ["aberto", "ganho", "perdido"],
      status_geral: [
        "lead",
        "qualificado",
        "reuniao_marcada",
        "em_negociacao",
        "cliente",
        "perdido",
      ],
      status_pedido: ["pendente", "pago", "cancelado"],
    },
  },
} as const
