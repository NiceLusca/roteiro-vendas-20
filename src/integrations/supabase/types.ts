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
      appointment_events: {
        Row: {
          antes: Json | null
          appointment_id: string
          ator: string
          depois: Json | null
          id: string
          timestamp: string | null
          tipo: string
        }
        Insert: {
          antes?: Json | null
          appointment_id: string
          ator: string
          depois?: Json | null
          id?: string
          timestamp?: string | null
          tipo: string
        }
        Update: {
          antes?: Json | null
          appointment_id?: string
          ator?: string
          depois?: Json | null
          id?: string
          timestamp?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string | null
          criado_por: string | null
          end_at: string
          id: string
          lead_id: string
          observacao: string | null
          origem: string | null
          resultado_obs: string | null
          resultado_sessao:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          start_at: string
          status: Database["public"]["Enums"]["status_appointment"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          end_at: string
          id?: string
          lead_id: string
          observacao?: string | null
          origem?: string | null
          resultado_obs?: string | null
          resultado_sessao?:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          start_at: string
          status?: Database["public"]["Enums"]["status_appointment"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          end_at?: string
          id?: string
          lead_id?: string
          observacao?: string | null
          origem?: string | null
          resultado_obs?: string | null
          resultado_sessao?:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          start_at?: string
          status?: Database["public"]["Enums"]["status_appointment"] | null
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
          alteracao: Json
          ator: string
          entidade: string
          entidade_id: string
          id: string
          timestamp: string | null
        }
        Insert: {
          alteracao: Json
          ator: string
          entidade: string
          entidade_id: string
          id?: string
          timestamp?: string | null
        }
        Update: {
          alteracao?: Json
          ator?: string
          entidade?: string
          entidade_id?: string
          id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      deal_lost_reasons: {
        Row: {
          deal_id: string
          detalhes: string | null
          id: string
          motivo: Database["public"]["Enums"]["objecao_principal"]
          timestamp: string | null
        }
        Insert: {
          deal_id: string
          detalhes?: string | null
          id?: string
          motivo: Database["public"]["Enums"]["objecao_principal"]
          timestamp?: string | null
        }
        Update: {
          deal_id?: string
          detalhes?: string | null
          id?: string
          motivo?: Database["public"]["Enums"]["objecao_principal"]
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_lost_reasons_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          closer: string | null
          created_at: string | null
          fase_negociacao: string | null
          id: string
          lead_id: string
          product_id: string | null
          status: Database["public"]["Enums"]["status_deal"] | null
          updated_at: string | null
          valor_proposto: number
        }
        Insert: {
          closer?: string | null
          created_at?: string | null
          fase_negociacao?: string | null
          id?: string
          lead_id: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["status_deal"] | null
          updated_at?: string | null
          valor_proposto?: number
        }
        Update: {
          closer?: string | null
          created_at?: string | null
          fase_negociacao?: string | null
          id?: string
          lead_id?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["status_deal"] | null
          updated_at?: string | null
          valor_proposto?: number
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
            foreignKeyName: "deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          autor: string
          canal: Database["public"]["Enums"]["canal_interacao"]
          conteudo: string
          id: string
          lead_id: string
          timestamp: string | null
        }
        Insert: {
          autor: string
          canal: Database["public"]["Enums"]["canal_interacao"]
          conteudo: string
          id?: string
          lead_id: string
          timestamp?: string | null
        }
        Update: {
          autor?: string
          canal?: Database["public"]["Enums"]["canal_interacao"]
          conteudo?: string
          id?: string
          lead_id?: string
          timestamp?: string | null
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
      lead_form_submissions: {
        Row: {
          id: string
          lead_id: string
          origem_form: string
          payload: Json
          timestamp: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          origem_form: string
          payload: Json
          timestamp?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          origem_form?: string
          payload?: Json
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_form_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pipeline_entries: {
        Row: {
          checklist_state: Json | null
          created_at: string | null
          data_entrada_etapa: string | null
          data_prevista_proxima_etapa: string | null
          dias_em_atraso: number | null
          etapa_atual_id: string
          id: string
          lead_id: string
          nota_etapa: string | null
          pipeline_id: string
          saude_etapa: Database["public"]["Enums"]["saude_etapa"] | null
          status_inscricao: string | null
          tempo_em_etapa_dias: number | null
          updated_at: string | null
        }
        Insert: {
          checklist_state?: Json | null
          created_at?: string | null
          data_entrada_etapa?: string | null
          data_prevista_proxima_etapa?: string | null
          dias_em_atraso?: number | null
          etapa_atual_id: string
          id?: string
          lead_id: string
          nota_etapa?: string | null
          pipeline_id: string
          saude_etapa?: Database["public"]["Enums"]["saude_etapa"] | null
          status_inscricao?: string | null
          tempo_em_etapa_dias?: number | null
          updated_at?: string | null
        }
        Update: {
          checklist_state?: Json | null
          created_at?: string | null
          data_entrada_etapa?: string | null
          data_prevista_proxima_etapa?: string | null
          dias_em_atraso?: number | null
          etapa_atual_id?: string
          id?: string
          lead_id?: string
          nota_etapa?: string | null
          pipeline_id?: string
          saude_etapa?: Database["public"]["Enums"]["saude_etapa"] | null
          status_inscricao?: string | null
          tempo_em_etapa_dias?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_pipeline_entries_etapa_atual_id_fkey"
            columns: ["etapa_atual_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_pipeline_entries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_pipeline_entries_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
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
          lead_score_classification:
            | Database["public"]["Enums"]["lead_score_class"]
            | null
          meta_faturamento: number | null
          nome: string
          objecao_obs: string | null
          objecao_principal:
            | Database["public"]["Enums"]["objecao_principal"]
            | null
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_lead"]
          resultado_obs_ultima_sessao: string | null
          resultado_sessao_ultimo:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          segmento: string | null
          seguidores: number | null
          status_geral: Database["public"]["Enums"]["status_geral"]
          updated_at: string | null
          user_id: string | null
          whatsapp: string
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
          lead_score_classification?:
            | Database["public"]["Enums"]["lead_score_class"]
            | null
          meta_faturamento?: number | null
          nome: string
          objecao_obs?: string | null
          objecao_principal?:
            | Database["public"]["Enums"]["objecao_principal"]
            | null
          observacoes?: string | null
          origem: Database["public"]["Enums"]["origem_lead"]
          resultado_obs_ultima_sessao?: string | null
          resultado_sessao_ultimo?:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          segmento?: string | null
          seguidores?: number | null
          status_geral?: Database["public"]["Enums"]["status_geral"]
          updated_at?: string | null
          user_id?: string | null
          whatsapp: string
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
          lead_score_classification?:
            | Database["public"]["Enums"]["lead_score_class"]
            | null
          meta_faturamento?: number | null
          nome?: string
          objecao_obs?: string | null
          objecao_principal?:
            | Database["public"]["Enums"]["objecao_principal"]
            | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_lead"]
          resultado_obs_ultima_sessao?: string | null
          resultado_sessao_ultimo?:
            | Database["public"]["Enums"]["resultado_sessao"]
            | null
          segmento?: string | null
          seguidores?: number | null
          status_geral?: Database["public"]["Enums"]["status_geral"]
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantidade: number
          recorrencia: Database["public"]["Enums"]["recorrencia"] | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantidade?: number
          recorrencia?: Database["public"]["Enums"]["recorrencia"] | null
          valor?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantidade?: number
          recorrencia?: Database["public"]["Enums"]["recorrencia"] | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
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
          data_venda: string | null
          forma_pagamento: string | null
          id: string
          lead_id: string
          observacao: string | null
          status: Database["public"]["Enums"]["status_pedido"] | null
          total: number
          updated_at: string | null
        }
        Insert: {
          closer?: string | null
          created_at?: string | null
          data_venda?: string | null
          forma_pagamento?: string | null
          id?: string
          lead_id: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_pedido"] | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          closer?: string | null
          created_at?: string | null
          data_venda?: string | null
          forma_pagamento?: string | null
          id?: string
          lead_id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_pedido"] | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_events: {
        Row: {
          ator: string
          de_etapa_id: string | null
          detalhes: Json | null
          id: string
          lead_pipeline_entry_id: string
          para_etapa_id: string | null
          timestamp: string | null
          tipo: string
        }
        Insert: {
          ator: string
          de_etapa_id?: string | null
          detalhes?: Json | null
          id?: string
          lead_pipeline_entry_id: string
          para_etapa_id?: string | null
          timestamp?: string | null
          tipo: string
        }
        Update: {
          ator?: string
          de_etapa_id?: string | null
          detalhes?: Json | null
          id?: string
          lead_pipeline_entry_id?: string
          para_etapa_id?: string | null
          timestamp?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_events_de_etapa_id_fkey"
            columns: ["de_etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_events_lead_pipeline_entry_id_fkey"
            columns: ["lead_pipeline_entry_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_events_para_etapa_id_fkey"
            columns: ["para_etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string | null
          duracao_minutos: number | null
          entrada_criteria: string | null
          gerar_agendamento_auto: boolean | null
          id: string
          nome: string
          ordem: number
          pipeline_id: string
          prazo_em_dias: number
          proximo_passo_label: string | null
          proximo_passo_tipo:
            | Database["public"]["Enums"]["proximo_passo_tipo"]
            | null
          saida_criteria: string | null
          updated_at: string | null
          wip_limit: number | null
        }
        Insert: {
          created_at?: string | null
          duracao_minutos?: number | null
          entrada_criteria?: string | null
          gerar_agendamento_auto?: boolean | null
          id?: string
          nome: string
          ordem: number
          pipeline_id: string
          prazo_em_dias?: number
          proximo_passo_label?: string | null
          proximo_passo_tipo?:
            | Database["public"]["Enums"]["proximo_passo_tipo"]
            | null
          saida_criteria?: string | null
          updated_at?: string | null
          wip_limit?: number | null
        }
        Update: {
          created_at?: string | null
          duracao_minutos?: number | null
          entrada_criteria?: string | null
          gerar_agendamento_auto?: boolean | null
          id?: string
          nome?: string
          ordem?: number
          pipeline_id?: string
          prazo_em_dias?: number
          proximo_passo_label?: string | null
          proximo_passo_tipo?:
            | Database["public"]["Enums"]["proximo_passo_tipo"]
            | null
          saida_criteria?: string | null
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
        ]
      }
      pipeline_transfers: {
        Row: {
          ator: string
          de_etapa_id: string | null
          de_pipeline_id: string
          id: string
          lead_id: string
          motivo: string
          para_etapa_id: string | null
          para_pipeline_id: string
          timestamp: string | null
        }
        Insert: {
          ator: string
          de_etapa_id?: string | null
          de_pipeline_id: string
          id?: string
          lead_id: string
          motivo: string
          para_etapa_id?: string | null
          para_pipeline_id: string
          timestamp?: string | null
        }
        Update: {
          ator?: string
          de_etapa_id?: string | null
          de_pipeline_id?: string
          id?: string
          lead_id?: string
          motivo?: string
          para_etapa_id?: string | null
          para_pipeline_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_transfers_de_etapa_id_fkey"
            columns: ["de_etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_transfers_de_pipeline_id_fkey"
            columns: ["de_pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_transfers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_transfers_para_etapa_id_fkey"
            columns: ["para_etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_transfers_para_pipeline_id_fkey"
            columns: ["para_pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          objetivo: string | null
          primary_pipeline: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          objetivo?: string | null
          primary_pipeline?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          objetivo?: string | null
          primary_pipeline?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          preco_padrao: number
          recorrencia: Database["public"]["Enums"]["recorrencia"] | null
          tipo: Database["public"]["Enums"]["produto_tipo"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          preco_padrao?: number
          recorrencia?: Database["public"]["Enums"]["recorrencia"] | null
          tipo: Database["public"]["Enums"]["produto_tipo"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          preco_padrao?: number
          recorrencia?: Database["public"]["Enums"]["recorrencia"] | null
          tipo?: Database["public"]["Enums"]["produto_tipo"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          data: string | null
          id: string
          motivo: string
          order_id: string
          parcial: boolean | null
          valor: number
        }
        Insert: {
          data?: string | null
          id?: string
          motivo: string
          order_id: string
          parcial?: boolean | null
          valor?: number
        }
        Update: {
          data?: string | null
          id?: string
          motivo?: string
          order_id?: string
          parcial?: boolean | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_checklist_items: {
        Row: {
          created_at: string | null
          id: string
          obrigatorio: boolean | null
          ordem: number
          stage_id: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          obrigatorio?: boolean | null
          ordem: number
          stage_id: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          obrigatorio?: boolean | null
          ordem?: number
          stage_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_checklist_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "closer" | "user"
      canal_interacao:
        | "WhatsApp"
        | "Ligação"
        | "Email"
        | "Presencial"
        | "Notas"
        | "Sessão"
      lead_score_class: "Alto" | "Médio" | "Baixo"
      objecao_principal:
        | "Preço"
        | "Tempo"
        | "Prioridade"
        | "Confiança"
        | "Sem Fit"
        | "Orçamento"
        | "Decisor"
        | "Concorrente"
        | "Outro"
      origem_lead:
        | "Facebook"
        | "Instagram"
        | "Google"
        | "Indicação"
        | "Orgânico"
        | "WhatsApp"
        | "LinkedIn"
        | "Evento"
        | "Outro"
      produto_tipo: "Mentoria" | "Curso" | "Plano" | "Consultoria" | "Outro"
      proximo_passo_tipo: "Humano" | "Agendamento" | "Mensagem" | "Outro"
      recorrencia: "Nenhuma" | "Mensal" | "Trimestral" | "Anual"
      resultado_sessao:
        | "Avançar"
        | "Não Avançar"
        | "Recuperação"
        | "Cliente"
        | "Outro"
      saude_etapa: "Verde" | "Amarelo" | "Vermelho"
      status_appointment:
        | "Agendado"
        | "Realizado"
        | "Cancelado"
        | "Remarcado"
        | "No-Show"
      status_deal: "Aberta" | "Ganha" | "Perdida"
      status_geral: "Ativo" | "Cliente" | "Perdido" | "Inativo"
      status_pedido: "Pago" | "Pendente" | "Reembolsado" | "Estornado"
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
      app_role: ["admin", "manager", "closer", "user"],
      canal_interacao: [
        "WhatsApp",
        "Ligação",
        "Email",
        "Presencial",
        "Notas",
        "Sessão",
      ],
      lead_score_class: ["Alto", "Médio", "Baixo"],
      objecao_principal: [
        "Preço",
        "Tempo",
        "Prioridade",
        "Confiança",
        "Sem Fit",
        "Orçamento",
        "Decisor",
        "Concorrente",
        "Outro",
      ],
      origem_lead: [
        "Facebook",
        "Instagram",
        "Google",
        "Indicação",
        "Orgânico",
        "WhatsApp",
        "LinkedIn",
        "Evento",
        "Outro",
      ],
      produto_tipo: ["Mentoria", "Curso", "Plano", "Consultoria", "Outro"],
      proximo_passo_tipo: ["Humano", "Agendamento", "Mensagem", "Outro"],
      recorrencia: ["Nenhuma", "Mensal", "Trimestral", "Anual"],
      resultado_sessao: [
        "Avançar",
        "Não Avançar",
        "Recuperação",
        "Cliente",
        "Outro",
      ],
      saude_etapa: ["Verde", "Amarelo", "Vermelho"],
      status_appointment: [
        "Agendado",
        "Realizado",
        "Cancelado",
        "Remarcado",
        "No-Show",
      ],
      status_deal: ["Aberta", "Ganha", "Perdida"],
      status_geral: ["Ativo", "Cliente", "Perdido", "Inativo"],
      status_pedido: ["Pago", "Pendente", "Reembolsado", "Estornado"],
    },
  },
} as const
