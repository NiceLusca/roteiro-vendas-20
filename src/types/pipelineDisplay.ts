// Types for pipeline display configuration
// These control which fields are shown in Kanban cards and table views

export interface PipelineDisplayConfig {
  card_fields: string[];
  table_columns: string[];
  show_deals?: boolean;
  show_orders?: boolean;
  show_appointments?: boolean;
}

export interface DisplayFieldDefinition {
  key: string;
  label: string;
  source: 'lead' | 'entry' | 'deals' | 'orders' | 'appointments' | 'responsibles' | 'tags';
  format?: 'text' | 'currency' | 'date' | 'datetime' | 'time' | 'badge';
}

// Available fields for dynamic display
export const AVAILABLE_DISPLAY_FIELDS: Record<string, DisplayFieldDefinition> = {
  // Lead fields
  nome: { key: 'nome', label: 'Nome', source: 'lead', format: 'text' },
  contato: { key: 'contato', label: 'Contato', source: 'lead', format: 'text' },
  origem: { key: 'origem', label: 'Origem', source: 'lead', format: 'text' },
  segmento: { key: 'segmento', label: 'Segmento', source: 'lead', format: 'text' },
  desejo_na_sessao: { key: 'desejo_na_sessao', label: 'Desejo na Sessão', source: 'lead', format: 'text' },
  objecao_principal: { key: 'objecao_principal', label: 'Objeção', source: 'lead', format: 'text' },
  valor_lead: { key: 'valor_lead', label: 'Valor Lead', source: 'lead', format: 'currency' },
  lead_score: { key: 'lead_score', label: 'Score', source: 'lead', format: 'text' },
  closer: { key: 'closer', label: 'Closer', source: 'lead', format: 'text' },
  
  // Pipeline Entry fields
  etapa: { key: 'etapa', label: 'Etapa', source: 'entry', format: 'badge' },
  dias: { key: 'dias', label: 'Dias na Etapa', source: 'entry', format: 'text' },
  sla: { key: 'sla', label: 'SLA', source: 'entry', format: 'text' },
  saude: { key: 'saude', label: 'Saúde', source: 'entry', format: 'badge' },
  score: { key: 'score', label: 'Score', source: 'entry', format: 'badge' },
  
  // Relationships
  responsavel: { key: 'responsavel', label: 'Responsável', source: 'responsibles', format: 'text' },
  tags: { key: 'tags', label: 'Tags', source: 'tags', format: 'badge' },
  
  // Deals & Orders (loaded conditionally)
  valor_deal: { key: 'valor_deal', label: 'Valor Venda', source: 'deals', format: 'currency' },
  valor_recorrente: { key: 'valor_recorrente', label: 'Recorrente', source: 'deals', format: 'currency' },
  status_deal: { key: 'status_deal', label: 'Status Venda', source: 'deals', format: 'badge' },
  objecao: { key: 'objecao', label: 'Objeção', source: 'deals', format: 'text' },
  
  // Appointments
  data_sessao: { key: 'data_sessao', label: 'Data Sessão', source: 'appointments', format: 'datetime' },
  hora_sessao: { key: 'hora_sessao', label: 'Hora', source: 'appointments', format: 'time' },
} as const;

// Default configurations
export const DEFAULT_DISPLAY_CONFIG: PipelineDisplayConfig = {
  card_fields: ['nome', 'origem', 'tags', 'responsavel', 'sla'],
  table_columns: ['nome', 'contato', 'etapa', 'dias', 'sla', 'saude', 'score', 'responsavel', 'tags'],
  show_deals: false,
  show_orders: false,
  show_appointments: false,
};

export const COMERCIAL_DISPLAY_CONFIG: PipelineDisplayConfig = {
  card_fields: ['nome', 'origem', 'valor_deal', 'closer', 'sla'],
  table_columns: ['nome', 'contato', 'etapa', 'origem', 'valor_deal', 'valor_recorrente', 'data_sessao', 'closer', 'objecao'],
  show_deals: true,
  show_orders: true,
  show_appointments: true,
};

// Deal info for display
export interface DealDisplayInfo {
  id: string;
  lead_id: string;
  valor_proposto: number;
  valor_recorrente?: number | null;
  status: string;
  motivo_perda?: string | null;
}

// Appointment info for display
export interface AppointmentDisplayInfo {
  id: string;
  lead_id: string;
  data_hora: string;
  start_at?: string | null;
  status: string;
  titulo?: string | null;
}
