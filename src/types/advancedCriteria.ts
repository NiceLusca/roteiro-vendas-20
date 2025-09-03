export interface StageAdvancementCriteria {
  id: string;
  stage_id: string;
  tipo_criterio: string;
  nome: string;
  descricao?: string | null;
  regra_condicional?: any;
  obrigatorio: boolean;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadCriteriaState {
  id: string;
  lead_id: string;
  stage_id: string;
  criterio_id: string;
  status: string;
  valor_validacao?: any;
  validado_em?: string | null;
  validado_por?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleConfig {
  type: 'lead_data' | 'activity' | 'time' | 'relationship' | 'composite';
  field?: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'exists' | 'not_exists';
  value?: any;
  rules?: RuleConfig[]; // For composite rules
  logic?: 'AND' | 'OR'; // For composite rules
}

export interface CriteriaValidationResult {
  criteriaId: string;
  valid: boolean;
  status: 'pendente' | 'atendido' | 'nao_aplicavel' | 'bloqueado';
  message: string;
  details?: any;
}

export interface AdvancementValidationResult {
  canAdvance: boolean;
  blockers: CriteriaValidationResult[];
  warnings: CriteriaValidationResult[];
  passedCriteria: CriteriaValidationResult[];
}