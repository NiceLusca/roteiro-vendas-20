import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types/crm';
import { ColumnMapping, ParsedLead, ImportResult, ImportProgress } from '@/types/bulkImport';
import { useSupabaseLeads } from './useSupabaseLeads';
import { useLeadTags } from './useLeadTags';
import { useMultiPipeline } from './useMultiPipeline';

const BATCH_SIZE = 50;

// Valores válidos do enum origem_lead
const VALID_ORIGENS = [
  'Facebook', 'Instagram', 'Google', 'Indicação', 'Orgânico', 
  'WhatsApp', 'LinkedIn', 'Evento', 'Outro'
] as const;

export function useBulkLeadImport() {
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
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
            else if (map.targetField === 'valor_lead') {
              // Validar e limitar valor_lead entre 0 e 110
              const numValue = parseInt(trimmedValue);
              if (!isNaN(numValue)) {
                (leadData as any)[map.targetField] = Math.min(110, Math.max(0, numValue));
              } else {
                (leadData as any)[map.targetField] = 0;
              }
            } 
            else {
              (leadData as any)[map.targetField] = trimmedValue;
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
          else if (key === 'valor_lead') {
            // Validar e limitar valor_lead entre 0 e 110
            const numValue = parseInt(String(dv));
            if (!isNaN(numValue)) {
              (leadData as any)[key] = Math.min(110, Math.max(0, numValue));
            } else {
              (leadData as any)[key] = 0;
            }
          } 
          else if (typeof dv === 'string') {
            (leadData as any)[key] = dv.trim();
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

            // Salvar lead (sanitiza origem novamente por segurança)
            const sanitizedData = { ...parsed.data } as any;
            if (sanitizedData.origem && !VALID_ORIGENS.includes(String(sanitizedData.origem) as any)) {
              sanitizedData.origem = 'Outro';
            }
            
            // Save lead and get the created lead object with ID
            const createdLead = await saveLead(sanitizedData);

            if (!createdLead || !createdLead.id) {
              throw new Error('Erro ao criar lead - ID não retornado');
            }

            const leadId = createdLead.id;
            console.log('Lead criado com ID:', leadId);

            // Atribuir tags
            if (selectedTags.length > 0) {
              try {
                await assignTagsToLead(leadId, selectedTags);
                console.log('Tags atribuídas ao lead:', leadId);
              } catch (tagError: any) {
                console.error('Erro ao atribuir tags ao lead:', leadId, tagError);
                // Continue even if tags fail - lead is already created
              }
            }

            // Inscrever em pipelines
            for (const pipeline of selectedPipelines) {
              try {
                await inscribePipeline(leadId, pipeline.pipelineId, pipeline.stageId);
                console.log('Lead inscrito no pipeline:', leadId, pipeline.pipelineId);
              } catch (pipelineError: any) {
                console.error('Erro ao inscrever lead no pipeline:', leadId, pipelineError);
                // Continue even if pipeline inscription fails
              }
            }

            successCount++;
            setProgress(prev => ({
              ...prev,
              processed: prev.processed + 1,
              success: prev.success + 1,
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
        .insert({
          user_id: user.id,
          nome_arquivo: 'bulk_import',
          total_linhas: parsedLeads.length,
          linhas_sucesso: successCount,
          linhas_erro: errors.length,
          erros: errors,
        })
        .select()
        .single();

      toast({
        title: 'Importação concluída',
        description: `${successCount} leads importados com sucesso. ${errors.length} erros.`,
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
