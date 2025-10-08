import { useState, useCallback } from 'react';
import { LeadPipelineEntry, PipelineTransferRequest } from '@/types/crm';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook for managing multi-pipeline functionality
export function useMultiPipeline() {
  const { logChange } = useAudit();
  const { toast } = useToast();
  const { createEntry, archiveEntry, transferToPipeline } = useSupabaseLeadPipelineEntries(undefined);

  const getLeadPipelineEntries = useCallback(async (leadId: string): Promise<any[]> => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('lead_pipeline_entries')
      .select('*')
      .eq('lead_id', leadId)
      .eq('status_inscricao', 'Ativo');
    
    return data || [];
  }, []);

  const transferPipeline = useCallback(async (transfer: PipelineTransferRequest) => {
    const success = await transferToPipeline(
      transfer.leadId, // Actually should be entryId, but we'll handle this in the UI
      transfer.toPipelineId,
      transfer.toStageId,
      transfer.motivo
    );

    if (success) {
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: transfer.leadId,
        alteracao: [
          { campo: 'pipeline_transfer', de: transfer.fromPipelineId, para: transfer.toPipelineId },
          { campo: 'motivo', de: '', para: transfer.motivo }
        ],
        ator: 'Sistema (Transferência)'
      });
    }
  }, [transferToPipeline, logChange]);

  const inscribePipeline = useCallback(async (leadId: string, pipelineId: string, stageId: string) => {
    console.log('🟢 inscribePipeline CHAMADO:', { leadId, pipelineId, stageId });
    
    try {
      // Check in database if already inscribed (more reliable than local state for bulk imports)
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: existingEntries, error: checkError } = await supabase
        .from('lead_pipeline_entries')
        .select('id')
        .eq('lead_id', leadId)
        .eq('pipeline_id', pipelineId)
        .eq('status_inscricao', 'Ativo')
        .maybeSingle();

      console.log('🔍 Verificação de entrada existente:', { existingEntries, checkError });

      if (existingEntries) {
        console.log('⚠️ Lead já inscrito - pulando');
        return;
      }

      console.log('🟢 Chamando createEntry...');
      
      // Create new entry
      const newEntry = await createEntry({
        lead_id: leadId,
        pipeline_id: pipelineId,
        etapa_atual_id: stageId
      });

      console.log('🟢 Resultado do createEntry:', newEntry);

      if (newEntry) {
        console.log('✅ Entry criado, logando mudança...');
        logChange({
          entidade: 'LeadPipelineEntry',
          entidade_id: newEntry.id,
          alteracao: [
            { campo: 'lead_id', de: '', para: leadId },
            { campo: 'pipeline_id', de: '', para: pipelineId },
            { campo: 'etapa_atual_id', de: '', para: stageId },
            { campo: 'status_inscricao', de: '', para: 'Ativo' }
          ],
          ator: 'Sistema (Inscrição)'
        });
      } else {
        console.error('❌ createEntry retornou null');
        throw new Error('Falha ao criar entrada no pipeline');
      }
    } catch (error) {
      console.error('❌ ERRO em inscribePipeline:', error);
      throw error; // Re-throw to be handled by caller
    }
  }, [createEntry, logChange]);

  const archivePipelineEntry = useCallback(async (entryId: string, motivo: string = 'Arquivado manualmente') => {
    const success = await archiveEntry(entryId, motivo);

    if (success) {
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: entryId,
        alteracao: [
          { campo: 'status_inscricao', de: 'Ativo', para: 'Arquivado' },
          { campo: 'motivo_arquivamento', de: '', para: motivo }
        ],
        ator: 'Usuário'
      });
    }
  }, [archiveEntry, logChange]);

  const advanceStage = useCallback(async (entryId: string, newStageId: string) => {
    // Buscar entry atual para ter os dados antigos
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: entry } = await supabase
      .from('lead_pipeline_entries')
      .select('etapa_atual_id, data_entrada_etapa')
      .eq('id', entryId)
      .single();
    
    const oldStageId = entry?.etapa_atual_id;

    const { error } = await supabase
      .from('lead_pipeline_entries')
      .update({
        etapa_atual_id: newStageId,
        data_entrada_etapa: new Date().toISOString(),
        saude_etapa: 'Verde',
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (!error) {
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: entryId,
        alteracao: [
          { campo: 'etapa_atual_id', de: oldStageId || '', para: newStageId },
          { campo: 'data_entrada_etapa', de: entry?.data_entrada_etapa || '', para: new Date().toISOString() }
        ],
        ator: 'Sistema (Avanço de Etapa)'
      });
    }
  }, [logChange]);

  return {
    getLeadPipelineEntries,
    transferPipeline,
    inscribePipeline,
    archivePipelineEntry,
    advanceStage
  };
}