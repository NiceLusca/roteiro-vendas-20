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
  
  // We don't need to subscribe to entries here, just use the CRUD functions
  // Pass null to avoid triggering the realtime listener
  const { createEntry, archiveEntry, transferToPipeline, updateEntry } = useSupabaseLeadPipelineEntries(null as any);

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
    
    // Validações iniciais
    if (!leadId || !pipelineId || !stageId) {
      const error = `Parâmetros inválidos: leadId=${leadId}, pipelineId=${pipelineId}, stageId=${stageId}`;
      console.error('❌', error);
      throw new Error(error);
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Verificar se o lead existe
      const { data: leadExists, error: leadError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .maybeSingle();
      
      if (leadError || !leadExists) {
        throw new Error(`Lead não encontrado: ${leadId}`);
      }
      
      // Verificar se o pipeline existe e está ativo
      const { data: pipelineExists, error: pipelineError } = await supabase
        .from('pipelines')
        .select('id, nome, ativo')
        .eq('id', pipelineId)
        .maybeSingle();
      
      if (pipelineError || !pipelineExists) {
        throw new Error(`Pipeline não encontrado: ${pipelineId}`);
      }
      
      if (!pipelineExists.ativo) {
        throw new Error(`Pipeline "${pipelineExists.nome}" está inativo`);
      }
      
      // Verificar se a stage existe e pertence ao pipeline
      const { data: stageExists, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('id, nome, pipeline_id')
        .eq('id', stageId)
        .maybeSingle();
      
      if (stageError || !stageExists) {
        throw new Error(`Stage não encontrada: ${stageId}`);
      }
      
      if (stageExists.pipeline_id !== pipelineId) {
        throw new Error(`Stage "${stageExists.nome}" não pertence ao pipeline "${pipelineExists.nome}"`);
      }
      
      // Verificar se já existe entrada ativa
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
      
      // Criar nova entrada
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

    const success = await updateEntry(entryId, {
      etapa_atual_id: newStageId,
      data_entrada_etapa: new Date().toISOString()
    });

    if (success) {
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
  }, [updateEntry, logChange]);

  return {
    getLeadPipelineEntries,
    transferPipeline,
    inscribePipeline,
    archivePipelineEntry,
    advanceStage
  };
}