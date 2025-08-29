import { PipelineEvent } from '@/types/crm';

export const mockPipelineEvents: PipelineEvent[] = [
  {
    id: 'event-1',
    entidade_id: 'lead-1',
    tipo: 'Avancado',
    de_etapa_id: 'stage-2',
    para_etapa_id: 'stage-3',
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T10:00:00'),
    detalhes: {
      descricao: 'Lead avançou da qualificação para proposta após sessão estratégica'
    }
  },
  {
    id: 'event-2',
    entidade_id: 'lead-2',
    tipo: 'Avancado',
    de_etapa_id: 'stage-1',
    para_etapa_id: 'stage-2',
    ator: 'Maria Costa',
    timestamp: new Date('2024-01-22T14:00:00'),
    detalhes: {
      descricao: 'Primeiro contato realizado, lead qualificado para próxima etapa'
    }
  },
  {
    id: 'event-3',
    entidade_id: 'lead-3',
    tipo: 'Avancado',
    de_etapa_id: 'stage-3',
    para_etapa_id: 'stage-4',
    ator: 'João Santos',
    timestamp: new Date('2024-01-24T09:00:00'),
    detalhes: {
      descricao: 'Proposta enviada, lead avançou para negociação'
    }
  },
  {
    id: 'event-4',
    entidade_id: 'lead-4',
    tipo: 'Criado',
    de_etapa_id: null,
    para_etapa_id: 'stage-1',
    ator: 'Ana Pereira',
    timestamp: new Date('2024-01-25T11:00:00'),
    detalhes: {
      descricao: 'Lead inscrito no pipeline principal'
    }
  },
  {
    id: 'event-5',
    entidade_id: 'lead-5',
    tipo: 'Transferido',
    de_etapa_id: 'stage-5',
    para_etapa_id: 'stage-u1',
    ator: 'Maria Costa',
    timestamp: new Date('2024-01-26T09:00:00'),
    detalhes: {
      descricao: 'Cliente transferido do pipeline principal para upsell',
      pipeline_origem: 'pipeline-principal',
      pipeline_destino: 'pipeline-upsell'
    }
  }
];