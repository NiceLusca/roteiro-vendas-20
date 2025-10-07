import { Lead } from './crm';

export interface LeadTag {
  id: string;
  nome: string;
  cor: string;
  created_at?: string;
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
  user_id?: string;
  status: string;
  total_records: number;
  success_count: number;
  error_count: number;
  errors?: any;
  created_at: string;
}

export type ImportStep = 'upload' | 'mapping' | 'defaults' | 'tags' | 'pipelines' | 'preview' | 'processing';
