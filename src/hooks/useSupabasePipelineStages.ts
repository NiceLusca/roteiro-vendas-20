import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { logger } from '@/utils/logger';

interface PipelineStage {
  id: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  prazo_em_dias: number;
  proximo_passo_tipo: 'Humano' | 'Agendamento' | 'Mensagem' | 'Outro';
  proximo_passo_label?: string;
  gerar_agendamento_auto: boolean;
  wip_limit?: number;
  entrada_criteria?: string;
  saida_criteria?: string;
  duracao_minutos?: number;
  created_at: string;
  updated_at: string;
}

export function useSupabasePipelineStages(pipelineId?: string) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch stages for a specific pipeline or all stages
  const fetchStages = async (targetPipelineId?: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('pipeline_stages')
        .select(`
          id,
          pipeline_id,
          nome,
          ordem,
          prazo_em_dias,
          proximo_passo_tipo,
          proximo_passo_label,
          proximo_passo_template,
          gerar_agendamento_auto,
          tipo_agendamento,
          template_agendamento,
          duracao_minutos,
          horarios_preferenciais,
          wip_limit,
          sla_horas,
          entrada_criteria,
          saida_criteria,
          criterios_avanco,
          closer_padrao,
          ativo,
          created_at,
          updated_at
        `);
      
      const queryPipelineId = targetPipelineId || pipelineId;
      
      // Validação: Não fazer query se pipeline ID for vazio
      if (queryPipelineId && queryPipelineId.trim() === '') {
        setLoading(false);
        setStages([]);
        return;
      }
      
      // If a specific pipeline is provided, filter by it
      if (queryPipelineId) {
        query = query.eq('pipeline_id', queryPipelineId);
      }
      
      const { data, error } = await query.order('ordem', { ascending: true });

      if (error) {
        logger.error('Erro ao buscar etapas', error, { feature: 'pipeline-stages', metadata: { pipelineId: queryPipelineId } });
        toast({
          title: "Erro ao carregar etapas",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setStages((data as PipelineStage[]) || []);
    } catch (error) {
      logger.error('Erro ao buscar etapas', error as Error, { feature: 'pipeline-stages' });
    } finally {
      setLoading(false);
    }
  };

  // Save stage (create or update) with automatic reordering
  const saveStage = async (stageData: Partial<PipelineStage> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!stageData.id;
      const pipelineId = stageData.pipeline_id;
      const newOrdem = stageData.ordem;

      // Check for order conflict and reorder if necessary
      if (pipelineId && newOrdem !== undefined) {
        const conflictingStages = stages.filter(
          s => s.pipeline_id === pipelineId && 
               s.ordem >= newOrdem && 
               s.id !== stageData.id
        ).sort((a, b) => a.ordem - b.ordem);

        if (conflictingStages.length > 0) {
          // Reorder conflicting stages using two-phase update
          const stagesToUpdate = conflictingStages.map((s, index) => ({
            id: s.id,
            ordem: newOrdem + index + 1
          }));

          // Phase 1: Set temporary high order values
          for (const { id } of stagesToUpdate) {
            await supabase
              .from('pipeline_stages')
              .update({ ordem: 10000 + Math.random() * 1000, updated_at: new Date().toISOString() })
              .eq('id', id);
          }

          // Phase 2: Set final order values
          for (const { id, ordem } of stagesToUpdate) {
            await supabase
              .from('pipeline_stages')
              .update({ ordem, updated_at: new Date().toISOString() })
              .eq('id', id);
          }
        }
      }
      
      const payload: any = {};
      
      Object.keys(stageData).forEach(key => {
        if (key !== 'id' && stageData[key as keyof typeof stageData] !== undefined) {
          payload[key] = stageData[key as keyof typeof stageData];
        }
      });
      
      payload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .update(payload)
          .eq('id', stageData.id!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        logger.error('Erro ao salvar etapa', result.error, { feature: 'pipeline-stages', metadata: { isUpdate, stageId: stageData.id } });
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} etapa`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Etapa ${isUpdate ? 'atualizada' : 'criada'} com sucesso`,
        description: `Etapa ${result.data.nome} foi ${isUpdate ? 'atualizada' : 'criada'}`
      });
      
      // Refresh stages to get updated order
      fetchStages();
      
      return result.data;
    } catch (error) {
      logger.error('Erro ao salvar etapa', error as Error, { feature: 'pipeline-stages' });
      return null;
    }
  };

  // Delete stage
  const deleteStage = async (stageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', stageId);

      if (error) {
        logger.error('Erro ao excluir etapa', error, { feature: 'pipeline-stages', metadata: { stageId } });
        toast({
          title: "Erro ao excluir etapa",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Etapa excluída com sucesso",
        description: "A etapa foi removida do pipeline"
      });

      fetchStages();
      return true;
    } catch (error) {
      logger.error('Erro ao excluir etapa', error as Error, { feature: 'pipeline-stages' });
      return false;
    }
  };

  // Get stage by ID
  const getStageById = (id: string): PipelineStage | undefined => {
    return stages.find(stage => stage.id === id);
  };

  // Get stages by pipeline ID
  const getStagesByPipeline = (targetPipelineId: string): PipelineStage[] => {
    return stages.filter(stage => stage.pipeline_id === targetPipelineId);
  };

  // Batch update stages (for drag & drop reordering)
  const batchUpdateStages = async (stagesToUpdate: Array<{ id: string; ordem: number }>) => {
    if (!user) return false;

    try {
      logger.debug('Batch updating stages', {
        feature: 'pipeline-stages',
        metadata: { count: stagesToUpdate.length }
      });

      // Phase 1: Set temporary high order values to avoid UNIQUE constraint conflicts
      const tempUpdates = stagesToUpdate.map(({ id }, index) =>
        supabase
          .from('pipeline_stages')
          .update({ ordem: 10000 + index, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      const tempResults = await Promise.all(tempUpdates);
      
      if (tempResults.some(result => result.error)) {
        const errors = tempResults.filter(r => r.error).map(r => r.error);
        logger.error('Errors in phase 1', errors[0] as any, {
          feature: 'pipeline-stages'
        });
        throw new Error('Failed to set temporary orders');
      }

      // Phase 2: Set final order values
      const finalUpdates = stagesToUpdate.map(({ id, ordem }) =>
        supabase
          .from('pipeline_stages')
          .update({ ordem, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      const finalResults = await Promise.all(finalUpdates);
      
      if (finalResults.some(result => result.error)) {
        const errors = finalResults.filter(r => r.error).map(r => r.error);
        logger.error('Errors in phase 2', errors[0] as any, {
          feature: 'pipeline-stages'
        });
        toast({
          title: "Erro ao reordenar etapas",
          description: "Algumas etapas não foram atualizadas",
          variant: "destructive"
        });
        return false;
      }

      logger.info('All stages updated successfully', { feature: 'pipeline-stages', metadata: { count: stagesToUpdate.length } });
      toast({
        title: "Ordem atualizada com sucesso",
        description: "As etapas foram reordenadas"
      });

      return true;
    } catch (error) {
      logger.error('Error in batch update', error as Error, { feature: 'pipeline-stages' });
      toast({
        title: "Erro ao reordenar etapas",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchStages();
    }
  }, [user, pipelineId]);

  return {
    stages,
    loading,
    saveStage,
    deleteStage,
    getStageById,
    getStagesByPipeline,
    batchUpdateStages,
    refetch: fetchStages
  };
}