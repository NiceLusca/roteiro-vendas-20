import { Interaction } from '@/types/crm';

export const mockInteractions: Interaction[] = [
  {
    id: 'int-1',
    lead_id: 'lead-1',
    canal: 'WhatsApp',
    conteudo: 'Primeiro contato via WhatsApp. Lead demonstrou interesse no produto.',
    autor: 'João Santos',
    timestamp: new Date('2024-01-15T11:30:00')
  },
  {
    id: 'int-2',
    lead_id: 'lead-1',
    canal: 'Email',
    conteudo: 'Enviado material informativo sobre mentoria individual.',
    autor: 'João Santos',
    timestamp: new Date('2024-01-16T09:15:00')
  },
  {
    id: 'int-3',
    lead_id: 'lead-2',
    canal: 'WhatsApp',
    conteudo: 'Lead respondeu ao primeiro contato, interessado em escalar negócio.',
    autor: 'Maria Costa',
    timestamp: new Date('2024-01-18T14:20:00')
  },
  {
    id: 'int-4',
    lead_id: 'lead-3',
    canal: 'WhatsApp',
    conteudo: 'Ligação para qualificação. Lead tem interesse mas questiona tempo disponível.',
    autor: 'João Santos',
    timestamp: new Date('2024-01-21T10:45:00')
  },
  {
    id: 'int-5',
    lead_id: 'lead-4',
    canal: 'WhatsApp',
    conteudo: 'Primeiro contato via LinkedIn. Lead respondeu positivamente.',
    autor: 'Ana Pereira',
    timestamp: new Date('2024-01-22T16:30:00')
  },
  {
    id: 'int-6',
    lead_id: 'lead-5',
    canal: 'Email',
    conteudo: 'Cliente interessado em upgrade do plano atual.',
    autor: 'Maria Costa',
    timestamp: new Date('2024-01-25T11:00:00')
  }
];