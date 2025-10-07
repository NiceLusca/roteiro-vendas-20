// Tipos do CRM - Sistema de Vendas e Pipelines (matching actual database schema)

// Enums - matching actual database schema (lowercase Portuguese)
export type StatusGeral = 'lead' | 'qualificado' | 'reuniao_marcada' | 'em_negociacao' | 'cliente' | 'perdido';
export type OrigemLead = 'indicacao' | 'trafego_pago' | 'organico' | 'evento' | 'outro';
export type ObjecaoPrincipal = 'preco' | 'tempo' | 'confianca' | 'necessidade' | 'outro';
export type StatusAppointment = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'remarcado';
export type ResultadoSessao = 'positivo' | 'neutro' | 'negativo';
export type CanalInteracao = 'whatsapp' | 'email' | 'telefone' | 'presencial' | 'outro';
export type StatusDeal = 'aberto' | 'ganho' | 'perdido';
export type StatusPedido = 'pendente' | 'pago' | 'cancelado';
export type SaudeEtapa = 'saudavel' | 'atencao' | 'critico';
export type ProximoPassoTipo = 'manual' | 'automatico';
export type LeadScore = 'alto' | 'medio' | 'baixo';

// Lead interface - matching actual database schema
export interface Lead {
  id: string;
  nome: string;
  whatsapp?: string | null;
  email?: string | null;
  origem?: OrigemLead | null;
  status_geral?: StatusGeral;
  ja_vendeu_no_digital?: boolean | null;
  seguidores?: number | null;
  faturamento_medio?: number | null;
  meta_faturamento?: number | null;
  objecao_principal?: ObjecaoPrincipal | null;
  lead_score?: number;
  observacoes?: string | null;
  tags?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeadFormSubmission {
  id: string;
  lead_id: string;
  payload: Record<string, any>;
  origem_form: string;
  timestamp: string;
}

export interface Pipeline {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Pipeline Stage interface - matching actual database schema
export interface PipelineStage {
  id: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  sla_horas?: number | null;
  proximo_passo_tipo?: string | null;
  proximo_passo_template?: string | null;
  criterios_avanco?: any; // JSON field
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Stage Checklist Item interface - matching actual database schema
export interface StageChecklistItem {
  id: string;
  etapa_id: string;
  titulo: string;
  descricao?: string | null;
  ordem?: number | null;
  obrigatorio?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Lead Pipeline Entry interface - matching actual database schema
export interface LeadPipelineEntry {
  id: string;
  lead_id: string;
  pipeline_id: string;
  etapa_atual_id?: string | null;
  data_inscricao?: string;
  data_entrada_etapa?: string;
  data_conclusao?: string | null;
  status_inscricao?: string;
  saude_etapa?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relacionamentos
  lead?: Lead;
  stage?: PipelineStage;
}

export interface PipelineEvent {
  id: string;
  lead_pipeline_entry_id: string;
  tipo: 'criado' | 'avancado' | 'regressado' | 'transferido' | 'arquivado';
  de_etapa_id?: string | null;
  para_etapa_id?: string | null;
  ator: string;
  timestamp: string;
  detalhes?: Record<string, any>;
}

// Appointment interface - matching actual database schema
export interface Appointment {
  id: string;
  lead_id: string;
  titulo: string;
  data_hora: string;
  duracao_minutos?: number;
  status?: StatusAppointment;
  resultado_sessao?: ResultadoSessao | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentEvent {
  id: string;
  appointment_id: string;
  tipo: 'criado' | 'reagendado' | 'cancelado' | 'realizado' | 'status_alterado';
  antes?: Record<string, any>;
  depois?: Record<string, any>;
  ator: string;
  timestamp: string;
}

// Interaction interface - matching actual database schema
export interface Interaction {
  id: string;
  lead_id: string;
  canal: CanalInteracao;
  descricao: string;
  data_hora: string;
  created_at?: string;
}

export interface Product {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Deal interface - matching actual database schema
export interface Deal {
  id: string;
  lead_id: string;
  produto_id?: string | null;
  valor_proposto: number;
  status?: StatusDeal;
  data_fechamento?: string | null;
  motivo_perda?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DealLostReason {
  id: string;
  deal_id: string;
  motivo: string;
  detalhes?: string;
  timestamp: string;
}

// Order interface - matching actual database schema
export interface Order {
  id: string;
  deal_id: string;
  lead_id?: string | null;
  valor_total: number;
  status_pagamento?: StatusPedido;
  data_pedido?: string;
  closer?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Order Item interface - matching actual database schema
export interface OrderItem {
  id: string;
  pedido_id: string;
  produto_id?: string | null;
  quantidade: number;
  preco_unitario: number;
  recorrencia?: string | null;
  created_at?: string;
}

export interface Refund {
  id: string;
  order_id: string;
  valor: number;
  motivo: string;
  data: string;
  parcial: boolean;
}

export interface AuditLog {
  id: string;
  entidade: string;
  entidade_id: string;
  alteracao: {
    campo: string;
    de: any;
    para: any;
  }[];
  ator?: string | null;
  timestamp: string;
}

// Additional types for multi-pipeline functionality
export interface PipelineTransfer {
  id: string;
  lead_id: string;
  de_pipeline_id: string;
  para_pipeline_id: string;
  de_etapa_id: string;
  para_etapa_id: string;
  motivo: string;
  ator: string;
  timestamp: string;
}

// Drag and drop types
export interface DragDropResult {
  fromStage: string;
  toStage: string;
  entryId: string;
}

// Dashboard metrics types
export interface DashboardMetrics {
  leads_por_status: Record<StatusGeral, number>;
  sessoes_hoje: number;
  sessoes_semana: number;
  deals_abertas: number;
  deals_ganhas_mes: number;
  deals_perdidas_mes: number;
  receita_mes: number;
  top_objecoes: Array<{ objecao: ObjecaoPrincipal; count: number }>;
}

// Kanban types
export interface KanbanColumn {
  stage: PipelineStage;
  entries: Array<LeadPipelineEntry & { lead: Lead }>;
  wip_exceeded: boolean;
}

export interface ProximoPasso {
  lead_id: string;
  lead_nome: string;
  pipeline_nome: string;
  etapa_nome: string;
  proximo_passo_label: string;
  proximo_passo_tipo: ProximoPassoTipo;
  dias_em_atraso: number;
  saude_etapa: string;
}

// Unified timeline types
export interface TimelineEvent {
  id: string;
  type: 'interaction' | 'appointment' | 'pipeline' | 'deal' | 'order' | 'audit';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  entityId?: string;
  details?: Record<string, any>;
}

// Pipeline transfer request type
export interface PipelineTransferRequest {
  leadId: string;
  fromPipelineId: string;
  toPipelineId: string;
  toStageId: string;
  motivo: string;
}
