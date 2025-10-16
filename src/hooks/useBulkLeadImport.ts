import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types/crm';
import { ColumnMapping, ParsedLead, ImportResult, ImportProgress } from '@/types/bulkImport';
import { useSupabaseLeads } from './useSupabaseLeads';
import { useLeadTags } from './useLeadTags';
import { useMultiPipeline } from './useMultiPipeline';
import { sanitizeText } from '@/schemas/leadValidation';

const BATCH_SIZE = 50;

// Valores válidos do enum origem_lead
const VALID_ORIGENS = [
  'Facebook', 'Instagram', 'Google', 'Indicação', 'Orgânico', 
  'WhatsApp', 'LinkedIn', 'Evento', 'Outro'
] as const;

/**
 * Busca lead existente no banco usando estratégia de prioridade
 * 1. WhatsApp (mais confiável)
 * 2. Email (se WhatsApp não fornecido)
 * 3. Nome + Origem (menos confiável)
 */
const findExistingLead = async (leadData: Partial<Lead>): Promise<Lead | null> => {
  try {
    // Estratégia 1: Buscar por WhatsApp (mais confiável)
    if (leadData.whatsapp) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp', leadData.whatsapp)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar por WhatsApp:', error);
        return null;
      }
      
      if (data) {
        return {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        } as Lead;
      }
    }

    // Estratégia 2: Buscar por Email
    if (leadData.email && leadData.email.trim() !== '') {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('email', leadData.email)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar por Email:', error);
        return null;
      }

      if (data) {
        return {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        } as Lead;
      }
    }

    // Estratégia 3: Buscar por Nome + Origem (menos confiável)
    if (leadData.nome && leadData.origem) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('nome', leadData.nome)
        .eq('origem', leadData.origem)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar por Nome + Origem:', error);
        return null;
      }

      if (data) {
        return {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        } as Lead;
      }
    }

    return null;
  } catch (error) {
    console.error('Erro fatal ao buscar lead existente:', error);
    return null;
  }
};

/**
 * Faz merge inteligente de dados do lead
 * REGRAS:
 * - Campos vazios no novo lead NÃO sobrescrevem campos preenchidos no lead existente
 * - lead_score e valor_lead SEMPRE são atualizados (conforme solicitado)
 * - Tags são ADICIONADAS, não substituídas
 * - Campos críticos como WhatsApp e Email são preservados se já existirem
 */
const mergeLeadData = (existingLead: Lead, newLeadData: Partial<Lead>): Partial<Lead> => {
  const merged: Partial<Lead> = { ...existingLead };

  // Campos que SEMPRE devem ser atualizados (conforme solicitado)
  const alwaysUpdateFields = ['lead_score', 'valor_lead'];

  // Campos de texto que só devem ser atualizados se não estiverem vazios
  const textFields = [
    'nome', 'email', 'whatsapp', 'origem', 'segmento', 
    'closer', 'desejo_na_sessao', 'objecao_obs', 'observacoes',
    'resultado_sessao_ultimo', 'resultado_obs_ultima_sessao'
  ];

  // Campos numéricos que só devem ser atualizados se tiverem valor válido
  const numericFields = ['seguidores', 'faturamento_medio', 'meta_faturamento'];

  // Campos booleanos
  const booleanFields = ['ja_vendeu_no_digital'];

  // Campos ENUM
  const enumFields = ['status_geral', 'objecao_principal', 'lead_score_classification'];

  // Atualizar campos de SEMPRE atualizar
  alwaysUpdateFields.forEach(field => {
    if (newLeadData[field as keyof Lead] !== undefined) {
      (merged as any)[field] = newLeadData[field as keyof Lead];
    }
  });

  // Atualizar campos de texto (apenas se novo valor não for vazio)
  textFields.forEach(field => {
    const newValue = newLeadData[field as keyof Lead];
    if (newValue && String(newValue).trim() !== '') {
      (merged as any)[field] = newValue;
    }
  });

  // Atualizar campos numéricos (apenas se tiverem valor válido)
  numericFields.forEach(field => {
    const newValue = newLeadData[field as keyof Lead];
    if (newValue !== undefined && newValue !== null && Number(newValue) > 0) {
      (merged as any)[field] = newValue;
    }
  });

  // Atualizar campos booleanos (apenas se estiver explicitamente definido)
  booleanFields.forEach(field => {
    const newValue = newLeadData[field as keyof Lead];
    if (newValue !== undefined && newValue !== null) {
      (merged as any)[field] = newValue;
    }
  });

  // Atualizar campos ENUM
  enumFields.forEach(field => {
    const newValue = newLeadData[field as keyof Lead];
    if (newValue && String(newValue).trim() !== '') {
      (merged as any)[field] = newValue;
    }
  });

  return merged;
};

export function useBulkLeadImport() {
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    created: 0,
    updated: 0,
  });
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveLead } = useSupabaseLeads();
  const { assignTagsToLead } = useLeadTags();
  const { inscribePipeline } = useMultiPipeline();

  const parseLeads = useCallback((
    rows: any[][],
    headers: string[],
    mapping: ColumnMapping[],
    defaultValues: Record<string, any> = {}
  ): ParsedLead[] => {
    return rows.map((row, index) => {
      const leadData: Partial<Lead> & { user_id?: string } = {
        user_id: user?.id,
      };
      const errors: string[] = [];

      mapping.forEach((map) => {
        if (!map.targetField) return;

        const columnIndex = headers.indexOf(map.sourceColumn);
        if (columnIndex === -1) return;

        const value = row[columnIndex];

          // Mapeamento de campos
          if (value !== undefined && value !== null && value !== '') {
            const trimmedValue = String(value).trim();
            
            // Boolean fields
            if (map.targetField === 'ja_vendeu_no_digital') {
              (leadData as any)[map.targetField] = 
                trimmedValue.toLowerCase() === 'true' || 
                trimmedValue.toLowerCase() === 'sim' ||
                trimmedValue === '1';
            }
            // Integer fields
            else if (['seguidores'].includes(map.targetField)) {
              const num = parseInt(trimmedValue);
              (leadData as any)[map.targetField] = isNaN(num) ? 0 : num;
            }
            // Numeric/decimal fields
            else if (['faturamento_medio', 'meta_faturamento'].includes(map.targetField)) {
              const num = parseFloat(trimmedValue.replace(',', '.'));
              (leadData as any)[map.targetField] = isNaN(num) ? 0 : num;
            }
            // Validação especial para o campo origem
            else if (map.targetField === 'origem') {
              const isValidOrigem = VALID_ORIGENS.includes(trimmedValue as any);
              (leadData as any)[map.targetField] = isValidOrigem ? trimmedValue : 'Outro';
            } 
            else if (map.targetField === 'valor_lead' || map.targetField === 'lead_score') {
              // Validar e limitar score entre 0 e 110
              const numValue = parseInt(trimmedValue);
              const scoreValue = !isNaN(numValue) ? Math.min(110, Math.max(0, numValue)) : 0;
              // Copiar para ambos os campos
              (leadData as any)['valor_lead'] = scoreValue;
              (leadData as any)['lead_score'] = scoreValue;
            }
            else {
              // Decodificar HTML entities em campos de texto
              (leadData as any)[map.targetField] = sanitizeText(trimmedValue);
            }
          }
      });

      // Aplicar valores padrão para campos não mapeados
      Object.keys(defaultValues).forEach((key) => {
        if (!leadData[key as keyof Lead]) {
          const dv = defaultValues[key];
          
          // Boolean fields
          if (key === 'ja_vendeu_no_digital') {
            const strValue = String(dv ?? '').trim().toLowerCase();
            (leadData as any)[key] = strValue === 'true' || strValue === 'sim' || strValue === '1';
          }
          // Integer fields
          else if (['seguidores'].includes(key)) {
            const num = parseInt(String(dv));
            (leadData as any)[key] = isNaN(num) ? 0 : num;
          }
          // Numeric/decimal fields
          else if (['faturamento_medio', 'meta_faturamento'].includes(key)) {
            const num = parseFloat(String(dv).replace(',', '.'));
            (leadData as any)[key] = isNaN(num) ? 0 : num;
          }
          else if (key === 'origem') {
            const candidate = typeof dv === 'string' ? dv.trim() : String(dv ?? '');
            (leadData as any)[key] = VALID_ORIGENS.includes(candidate as any) ? candidate : 'Outro';
          } 
          else if (key === 'valor_lead' || key === 'lead_score') {
            // Validar e limitar score entre 0 e 110
            const numValue = parseInt(String(dv));
            const scoreValue = !isNaN(numValue) ? Math.min(110, Math.max(0, numValue)) : 0;
            // Copiar para ambos os campos
            (leadData as any)['valor_lead'] = scoreValue;
            (leadData as any)['lead_score'] = scoreValue;
          }
          else if (typeof dv === 'string') {
            (leadData as any)[key] = sanitizeText(dv);
          } else {
            (leadData as any)[key] = dv;
          }
        }
      });

      // Validações básicas
      if (!leadData.nome) {
        errors.push('Nome é obrigatório');
      }
      if (!leadData.whatsapp) {
        errors.push('WhatsApp é obrigatório');
      }
      if (!leadData.origem) {
        errors.push('Origem é obrigatória');
      }

      return {
        data: leadData,
        rowIndex: index + 2, // +2 porque: +1 para header, +1 para base 1
        errors,
      };
    });
  }, [user]);

  const importLeads = useCallback(async (
    parsedLeads: ParsedLead[],
    selectedTags: string[],
    selectedPipelines: Array<{ pipelineId: string; stageId: string }>
  ): Promise<ImportResult> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return { success: false, importedLeads: 0, errors: [] };
    }

    setImporting(true);
    setProgress({
      total: parsedLeads.length,
      processed: 0,
      success: 0,
      errors: 0,
      created: 0,
      updated: 0,
    });

    const errors: Array<{ row: number; message: string }> = [];
    let successCount = 0;

    try {
      // Processar em lotes
      for (let i = 0; i < parsedLeads.length; i += BATCH_SIZE) {
        const batch = parsedLeads.slice(i, i + BATCH_SIZE);

        for (const parsed of batch) {
          try {
            if (parsed.errors.length > 0) {
              errors.push({
                row: parsed.rowIndex,
                message: parsed.errors.join(', '),
              });
              setProgress(prev => ({
                ...prev,
                processed: prev.processed + 1,
                errors: prev.errors + 1,
              }));
              continue;
            }

            // Sanitizar origem
            const sanitizedData = { ...parsed.data } as any;
            if (sanitizedData.origem && !VALID_ORIGENS.includes(String(sanitizedData.origem) as any)) {
              sanitizedData.origem = 'Outro';
            }

            // Buscar lead existente
            const existingLead = await findExistingLead(sanitizedData);

            let leadId: string;
            let wasUpdate = false;

            if (existingLead) {
              // Lead já existe - fazer merge e atualizar
              const mergedData = mergeLeadData(existingLead, sanitizedData);
              const updatedLead = await saveLead({ ...mergedData, id: existingLead.id });
              
              if (!updatedLead || !updatedLead.id) {
                throw new Error('Erro ao atualizar lead - ID não retornado');
              }
              
              leadId = updatedLead.id;
              wasUpdate = true;
            } else {
              // Lead novo - criar
              const createdLead = await saveLead(sanitizedData);
              
              if (!createdLead || !createdLead.id) {
                throw new Error('Erro ao criar lead - ID não retornado');
              }
              
              leadId = createdLead.id;
              wasUpdate = false;
            }

            // Atribuir tags
            if (selectedTags.length > 0) {
              try {
                await assignTagsToLead(leadId, selectedTags);
              } catch (tagError: any) {
                // Continue even if tags fail - lead is already created
              }
            }

            // Inscrever em pipelines
            for (const pipeline of selectedPipelines) {
              try {
                await inscribePipeline(leadId, pipeline.pipelineId, pipeline.stageId);
              } catch (pipelineError: any) {
                // Continue even if pipeline inscription fails
              }
            }

            successCount++;
            setProgress(prev => ({
              ...prev,
              processed: prev.processed + 1,
              success: prev.success + 1,
              created: wasUpdate ? prev.created : prev.created + 1,
              updated: wasUpdate ? prev.updated + 1 : prev.updated,
            }));
          } catch (error: any) {
            console.error(`Error importing lead at row ${parsed.rowIndex}:`, error);
            errors.push({
              row: parsed.rowIndex,
              message: error.message || 'Erro desconhecido',
            });
            setProgress(prev => ({
              ...prev,
              processed: prev.processed + 1,
              errors: prev.errors + 1,
            }));
          }
        }
      }

      // Salvar log de importação
      const { data: logData } = await supabase
        .from('bulk_import_logs')
        .insert([{
          user_id: user.id,
          status: 'completed',
          total_records: parsedLeads.length,
          success_count: successCount,
          error_count: errors.length,
          errors: errors,
        }])
        .select()
        .single();

      const createdCount = progress.created;
      const updatedCount = progress.updated;

      toast({
        title: 'Importação concluída',
        description: `✅ ${createdCount} novos leads | 🔄 ${updatedCount} atualizados | ❌ ${errors.length} erros`,
        variant: errors.length > 0 ? 'destructive' : 'default',
      });

      return {
        success: true,
        importedLeads: successCount,
        errors,
        logId: logData?.id,
      };
    } catch (error: any) {
      console.error('Error during bulk import:', error);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
      return {
        success: false,
        importedLeads: successCount,
        errors,
      };
    } finally {
      setImporting(false);
    }
  }, [user, toast, saveLead, assignTagsToLead, inscribePipeline]);

  return {
    parseLeads,
    importLeads,
    progress,
    importing,
  };
}
