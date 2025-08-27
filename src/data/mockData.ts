// Dados mock para desenvolvimento e testes do CRM

import { Lead, Pipeline, PipelineStage, LeadPipelineEntry, Appointment, Deal, Product, DashboardMetrics, StageChecklistItem } from '@/types/crm';

// Seeds - Produtos iniciais
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    nome: 'Mentoria Individual',
    tipo: 'Mentoria',
    recorrencia: 'Mensal',
    preco_padrao: 2500.00,
    ativo: true
  },
  {
    id: 'prod-2',
    nome: 'Curso Online Completo',
    tipo: 'Curso',
    recorrencia: 'Nenhuma',
    preco_padrao: 997.00,
    ativo: true
  },
  {
    id: 'prod-3',
    nome: 'Plano Anual Premium',
    tipo: 'Plano',
    recorrencia: 'Anual',
    preco_padrao: 12000.00,
    ativo: true
  },
  {
    id: 'prod-undefined',
    nome: 'Indefinido',
    tipo: 'Outro',
    recorrencia: 'Nenhuma',
    preco_padrao: 0,
    ativo: true
  }
];

// Pipeline Principal (seed)
export const mockPipeline: Pipeline = {
  id: 'pipeline-principal',
  nome: 'Geral (Primário)',
  descricao: 'Pipeline principal para captação e conversão de leads',
  ativo: true,
  objetivo: 'Conversão de leads em clientes',
  primary: true
};

// Etapas do pipeline principal
export const mockPipelineStages: PipelineStage[] = [
  {
    id: 'stage-1',
    pipeline_id: 'pipeline-principal',
    nome: 'Primeiro Contato',
    ordem: 1,
    prazo_em_dias: 3,
    proximo_passo_label: 'Fazer contato inicial',
    proximo_passo_tipo: 'Humano',
    gerar_agendamento_auto: false,
    entrada_criteria: 'Lead qualificado e interessado',
    saida_criteria: 'Contato realizado e interesse confirmado'
  },
  {
    id: 'stage-2',
    pipeline_id: 'pipeline-principal',
    nome: 'Qualificação',
    ordem: 2,
    prazo_em_dias: 3,
    proximo_passo_label: 'Agendar sessão estratégica',
    proximo_passo_tipo: 'Agendamento',
    gerar_agendamento_auto: true,
    duracao_minutos: 60,
    entrada_criteria: 'Lead demonstrou interesse e está qualificado',
    saida_criteria: 'Sessão agendada ou realizada'
  },
  {
    id: 'stage-3',
    pipeline_id: 'pipeline-principal',
    nome: 'Proposta',
    ordem: 3,
    prazo_em_dias: 3,
    proximo_passo_label: 'Enviar proposta personalizada',
    proximo_passo_tipo: 'Humano',
    gerar_agendamento_auto: false,
    entrada_criteria: 'Sessão realizada e necessidades identificadas',
    saida_criteria: 'Proposta enviada e apresentada'
  },
  {
    id: 'stage-4',
    pipeline_id: 'pipeline-principal',
    nome: 'Negociação',
    ordem: 4,
    prazo_em_dias: 5,
    proximo_passo_label: 'Follow-up da proposta',
    proximo_passo_tipo: 'Mensagem',
    gerar_agendamento_auto: false,
    entrada_criteria: 'Proposta enviada e em análise',
    saida_criteria: 'Decisão final tomada'
  },
  {
    id: 'stage-5',
    pipeline_id: 'pipeline-principal',
    nome: 'Fechamento',
    ordem: 5,
    prazo_em_dias: 2,
    proximo_passo_label: 'Finalizar venda ou arquivar',
    proximo_passo_tipo: 'Humano',
    gerar_agendamento_auto: false,
    entrada_criteria: 'Cliente decidiu comprar ou recusar',
    saida_criteria: 'Venda fechada ou lead arquivado'
  }
];

// Checklist items para as etapas
export const mockChecklistItems: StageChecklistItem[] = [
  // Stage 1 - Primeiro Contato
  { id: 'check-1-1', stage_id: 'stage-1', titulo: 'Registrar contato inicial', obrigatorio: true, ordem: 1 },
  { id: 'check-1-2', stage_id: 'stage-1', titulo: 'Identificar origem do lead', obrigatorio: true, ordem: 2 },
  { id: 'check-1-3', stage_id: 'stage-1', titulo: 'Confirmar dados de contato', obrigatorio: false, ordem: 3 },
  
  // Stage 2 - Qualificação
  { id: 'check-2-1', stage_id: 'stage-2', titulo: 'Aplicar questionário de qualificação', obrigatorio: true, ordem: 1 },
  { id: 'check-2-2', stage_id: 'stage-2', titulo: 'Identificar necessidades e dores', obrigatorio: true, ordem: 2 },
  { id: 'check-2-3', stage_id: 'stage-2', titulo: 'Avaliar fit e potencial de compra', obrigatorio: true, ordem: 3 },
  
  // Stage 3 - Proposta
  { id: 'check-3-1', stage_id: 'stage-3', titulo: 'Criar proposta personalizada', obrigatorio: true, ordem: 1 },
  { id: 'check-3-2', stage_id: 'stage-3', titulo: 'Apresentar proposta ao lead', obrigatorio: true, ordem: 2 },
  { id: 'check-3-3', stage_id: 'stage-3', titulo: 'Registrar objeções levantadas', obrigatorio: false, ordem: 3 },
  
  // Stage 4 - Negociação
  { id: 'check-4-1', stage_id: 'stage-4', titulo: 'Fazer primeiro follow-up', obrigatorio: true, ordem: 1 },
  { id: 'check-4-2', stage_id: 'stage-4', titulo: 'Tratar objeções identificadas', obrigatorio: true, ordem: 2 },
  { id: 'check-4-3', stage_id: 'stage-4', titulo: 'Definir prazo para decisão', obrigatorio: true, ordem: 3 },
  
  // Stage 5 - Fechamento
  { id: 'check-5-1', stage_id: 'stage-5', titulo: 'Finalizar processo de venda', obrigatorio: true, ordem: 1 },
  { id: 'check-5-2', stage_id: 'stage-5', titulo: 'Atualizar status do lead', obrigatorio: true, ordem: 2 }
];

// Leads de exemplo
export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    nome: 'Ana Silva',
    email: 'ana.silva@email.com',
    whatsapp: '+5511987654321',
    origem: 'Instagram',
    segmento: 'E-commerce',
    status_geral: 'Ativo',
    closer: 'João Santos',
    desejo_na_sessao: 'Aumentar vendas online',
    objecao_principal: 'Preço',
    objecao_obs: 'Acha caro comparado com concorrentes',
    ja_vendeu_no_digital: true,
    seguidores: 15000,
    faturamento_medio: 25000,
    meta_faturamento: 50000,
    lead_score: 75,
    lead_score_classification: 'Alto',
    created_at: new Date('2024-01-15T10:00:00'),
    updated_at: new Date('2024-01-20T14:30:00')
  },
  {
    id: 'lead-2',
    nome: 'Carlos Oliveira',
    email: 'carlos@empresa.com.br',
    whatsapp: '+5511976543210',
    origem: 'Google',
    segmento: 'Consultoria',
    status_geral: 'Ativo',
    closer: 'Maria Costa',
    desejo_na_sessao: 'Escalar negócio de consultoria',
    ja_vendeu_no_digital: false,
    seguidores: 2500,
    faturamento_medio: 8000,
    meta_faturamento: 30000,
    lead_score: 45,
    lead_score_classification: 'Médio',
    created_at: new Date('2024-01-18T09:15:00'),
    updated_at: new Date('2024-01-22T11:45:00')
  },
  {
    id: 'lead-3',
    nome: 'Fernanda Souza',
    email: 'fe.souza@gmail.com',
    whatsapp: '+5511965432109',
    origem: 'Indicação',
    segmento: 'Freelancer',
    status_geral: 'Ativo',
    closer: 'João Santos',
    desejo_na_sessao: 'Organizar e precificar serviços',
    objecao_principal: 'Tempo',
    objecao_obs: 'Muito ocupada com projetos atuais',
    ja_vendeu_no_digital: true,
    seguidores: 8000,
    faturamento_medio: 12000,
    meta_faturamento: 25000,
    lead_score: 60,
    lead_score_classification: 'Alto',
    created_at: new Date('2024-01-20T16:30:00'),
    updated_at: new Date('2024-01-23T09:20:00')
  },
  {
    id: 'lead-4',
    nome: 'Roberto Lima',
    email: 'roberto.lima@startup.com',
    whatsapp: '+5511954321098',
    origem: 'LinkedIn',
    segmento: 'Startup',
    status_geral: 'Ativo',
    closer: 'Ana Pereira',
    desejo_na_sessao: 'Estruturar área comercial',
    ja_vendeu_no_digital: false,
    seguidores: 1200,
    faturamento_medio: 15000,
    meta_faturamento: 100000,
    lead_score: 35,
    lead_score_classification: 'Médio',
    created_at: new Date('2024-01-22T13:00:00'),
    updated_at: new Date('2024-01-24T10:15:00')
  },
  {
    id: 'lead-5',
    nome: 'Juliana Reis',
    email: 'ju.reis@hotmail.com',
    whatsapp: '+5511943210987',
    origem: 'Facebook',
    segmento: 'Infoprodutos',
    status_geral: 'Cliente',
    closer: 'Maria Costa',
    desejo_na_sessao: 'Lançar primeiro curso online',
    ja_vendeu_no_digital: false,
    seguidores: 5000,
    faturamento_medio: 3000,
    meta_faturamento: 20000,
    lead_score: 25,
    lead_score_classification: 'Baixo',
    created_at: new Date('2024-01-10T08:45:00'),
    updated_at: new Date('2024-01-25T15:30:00')
  }
];

// Entries no pipeline (posicionamento dos leads)
export const mockLeadPipelineEntries: LeadPipelineEntry[] = [
  {
    id: 'entry-1',
    lead_id: 'lead-1',
    pipeline_id: 'pipeline-principal',
    etapa_atual_id: 'stage-3',
    status_inscricao: 'Ativo',
    data_entrada_etapa: new Date('2024-01-20T10:00:00'),
    data_prevista_proxima_etapa: new Date('2024-01-23T10:00:00'),
    tempo_em_etapa_dias: 7,
    dias_em_atraso: 4,
    saude_etapa: 'Vermelho',
    checklist_state: { 'check-3-1': true, 'check-3-2': true, 'check-3-3': false },
    nota_etapa: 'Lead interessado mas com resistência ao preço'
  },
  {
    id: 'entry-2',
    lead_id: 'lead-2',
    pipeline_id: 'pipeline-principal',
    etapa_atual_id: 'stage-2',
    status_inscricao: 'Ativo',
    data_entrada_etapa: new Date('2024-01-22T14:00:00'),
    data_prevista_proxima_etapa: new Date('2024-01-25T14:00:00'),
    tempo_em_etapa_dias: 5,
    dias_em_atraso: 2,
    saude_etapa: 'Amarelo',
    checklist_state: { 'check-2-1': true, 'check-2-2': true, 'check-2-3': false },
    nota_etapa: 'Aguardando agenda para sessão estratégica'
  },
  {
    id: 'entry-3',
    lead_id: 'lead-3',
    pipeline_id: 'pipeline-principal',
    etapa_atual_id: 'stage-4',
    status_inscricao: 'Ativo',
    data_entrada_etapa: new Date('2024-01-24T09:00:00'),
    data_prevista_proxima_etapa: new Date('2024-01-29T09:00:00'),
    tempo_em_etapa_dias: 3,
    dias_em_atraso: 0,
    saude_etapa: 'Verde',
    checklist_state: { 'check-4-1': true, 'check-4-2': false, 'check-4-3': false },
    nota_etapa: 'Follow-up realizado, aguardando resposta'
  },
  {
    id: 'entry-4',
    lead_id: 'lead-4',
    pipeline_id: 'pipeline-principal',
    etapa_atual_id: 'stage-1',
    status_inscricao: 'Ativo',
    data_entrada_etapa: new Date('2024-01-25T11:00:00'),
    data_prevista_proxima_etapa: new Date('2024-01-28T11:00:00'),
    tempo_em_etapa_dias: 2,
    dias_em_atraso: 0,
    saude_etapa: 'Verde',
    checklist_state: { 'check-1-1': true, 'check-1-2': true, 'check-1-3': false },
    nota_etapa: 'Lead novo, primeiro contato realizado'
  }
];

// Agendamentos
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    lead_id: 'lead-1',
    start_at: new Date('2024-01-28T14:00:00'),
    end_at: new Date('2024-01-28T15:00:00'),
    status: 'Agendado',
    origem: 'Plataforma',
    criado_por: 'João Santos',
    created_at: new Date('2024-01-20T10:30:00'),
    updated_at: new Date('2024-01-20T10:30:00')
  },
  {
    id: 'apt-2',
    lead_id: 'lead-2',
    start_at: new Date('2024-01-29T10:00:00'),
    end_at: new Date('2024-01-29T11:00:00'),
    status: 'Agendado',
    origem: 'Plataforma',
    criado_por: 'Maria Costa',
    created_at: new Date('2024-01-22T15:00:00'),
    updated_at: new Date('2024-01-22T15:00:00')
  },
  {
    id: 'apt-3',
    lead_id: 'lead-3',
    start_at: new Date('2024-01-25T16:00:00'),
    end_at: new Date('2024-01-25T17:00:00'),
    status: 'Realizado',
    origem: 'Plataforma',
    resultado_sessao: 'Avançar',
    resultado_obs: 'Cliente demonstrou interesse, avançar para proposta',
    criado_por: 'João Santos',
    created_at: new Date('2024-01-23T12:00:00'),
    updated_at: new Date('2024-01-25T17:15:00')
  }
];

// Deals
export const mockDeals: Deal[] = [
  {
    id: 'deal-1',
    lead_id: 'lead-1',
    product_id: 'prod-1',
    closer: 'João Santos',
    valor_proposto: 2500.00,
    status: 'Aberta',
    fase_negociacao: 'Proposta enviada',
    created_at: new Date('2024-01-20T15:00:00'),
    updated_at: new Date('2024-01-20T15:00:00')
  },
  {
    id: 'deal-2',
    lead_id: 'lead-3',
    product_id: 'prod-2',
    closer: 'João Santos',
    valor_proposto: 997.00,
    status: 'Aberta',
    fase_negociacao: 'Negociação ativa',
    created_at: new Date('2024-01-24T10:00:00'),
    updated_at: new Date('2024-01-24T10:00:00')
  },
  {
    id: 'deal-3',
    lead_id: 'lead-5',
    product_id: 'prod-2',
    closer: 'Maria Costa',
    valor_proposto: 997.00,
    status: 'Ganha',
    fase_negociacao: 'Fechada',
    created_at: new Date('2024-01-15T09:00:00'),
    updated_at: new Date('2024-01-18T14:30:00')
  }
];

// Métricas do Dashboard
export const mockDashboardMetrics: DashboardMetrics = {
  leads_por_status: {
    'Ativo': 4,
    'Cliente': 1,
    'Perdido': 2,
    'Inativo': 0
  },
  sessoes_hoje: 2,
  sessoes_semana: 8,
  deals_abertas: 2,
  deals_ganhas_mes: 3,
  deals_perdidas_mes: 1,
  receita_mes: 15485.00,
  top_objecoes: [
    { objecao: 'Preço', count: 12 },
    { objecao: 'Tempo', count: 8 },
    { objecao: 'Orçamento', count: 5 },
    { objecao: 'Confiança', count: 4 }
  ]
};