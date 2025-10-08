// Tipos do CRM - Sistema de Vendas e Pipelines
// IMPORTANT: These types must match exactly the database enum values

export type StatusGeral = 'lead' | 'qualificado' | 'reuniao_marcada' | 'em_negociacao' | 'cliente' | 'perdido';
export type OrigemLead = 'evento' | 'indicacao' | 'organico' | 'outro' | 'trafego_pago';
export type ObjecaoPrincipal = 'confianca' | 'preco' | 'tempo' | 'necessidade' | 'outro';
export type StatusAppointment = 'Agendado' | 'Realizado' | 'Cancelado' | 'Remarcado' | 'No-Show';
export type ResultadoSessao = 'positivo' | 'neutro' | 'negativo';
export type CanalInteracao = 'whatsapp' | 'telefone' | 'email' | 'presencial' | 'outro';
export type StatusDeal = 'Aberta' | 'Ganha' | 'Perdida' | 'Pausada';
export type StatusPedido = 'pago' | 'pendente' | 'cancelado';
export type SaudeEtapa = 'verde' | 'amarelo' | 'vermelho';
export type ProximoPassoTipo = 'Humano' | 'Agendamento' | 'Mensagem' | 'Outro';
export type LeadScore = 'alto' | 'medio' | 'baixo';

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  whatsapp: string;
  origem?: OrigemLead;
  segmento?: string;
  status_geral?: StatusGeral;
  closer?: string;
  desejo_na_sessao?: string;
  objecao_principal?: ObjecaoPrincipal;
  objecao_obs?: string;
  observacoes?: string;
  user_id?: string;
  
  // Perfil/Scoring
  ja_vendeu_no_digital?: boolean;
  seguidores?: number;
  faturamento_medio?: number;
  meta_faturamento?: number;
  lead_score?: number;
  lead_score_classification?: string;
  
  // Resultado última sessão
  resultado_sessao_ultimo?: string;
  resultado_obs_ultima_sessao?: string;
  
  // Valor do lead
  valor_lead?: number; // 0-110
  
  created_at: Date;
  updated_at: Date;
}

export interface LeadFormSubmission {
  id: string;
  lead_id: string;
  payload: Record<string, any>;
  origem_form: string;
  timestamp: Date;
}

export interface Pipeline {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  sla_horas?: number;
  proximo_passo_tipo?: ProximoPassoTipo | string;
  proximo_passo_template?: string;
  criterios_avanco?: any;
  ativo?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface StageChecklistItem {
  id: string;
  etapa_id: string;
  titulo: string;
  obrigatorio: boolean;
  ordem?: number;
  descricao?: string;
  ativo?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface LeadPipelineEntry {
  id: string;
  lead_id: string;
  pipeline_id: string;
  etapa_atual_id?: string | null;
  status_inscricao?: string;
  data_inscricao?: Date | string;
  data_entrada_etapa?: Date | string;
  data_conclusao?: Date | string | null;
  saude_etapa?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  tempo_em_etapa_dias?: number; // Computed field
  dias_em_atraso?: number; // Computed field
  checklist_state?: Record<string, boolean>; // Computed field
}

export interface PipelineEvent {
  id: string;
  lead_pipeline_entry_id: string;
  tipo: 'Criado' | 'Avancado' | 'Regressado' | 'Transferido' | 'Arquivado';
  de_etapa_id?: string;
  para_etapa_id?: string;
  ator: string; // usuário ou "sistema"
  timestamp: Date;
  detalhes?: Record<string, any>;
}

export interface Appointment {
  id: string;
  lead_id: string;
  data_hora: Date;
  start_at?: Date;
  end_at?: Date;
  status: StatusAppointment;
  titulo?: string;
  duracao_minutos?: number;
  notas?: string;
  resultado_sessao?: 'Avançar' | 'Não Avançar' | 'Recuperação' | 'Cliente' | 'Outro';
  created_at?: Date;
  updated_at?: Date;
}

export interface AppointmentEvent {
  id: string;
  appointment_id: string;
  tipo: 'Criado' | 'Reagendado' | 'Cancelado' | 'Realizado' | 'StatusAlterado';
  antes?: Record<string, any>;
  depois?: Record<string, any>;
  ator: string;
  timestamp: Date;
}

export interface Interaction {
  id: string;
  lead_id: string;
  canal: CanalInteracao;
  descricao: string;
  autor: string;
  data_hora?: Date;
  created_at?: Date;
  timestamp: Date;
}

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  ativo: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Deal {
  id: string;
  lead_id: string;
  produto_id?: string;
  closer?: string;
  valor_proposto: number;
  status?: StatusDeal;
  motivo_perda?: string;
  data_fechamento?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface DealLostReason {
  id: string;
  deal_id: string;
  motivo: ObjecaoPrincipal;
  detalhes?: string;
  timestamp: Date;
}

export interface Order {
  id: string;
  lead_id: string;
  closer?: string;
  valor_total: number;
  data_pedido?: Date | string;
  status_pagamento: StatusPedido;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Refund {
  id: string;
  order_id: string;
  valor: number;
  motivo: string;
  data: Date;
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
  ator: string;
  timestamp: Date;
}

export interface OrderItem {
  id: string;
  pedido_id: string;
  produto_id?: string;
  preco_unitario: number;
  quantidade: number;
  recorrencia?: string;
  created_at?: Date | string;
}

// Tipos para drag and drop
export interface DragDropResult {
  fromStage: string;
  toStage: string;
  entryId: string;
}

// Tipos para métricas do Dashboard
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

// Tipos para o Kanban
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
  saude_etapa: SaudeEtapa;
}

// Tipos para timeline unificada
export interface TimelineEvent {
  id: string;
  type: 'interaction' | 'appointment' | 'pipeline' | 'deal' | 'order' | 'audit';
  title: string;
  description: string;
  timestamp: Date;
  icon: any; // LucideIcon
  entityId?: string;
  details?: Record<string, any>;
}

// Tipos para transferência de pipeline
export interface PipelineTransferRequest {
  leadId: string;
  fromPipelineId: string;
  toPipelineId: string;
  toStageId: string;
  motivo: string;
}