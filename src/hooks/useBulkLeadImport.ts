import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types/crm';
import { ColumnMapping, ParsedLead, ImportResult, ImportProgress } from '@/types/bulkImport';
import { useLeadData } from './useLeadData';
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
  const { saveLead } = useLeadData();
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
          
          // Validação especial para o campo origem
          if (map.targetField === 'origem') {
            const isValidOrigem = VALID_ORIGENS.includes(trimmedValue as any);
            (leadData as any)[map.targetField] = isValidOrigem ? trimmedValue : 'Outro';
          } else {
            (leadData as any)[map.targetField] = trimmedValue;
          }
        }
      });

      // Aplicar valores padrão para campos não mapeados
      Object.keys(defaultValues).forEach((key) => {
        if (!leadData[key as keyof Lead]) {
          (leadData as any)[key] = defaultValues[key];
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

            // Salvar lead
            await saveLead(parsed.data);

            // Buscar o lead recém-criado (buscar por nome e whatsapp únicos)
            const { data: createdLead, error: fetchError } = await supabase
              .from('leads')
              .select('id')
              .eq('nome', parsed.data.nome)
              .eq('whatsapp', parsed.data.whatsapp)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (fetchError || !createdLead) {
              throw new Error('Erro ao recuperar lead criado');
            }

            // Atribuir tags
            if (selectedTags.length > 0) {
              await assignTagsToLead(createdLead.id, selectedTags);
            }

            // Inscrever em pipelines
            for (const pipeline of selectedPipelines) {
              await inscribePipeline(createdLead.id, pipeline.pipelineId, pipeline.stageId);
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
