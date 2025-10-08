// Tipos do CRM - Sistema de Vendas e Pipelines
// IMPORTANT: These types must match exactly the database enum values

export type StatusGeral = 'lead' | 'qualificado' | 'reuniao_marcada' | 'em_negociacao' | 'cliente' | 'perdido';
export type OrigemLead = 'evento' | 'indicacao' | 'organico' | 'outro' | 'trafego_pago';
export type ObjecaoPrincipal = 'preco' | 'tempo' | 'confianca' | 'necessidade' | 'outro';
export type StatusAppointment = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'remarcado';
export type ResultadoSessao = 'positivo' | 'neutro' | 'negativo';
export type CanalInteracao = 'whatsapp' | 'telefone' | 'email' | 'presencial' | 'outro';
export type StatusDeal = 'aberto' | 'ganho' | 'perdido';
export type StatusPedido = 'pendente' | 'pago' | 'cancelado';
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
  objetivo?: string;
  primary_pipeline: boolean; // Pipeline principal quando lead for inscrito
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  sla_horas?: number; // SLA em horas (note: database usa sla_horas, não prazo_em_dias)
  
  // Próximo passo
  proximo_passo_label?: string;
  proximo_passo_tipo: ProximoPassoTipo;
  
  // Ações automáticas
  gerar_agendamento_auto: boolean;
  duracao_minutos?: number;
  
  // Configurações de agendamento
  tipo_agendamento?: 'Descoberta' | 'Apresentacao' | 'Fechamento' | 'Follow-up';
  closer_padrao?: string;
  horarios_preferenciais?: {
    dias_semana?: number[];
    horarios?: string[];
  };
  template_agendamento?: {
    titulo?: string;
    descricao?: string;
  };
  
  // Critérios
  entrada_criteria?: string;
  saida_criteria?: string;
  
  // WIP limit
  wip_limit?: number;
  
  // Campos opcionais para compatibilidade
  prazo_em_dias?: number; // Deprecated, usar sla_horas
}

export interface StageChecklistItem {
  id: string;
  etapa_id: string;
  titulo: string;
  obrigatorio: boolean;
  ordem: number;
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
  resultado_sessao?: ResultadoSessao;
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
  descricao: string; // Note: database usa descricao
  autor: string;
  data_hora?: Date;
  created_at?: Date;
  timestamp: Date;
}

export interface Product {
  id: string;
  nome: string;
  tipo: 'Mentoria' | 'Curso' | 'Plano' | 'Consultoria' | 'Outro';
  recorrencia: 'Nenhuma' | 'Mensal' | 'Trimestral' | 'Anual';
  preco_padrao: number; // Em BRL
  ativo: boolean;
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
  valor_total: number; // Em BRL (note: database usa valor_total, não total)
  forma_pagamento?: string;
  data_venda: Date;
  status_pagamento: StatusPedido; // note: database usa status_pagamento, não status
  observacao?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  valor: number; // Em BRL
  quantidade: number;
}

export interface Refund {
  id: string;
  order_id: string;
  valor: number; // Em BRL
  motivo: string;
  data: Date;
  parcial: boolean; // Se é reembolso parcial ou total
}

export interface AuditLog {
  id: string;
  entidade: string; // 'Lead', 'Deal', 'Order', etc.
  entidade_id: string;
  alteracao: {
    campo: string;
    de: any;
    para: any;
  }[];
  ator: string;
  timestamp: Date;
}

// Adicionais tipos para múltiplos pipelines e funcionalidades avançadas
export interface PipelineTransfer {
  id: string;
  lead_id: string;
  de_pipeline_id: string;
  para_pipeline_id: string;
  de_etapa_id: string;
  para_etapa_id: string;
  motivo: string;
  ator: string;
  timestamp: Date;
}

export interface DealLostReason {
  id: string;
  deal_id: string;
  motivo: ObjecaoPrincipal;
  detalhes?: string;
  timestamp: Date;
}

// Removed duplicate Interaction interface

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  valor: number; // Em BRL
  quantidade: number;
  recorrencia?: 'Nenhuma' | 'Mensal' | 'Trimestral' | 'Anual'; // Herdada do produto, mas editável
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