import { AuditLog, PipelineEvent, AppointmentEvent, Interaction } from '@/types/crm';

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    entidade: 'Lead',
    entidade_id: 'lead-1',
    alteracao: [
      { campo: 'objecao_principal', de: null, para: 'Preço' },
      { campo: 'objecao_obs', de: null, para: 'Acha caro comparado com concorrentes' }
    ],
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T14:30:00')
  },
  {
    id: 'audit-2',
    entidade: 'Deal',
    entidade_id: 'deal-1',
    alteracao: [
      { campo: 'valor_proposto', de: 3000.00, para: 2500.00 },
      { campo: 'fase_negociacao', de: 'Inicial', para: 'Proposta enviada' }
    ],
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T15:00:00')
  }
];

// Mock Pipeline Events
export const mockPipelineEvents: PipelineEvent[] = [
  {
    id: 'pipe-event-1',
    lead_pipeline_entry_id: 'entry-1',
    tipo: 'Avancado',
    de_etapa_id: 'stage-2',
    para_etapa_id: 'stage-3',
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T10:00:00'),
    detalhes: { motivo: 'Sessão realizada com sucesso, cliente demonstrou interesse' }
  },
  {
    id: 'pipe-event-2',
    lead_pipeline_entry_id: 'entry-2',
    tipo: 'Criado',
    para_etapa_id: 'stage-2',
    ator: 'sistema',
    timestamp: new Date('2024-01-22T14:00:00'),
    detalhes: { pipeline_origem: 'Entrada manual' }
  }
];

// Mock Appointment Events
export const mockAppointmentEvents: AppointmentEvent[] = [
  {
    id: 'apt-event-1',
    appointment_id: 'apt-1',
    tipo: 'Criado',
    depois: { status: 'Agendado', start_at: '2024-01-28T14:00:00' },
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T10:30:00')
  },
  {
    id: 'apt-event-2',
    appointment_id: 'apt-3',
    tipo: 'StatusAlterado',
    antes: { status: 'Agendado' },
    depois: { status: 'Realizado', resultado_sessao: 'Avançar' },
    ator: 'João Santos',
    timestamp: new Date('2024-01-25T17:15:00')
  }
];

// Mock Interactions
export const mockInteractions: Interaction[] = [
  {
    id: 'int-1',
    lead_id: 'lead-1',
    canal: 'WhatsApp',
    conteudo: 'Primeiro contato realizado. Lead demonstrou interesse no serviço de mentoria.',
    autor: 'João Santos',
    timestamp: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'int-2',
    lead_id: 'lead-1',
    canal: 'Ligação',
    conteudo: 'Follow-up da proposta. Cliente ainda avaliando, principal objeção é o preço.',
    autor: 'João Santos',
    timestamp: new Date('2024-01-22T16:00:00')
  },
  {
    id: 'int-3',
    lead_id: 'lead-2',
    canal: 'Email',
    conteudo: 'Enviada sequência de e-mails com materiais educativos sobre escala em consultoria.',
    autor: 'Maria Costa',
    timestamp: new Date('2024-01-23T09:15:00')
  },
  {
    id: 'int-4',
    lead_id: 'lead-3',
    canal: 'Sessão',
    conteudo: 'Sessão estratégica realizada. Identificadas principais dores: precificação e organização de projetos.',
    autor: 'João Santos',
    timestamp: new Date('2024-01-25T16:30:00')
  }
];