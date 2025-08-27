// Tipos do CRM - Sistema de Vendas e Pipelines

export type StatusGeral = 'Ativo' | 'Cliente' | 'Perdido' | 'Inativo';
export type OrigemLead = 'Facebook' | 'Instagram' | 'Google' | 'Indicação' | 'Orgânico' | 'WhatsApp' | 'LinkedIn' | 'Evento' | 'Outro';
export type ObjecaoPrincipal = 'Preço' | 'Tempo' | 'Prioridade' | 'Confiança' | 'Sem Fit' | 'Orçamento' | 'Decisor' | 'Concorrente' | 'Outro';
export type StatusAppointment = 'Agendado' | 'Realizado' | 'Cancelado' | 'Remarcado' | 'No-Show';
export type ResultadoSessao = 'Avançar' | 'Não Avançar' | 'Recuperação' | 'Cliente' | 'Outro';
export type CanalInteracao = 'WhatsApp' | 'Ligação' | 'Email' | 'Presencial' | 'Notas' | 'Sessão';
export type StatusDeal = 'Aberta' | 'Ganha' | 'Perdida';
export type StatusPedido = 'Pago' | 'Pendente' | 'Reembolsado' | 'Estornado';
export type SaudeEtapa = 'Verde' | 'Amarelo' | 'Vermelho';
export type ProximoPassoTipo = 'Humano' | 'Agendamento' | 'Mensagem' | 'Outro';
export type LeadScore = 'Alto' | 'Médio' | 'Baixo';

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  whatsapp: string; // Normalizado +55DDDNÚMERO
  origem: OrigemLead;
  segmento?: string;
  status_geral: StatusGeral;
  closer?: string;
  desejo_na_sessao?: string;
  objecao_principal?: ObjecaoPrincipal;
  objecao_obs?: string;
  observacoes?: string;
  
  // Perfil/Scoring
  ja_vendeu_no_digital: boolean;
  seguidores: number;
  faturamento_medio: number; // Em BRL
  meta_faturamento: number; // Em BRL
  lead_score: number; // Calculado automaticamente
  lead_score_classification: LeadScore; // Alto (≥60), Médio (30-59), Baixo (<30)
  
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
  primary: boolean; // Pipeline principal quando lead for inscrito
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  prazo_em_dias: number; // SLA
  
  // Próximo passo
  proximo_passo_label?: string;
  proximo_passo_tipo: ProximoPassoTipo;
  
  // Ações automáticas
  gerar_agendamento_auto: boolean;
  duracao_minutos?: number;
  
  // Critérios
  entrada_criteria?: string;
  saida_criteria?: string;
  
  // WIP limit
  wip_limit?: number;
}

export interface StageChecklistItem {
  id: string;
  stage_id: string;
  titulo: string;
  obrigatorio: boolean;
  ordem: number;
}

export interface LeadPipelineEntry {
  id: string;
  lead_id: string;
  pipeline_id: string;
  etapa_atual_id: string;
  status_inscricao: 'Ativo' | 'Arquivado';
  
  // Datas e SLA
  data_entrada_etapa: Date;
  data_prevista_proxima_etapa: Date;
  
  // Métricas calculadas
  tempo_em_etapa_dias: number;
  dias_em_atraso: number;
  saude_etapa: SaudeEtapa;
  
  // Checklist e observações
  checklist_state: Record<string, boolean>; // item_id -> concluído
  nota_etapa?: string;
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
  start_at: Date;
  end_at: Date;
  status: StatusAppointment;
  origem: 'Plataforma' | 'Importado' | 'Outro';
  resultado_sessao?: ResultadoSessao;
  resultado_obs?: string;
  observacao?: string;
  criado_por?: string;
  created_at: Date;
  updated_at: Date;
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
  conteudo: string;
  autor: string;
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
  product_id: string;
  closer?: string;
  valor_proposto: number; // Em BRL
  status: StatusDeal;
  fase_negociacao?: string;
  created_at: Date;
  updated_at: Date;
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
  total: number; // Em BRL
  forma_pagamento?: string;
  data_venda: Date;
  status: StatusPedido;
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