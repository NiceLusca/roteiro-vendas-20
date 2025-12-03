import { createContext, useContext, ReactNode } from 'react';
import { Lead, Pipeline, PipelineStage, LeadPipelineEntry } from '@/types/crm';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
      logger.error('Error creating lead', error as Error, { feature: 'crm-context' });
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
      logger.error('Error updating lead', error as Error, { feature: 'crm-context', metadata: { leadId } });
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
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check if already inscribed
      const { data: existing } = await supabase
        .from('lead_pipeline_entries')
        .select('id')
        .eq('lead_id', leadId)
        .eq('pipeline_id', pipelineId)
        .eq('status_inscricao', 'Ativo')
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Já inscrito',
          description: 'Lead já está inscrito neste pipeline',
          variant: 'destructive'
        });
        return false;
      }

      // Insert new entry
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .insert([{
          lead_id: leadId,
          pipeline_id: pipelineId,
          etapa_atual_id: stageId,
          status_inscricao: 'Ativo',
          data_entrada_etapa: new Date().toISOString(),
          data_inscricao: new Date().toISOString(),
          saude_etapa: 'Verde'
        }]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead inscrito no pipeline com sucesso!'
      });
      return true;
    } catch (error) {
      logger.error('Error inscribing lead', error as Error, { feature: 'crm-context', metadata: { leadId, pipelineId, stageId } });
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
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Archive old entry
      const { error: archiveError } = await supabase
        .from('lead_pipeline_entries')
        .update({ status_inscricao: 'Arquivado' })
        .eq('id', entryId);

      if (archiveError) throw archiveError;

      // Get lead_id from the entry
      const { data: entry } = await supabase
        .from('lead_pipeline_entries')
        .select('lead_id')
        .eq('id', entryId)
        .single();

      if (!entry) throw new Error('Entry not found');

      // Create new entry in new pipeline
      const { error: createError } = await supabase
        .from('lead_pipeline_entries')
        .insert([{
          lead_id: entry.lead_id,
          pipeline_id: newPipelineId,
          etapa_atual_id: newStageId,
          status_inscricao: 'Ativo',
          data_entrada_etapa: new Date().toISOString(),
          data_inscricao: new Date().toISOString(),
          saude_etapa: 'Verde'
        }]);

      if (createError) throw createError;

      toast({
        title: 'Transferência realizada',
        description: 'Lead transferido para o novo pipeline com sucesso!'
      });
      return true;
    } catch (error) {
      logger.error('Error transferring lead', error as Error, { feature: 'crm-context', metadata: { entryId, newPipelineId, newStageId } });
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
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({
          etapa_atual_id: newStageId,
          data_entrada_etapa: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: 'Etapa avançada',
        description: 'Lead movido para a próxima etapa com sucesso!'
      });
      return true;
    } catch (error) {
      logger.error('Error advancing stage', error as Error, { feature: 'crm-context', metadata: { entryId, newStageId } });
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
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({ status_inscricao: 'Arquivado' })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: 'Entry arquivado',
        description: 'Lead removido do pipeline com sucesso!'
      });
      return true;
    } catch (error) {
      logger.error('Error archiving entry', error as Error, { feature: 'crm-context', metadata: { entryId } });
      toast({
        title: 'Erro ao arquivar',
        description: 'Ocorreu um erro ao arquivar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Helper function for stages (kept for backwards compatibility)
  // Deprecated helper functions removed - use direct Supabase hooks instead:
  // - getLeadsByPipeline → use useSupabaseLeadPipelineEntries
  // - getEntriesByPipeline → use useSupabaseLeadPipelineEntries
  // - getEntriesByLead → use useSupabaseLeadPipelineEntries

  const getStagesByPipeline = (pipelineId: string): PipelineStage[] => {
    return stages.filter(stage => stage.pipeline_id === pipelineId);
  };

  const refetchAll = async (): Promise<void> => {
    await Promise.all([
      refetchLeads(),
      refetchPipelines(),
      refetchStages()
    ]);
  };

  const contextValue: CRMContextType = {
    leads,
    pipelines,
    stages,
    entries: [], // No longer fetched globally
    loading: {
      leads: leadsLoading,
      pipelines: pipelinesLoading,
      stages: stagesLoading,
      entries: false,
    },
    createLead,
    updateLead,
    inscribeLeadToPipeline,
    transferLeadBetweenPipelines,
    advanceLeadStage,
    archiveLeadEntry,
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