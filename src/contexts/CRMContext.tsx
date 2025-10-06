import React, { createContext, useContext, ReactNode } from 'react';
import { Lead, Pipeline, PipelineStage, LeadPipelineEntry } from '@/types/crm';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useToast } from '@/hooks/use-toast';

// Context
interface CRMContextType {
  // Data
  leads: Lead[];
  pipelines: Pipeline[];
  stages: PipelineStage[];
  entries: LeadPipelineEntry[];
  
  // Loading states
  loading: {
    leads: boolean;
    pipelines: boolean;
    stages: boolean;
    entries: boolean;
  };
  
  // Lead operations
  createLead: (leadData: Partial<Lead>) => Promise<Lead | null>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<Lead | null>;
  
  // Lead Pipeline operations
  inscribeLeadToPipeline: (leadId: string, pipelineId: string, stageId: string) => Promise<boolean>;
  transferLeadBetweenPipelines: (entryId: string, newPipelineId: string, newStageId: string, reason: string) => Promise<boolean>;
  advanceLeadStage: (entryId: string, newStageId: string) => Promise<boolean>;
  archiveLeadEntry: (entryId: string, reason?: string) => Promise<boolean>;
  
  // Helper functions
  getLeadsByPipeline: (pipelineId: string) => Lead[];
  getEntriesByPipeline: (pipelineId: string) => LeadPipelineEntry[];
  getEntriesByLead: (leadId: string) => LeadPipelineEntry[];
  getStagesByPipeline: (pipelineId: string) => PipelineStage[];
  refetchAll: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Provider Component
interface CRMProviderProps {
  children: ReactNode;
}

export function CRMProvider({ children }: CRMProviderProps) {
  const { toast } = useToast();

  // Individual hooks for data operations
  const { leads, loading: leadsLoading, saveLead, refetch: refetchLeads } = useSupabaseLeads();
  const { pipelines, loading: pipelinesLoading, refetch: refetchPipelines } = useSupabasePipelines();
  const { stages, loading: stagesLoading, refetch: refetchStages } = useSupabasePipelineStages();
  const { 
    entries, 
    loading: entriesLoading, 
    createEntry, 
    updateEntry: updateEntryHook,
    archiveEntry,
    transferToPipeline,
    refetch: refetchEntries 
  } = useSupabaseLeadPipelineEntries(undefined);

  // CRM Operations
  const createLead = async (leadData: Partial<Lead>): Promise<Lead | null> => {
    try {
      const newLead = await saveLead(leadData);
      if (newLead) {
        // Refetch to ensure consistency
        await refetchLeads();
        return newLead;
      }
      return null;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Erro ao criar lead',
        description: 'Ocorreu um erro ao criar o lead. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>): Promise<Lead | null> => {
    try {
      const updatedLead = await saveLead({ ...updates, id: leadId });
      if (updatedLead) {
        // Refetch to ensure consistency
        await refetchLeads();
        return updatedLead;
      }
      return null;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro ao atualizar lead',
        description: 'Ocorreu um erro ao atualizar o lead. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const inscribeLeadToPipeline = async (leadId: string, pipelineId: string, stageId: string): Promise<boolean> => {
    try {
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
        return false;
      }

      const newEntry = await createEntry({
        lead_id: leadId,
        pipeline_id: pipelineId,
        etapa_atual_id: stageId
      });

      if (newEntry) {
        // Refetch to ensure consistency
        await refetchEntries();
        toast({
          title: 'Sucesso',
          description: 'Lead inscrito no pipeline com sucesso!'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error inscribing lead:', error);
      toast({
        title: 'Erro ao inscrever lead',
        description: 'Ocorreu um erro ao inscrever o lead no pipeline.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const transferLeadBetweenPipelines = async (entryId: string, newPipelineId: string, newStageId: string, reason: string): Promise<boolean> => {
    try {
      const success = await transferToPipeline(entryId, newPipelineId, newStageId, reason);
      if (success) {
        // Refetch to get updated state
        await refetchEntries();
        toast({
          title: 'Transferência realizada',
          description: 'Lead transferido para o novo pipeline com sucesso!'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error transferring lead:', error);
      toast({
        title: 'Erro na transferência',
        description: 'Ocorreu um erro ao transferir o lead.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const advanceLeadStage = async (entryId: string, newStageId: string): Promise<boolean> => {
    try {
      const success = await updateEntryHook(entryId, {
        etapa_atual_id: newStageId,
        data_entrada_etapa: new Date().toISOString()
      });

      if (success) {
        // Refetch to ensure consistency
        await refetchEntries();
        toast({
          title: 'Etapa avançada',
          description: 'Lead movido para a próxima etapa com sucesso!'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error advancing stage:', error);
      toast({
        title: 'Erro ao avançar etapa',
        description: 'Ocorreu um erro ao mover o lead para a próxima etapa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const archiveLeadEntry = async (entryId: string, reason = 'Arquivado manualmente'): Promise<boolean> => {
    try {
      const success = await archiveEntry(entryId, reason);
      if (success) {
        // Refetch to ensure consistency
        await refetchEntries();
        toast({
          title: 'Entry arquivado',
          description: 'Lead removido do pipeline com sucesso!'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error archiving entry:', error);
      toast({
        title: 'Erro ao arquivar',
        description: 'Ocorreu um erro ao arquivar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Helper functions
  const getLeadsByPipeline = (pipelineId: string): Lead[] => {
    const activeEntries = entries.filter(
      entry => entry.pipeline_id === pipelineId && entry.status_inscricao === 'Ativo'
    );
    return activeEntries
      .map(entry => leads.find(lead => lead.id === entry.lead_id))
      .filter(Boolean) as Lead[];
  };

  const getEntriesByPipeline = (pipelineId: string): LeadPipelineEntry[] => {
    return entries.filter(
      entry => entry.pipeline_id === pipelineId && entry.status_inscricao === 'Ativo'
    ) as unknown as LeadPipelineEntry[];
  };

  const getEntriesByLead = (leadId: string): LeadPipelineEntry[] => {
    return entries.filter(
      entry => entry.lead_id === leadId && entry.status_inscricao === 'Ativo'
    ) as unknown as LeadPipelineEntry[];
  };

  const getStagesByPipeline = (pipelineId: string): PipelineStage[] => {
    return stages.filter(stage => stage.pipeline_id === pipelineId);
  };

  const refetchAll = async (): Promise<void> => {
    await Promise.all([
      refetchLeads(),
      refetchPipelines(),
      refetchStages(),
      refetchEntries()
    ]);
  };

  const contextValue: CRMContextType = {
    leads,
    pipelines,
    stages,
    entries: entries as unknown as LeadPipelineEntry[],
    loading: {
      leads: leadsLoading,
      pipelines: pipelinesLoading,
      stages: stagesLoading,
      entries: entriesLoading,
    },
    createLead,
    updateLead,
    inscribeLeadToPipeline,
    transferLeadBetweenPipelines,
    advanceLeadStage,
    archiveLeadEntry,
    getLeadsByPipeline,
    getEntriesByPipeline,
    getEntriesByLead,
    getStagesByPipeline,
    refetchAll,
  };

  return (
    <CRMContext.Provider value={contextValue}>
      {children}
    </CRMContext.Provider>
  );
}

// Hook to use CRM Context
export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}