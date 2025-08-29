import { AuditLog } from '@/types/crm';

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    entidade: 'Lead',
    entidade_id: 'lead-1',
    alteracao: [
      { campo: 'closer', de: null, para: 'João Santos' },
      { campo: 'lead_score', de: 50, para: 75 }
    ],
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T14:30:00')
  },
  {
    id: 'audit-2',
    entidade: 'Deal',
    entidade_id: 'deal-1',
    alteracao: [
      { campo: 'status', de: 'Aberta', para: 'Proposta enviada' },
      { campo: 'fase_negociacao', de: null, para: 'Proposta enviada' }
    ],
    ator: 'João Santos',
    timestamp: new Date('2024-01-20T15:00:00')
  },
  {
    id: 'audit-3',
    entidade: 'Lead',
    entidade_id: 'lead-2',
    alteracao: [
      { campo: 'closer', de: null, para: 'Maria Costa' }
    ],
    ator: 'Maria Costa',
    timestamp: new Date('2024-01-22T11:45:00')
  },
  {
    id: 'audit-4',
    entidade: 'PipelineEntry',
    entidade_id: 'entry-3',
    alteracao: [
      { campo: 'etapa_atual_id', de: 'stage-3', para: 'stage-4' },
      { campo: 'saude_etapa', de: 'Amarelo', para: 'Verde' }
    ],
    ator: 'João Santos',
    timestamp: new Date('2024-01-24T09:00:00')
  },
  {
    id: 'audit-5',
    entidade: 'Deal',
    entidade_id: 'deal-3',
    alteracao: [
      { campo: 'status', de: 'Aberta', para: 'Ganha' },
      { campo: 'fase_negociacao', de: 'Negociação ativa', para: 'Fechada' }
    ],
    ator: 'Maria Costa',
    timestamp: new Date('2024-01-18T14:30:00')
  }
];