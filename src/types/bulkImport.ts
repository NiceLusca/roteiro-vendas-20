import { Lead } from './crm';

export interface LeadTag {
  id: string;
  user_id?: string;
  nome: string;
  cor: string;
  created_at?: string;
  updated_at?: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: keyof Lead | null;
  isRequired: boolean;
}

export interface ParsedLead {
  data: Partial<Lead>;
  rowIndex: number;
  errors: string[];
}

export interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  errors: number;
}

export interface ImportResult {
  success: boolean;
  importedLeads: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  logId?: string;
}

export interface BulkImportLog {
  id: string;
  user_id: string;
  nome_arquivo: string;
  total_linhas: number;
  linhas_sucesso: number;
  linhas_erro: number;
  erros?: any;
  created_at: string;
}

export type ImportStep = 'upload' | 'mapping' | 'tags' | 'pipelines' | 'preview' | 'processing';
