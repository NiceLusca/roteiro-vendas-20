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
  const { entries, createEntry, archiveEntry, transferToPipeline, updateEntry } = useSupabaseLeadPipelineEntries();

  const getLeadPipelineEntries = useCallback((leadId: string): any[] => {
    return entries.filter(
      (entry) => entry.lead_id === leadId && entry.status_inscricao === 'Ativo'
    );
  }, [entries]);

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
    // Check if already inscribed
    const existingEntry = entries.find(
      (e) => e.lead_id === leadId && e.pipeline_id === pipelineId && e.status_inscricao === 'Ativo'
    );

    if (existingEntry) {
      toast({
        title: 'Já inscrito',
        description: 'Lead já está inscrito neste pipeline',
        variant: 'destructive'
      });
      return;
    }

    // Create new entry
    const newEntry = await createEntry({
      lead_id: leadId,
      pipeline_id: pipelineId,
      etapa_atual_id: stageId
    });

    if (newEntry) {
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
    }
  }, [entries, createEntry, toast, logChange]);

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
    const entry = entries.find((e) => e.id === entryId);
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
  }, [entries, updateEntry, logChange]);

  return {
    getLeadPipelineEntries,
    transferPipeline,
    inscribePipeline,
    archivePipelineEntry,
    advanceStage
  };
}