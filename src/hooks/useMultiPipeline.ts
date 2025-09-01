import { useState, useCallback } from 'react';
import { LeadPipelineEntry, PipelineTransferRequest } from '@/types/crm';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook for managing multi-pipeline functionality
export function useMultiPipeline() {
  const { logChange } = useAudit();
  const { toast } = useToast();
  
  // Temporary mock data
  const mockLeadPipelineEntries: any[] = [];

  const getLeadPipelineEntries = useCallback((leadId: string): LeadPipelineEntry[] => {
    return mockLeadPipelineEntries.filter(
      (entry: any) => entry.lead_id === leadId && entry.status_inscricao === 'Ativo'
    );
  }, []);

  const transferPipeline = useCallback((transfer: PipelineTransferRequest) => {
    // Find existing entry
    const existingEntry = mockLeadPipelineEntries.find(
      (e: any) => e.lead_id === transfer.leadId && e.pipeline_id === transfer.fromPipelineId
    );

    if (!existingEntry) {
      toast({
        title: 'Erro na transferência',
        description: 'Entry não encontrado no pipeline atual',
        variant: 'destructive'
      });
      return;
    }

    // Archive current entry
    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: existingEntry.id,
      alteracao: [
        { campo: 'status_inscricao', de: 'Ativo', para: 'Arquivado' },
        { campo: 'motivo_arquivamento', de: '', para: `Transferido para pipeline: ${transfer.toPipelineId}` }
      ],
      ator: 'Sistema (Transferência)'
    });

    // Create new entry in target pipeline
    const newEntryId = `entry-${Date.now()}`;
    logChange({
      entidade: 'LeadPipelineEntry', 
      entidade_id: newEntryId,
      alteracao: [
        { campo: 'lead_id', de: '', para: transfer.leadId },
        { campo: 'pipeline_id', de: '', para: transfer.toPipelineId },
        { campo: 'etapa_atual_id', de: '', para: transfer.toStageId },
        { campo: 'status_inscricao', de: '', para: 'Ativo' },
        { campo: 'motivo_entrada', de: '', para: transfer.motivo }
      ],
      ator: 'Sistema (Transferência)'
    });

    toast({
      title: 'Lead transferido',
      description: 'Lead transferido com sucesso para o novo pipeline',
    });

    // TODO: Update mock data or call API
    console.log('Transfer completed:', transfer);
  }, [logChange, toast]);

  const inscribePipeline = useCallback((leadId: string, pipelineId: string, stageId: string) => {
    // Check if already inscribed
    const existingEntry = mockLeadPipelineEntries.find(
      (e: any) => e.lead_id === leadId && e.pipeline_id === pipelineId && e.status_inscricao === 'Ativo'
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
    const newEntryId = `entry-${Date.now()}`;
    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: newEntryId,
      alteracao: [
        { campo: 'lead_id', de: '', para: leadId },
        { campo: 'pipeline_id', de: '', para: pipelineId },
        { campo: 'etapa_atual_id', de: '', para: stageId },
        { campo: 'status_inscricao', de: '', para: 'Ativo' }
      ],
      ator: 'Sistema (Inscrição)'
    });

    toast({
      title: 'Lead inscrito',
      description: 'Lead inscrito com sucesso no pipeline',
    });

    // TODO: Update mock data or call API
    console.log('Inscription completed:', { leadId, pipelineId, stageId });
  }, [logChange, toast]);

  const archivePipelineEntry = useCallback((entryId: string, motivo: string = 'Arquivado manualmente') => {
    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: entryId,
      alteracao: [
        { campo: 'status_inscricao', de: 'Ativo', para: 'Arquivado' },
        { campo: 'motivo_arquivamento', de: '', para: motivo }
      ],
      ator: 'Usuário'
    });

    toast({
      title: 'Pipeline arquivado',
      description: 'Entry removido do pipeline ativo',
    });

    // TODO: Update mock data or call API
    console.log('Entry archived:', entryId);
  }, [logChange, toast]);

  const advanceStage = useCallback((entryId: string, newStageId: string) => {
    const entry = mockLeadPipelineEntries.find((e: any) => e.id === entryId);
    const oldStageId = entry?.etapa_atual_id;

    logChange({
      entidade: 'LeadPipelineEntry',
      entidade_id: entryId,
      alteracao: [
        { campo: 'etapa_atual_id', de: oldStageId || '', para: newStageId },
        { campo: 'data_entrada_etapa', de: entry?.data_entrada_etapa?.toISOString() || '', para: new Date().toISOString() }
      ],
      ator: 'Sistema (Avanço de Etapa)'
    });

    toast({
      title: 'Etapa avançada',
      description: 'Lead movido para a próxima etapa',
    });

    // TODO: Update mock data or call API
    console.log('Stage advanced:', { entryId, newStageId });
  }, [logChange, toast]);

  return {
    getLeadPipelineEntries,
    transferPipeline,
    inscribePipeline,
    archivePipelineEntry,
    advanceStage
  };
}