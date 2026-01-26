import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextSecure";
import { logger } from "@/utils/logger";

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
  proxima_etapa_id?: string | null;
  grupo?: string | null;
  cor_grupo?: string | null;
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
          proxima_etapa_id,
          grupo,
          cor_grupo,
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
      const targetPipelineId = stageData.pipeline_id;
      const newOrdem = stageData.ordem;

      // Check for order conflict and reorder if necessary
      if (targetPipelineId && newOrdem !== undefined) {
        // Fetch fresh data from database to avoid stale state issues
        const { data: currentStages } = await supabase
          .from('pipeline_stages')
          .select('id, ordem')
          .eq('pipeline_id', targetPipelineId)
          .order('ordem', { ascending: true });

        if (currentStages) {
          // Find stages that need to be moved (same or higher order, excluding current stage)
          const conflictingStages = currentStages.filter(
            s => s.ordem >= newOrdem && s.id !== stageData.id
          );

          if (conflictingStages.length > 0) {
            // Phase 1: Move all conflicting stages to temporary high values
            for (let i = 0; i < conflictingStages.length; i++) {
              await supabase
                .from('pipeline_stages')
                .update({ ordem: 10000 + i, updated_at: new Date().toISOString() })
                .eq('id', conflictingStages[i].id);
            }

            // Phase 2: Set final order values (push each by 1)
            for (let i = 0; i < conflictingStages.length; i++) {
              await supabase
                .from('pipeline_stages')
                .update({ ordem: newOrdem + i + 1, updated_at: new Date().toISOString() })
                .eq('id', conflictingStages[i].id);
            }
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
      
      // Refresh stages to reflect new order immediately
      await fetchStages();

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

  // Batch update stage groups (for group configurator)
  const batchUpdateStageGroups = async (updates: Array<{ stageId: string; grupo: string | null; cor_grupo: string | null }>) => {
    if (!user) return false;

    try {
      logger.debug('Batch updating stage groups', {
        feature: 'pipeline-stages',
        metadata: { count: updates.length }
      });

      const updatePromises = updates.map(({ stageId, grupo, cor_grupo }) =>
        supabase
          .from('pipeline_stages')
          .update({ grupo, cor_grupo, updated_at: new Date().toISOString() })
          .eq('id', stageId)
      );

      const results = await Promise.all(updatePromises);
      
      if (results.some(result => result.error)) {
        const errors = results.filter(r => r.error).map(r => r.error);
        logger.error('Errors updating stage groups', errors[0] as any, {
          feature: 'pipeline-stages'
        });
        toast({
          title: "Erro ao salvar grupos",
          description: "Algumas etapas não foram atualizadas",
          variant: "destructive"
        });
        return false;
      }

      logger.info('Stage groups updated successfully', { 
        feature: 'pipeline-stages', 
        metadata: { count: updates.length } 
      });
      
      await fetchStages();
      return true;
    } catch (error) {
      logger.error('Error updating stage groups', error as Error, { feature: 'pipeline-stages' });
      toast({
        title: "Erro ao salvar grupos",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  // Setup Comercial pipeline with complete structure
  const setupComercialPipeline = async (pipelineId: string) => {
    if (!user) return false;

    try {
      logger.info('Setting up Comercial pipeline', { feature: 'pipeline-stages', metadata: { pipelineId } });

      // Fetch current stages
      const { data: currentStages, error: fetchError } = await supabase
        .from('pipeline_stages')
        .select('id, nome, ordem')
        .eq('pipeline_id', pipelineId)
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;

      // Define the target structure
      const targetStructure = [
        // PRÉ-SESSÃO (blue)
        { nome: 'Agendado', grupo: 'Pré-Sessão', cor_grupo: 'blue', ordem: 1 },
        { nome: 'Confirmado', grupo: 'Pré-Sessão', cor_grupo: 'blue', ordem: 2 },
        { nome: 'Remarcou', grupo: 'Pré-Sessão', cor_grupo: 'blue', ordem: 3 },
        { nome: 'No-Show', grupo: 'Pré-Sessão', cor_grupo: 'blue', ordem: 4 },
        { nome: 'Closer Ausente', grupo: 'Pré-Sessão', cor_grupo: 'blue', ordem: 5 },
        // SESSÃO (violet)
        { nome: 'Sessão Realizada', grupo: 'Sessão', cor_grupo: 'violet', ordem: 6 },
        // DECISÃO (purple)
        { nome: 'Fechou', grupo: 'Decisão', cor_grupo: 'purple', ordem: 7 },
        { nome: 'Não Fechou (quente)', grupo: 'Decisão', cor_grupo: 'purple', ordem: 8 },
        { nome: 'Não Fechou (frio)', grupo: 'Decisão', cor_grupo: 'purple', ordem: 9 },
        // RECUPERAÇÃO (orange)
        { nome: 'D+2 – Instagram', grupo: 'Recuperação', cor_grupo: 'orange', ordem: 10 },
        { nome: 'D+4 – Desconto', grupo: 'Recuperação', cor_grupo: 'orange', ordem: 11 },
        { nome: 'D+7 – Últimas 5 vagas', grupo: 'Recuperação', cor_grupo: 'orange', ordem: 12 },
        { nome: 'D+10 – Últimas 2 vagas', grupo: 'Recuperação', cor_grupo: 'orange', ordem: 13 },
        { nome: 'D+15 – Igor', grupo: 'Recuperação', cor_grupo: 'orange', ordem: 14 },
        // DESFECHO (green)
        { nome: 'Fechou (pós-recuperação)', grupo: 'Desfecho', cor_grupo: 'green', ordem: 15 },
        { nome: 'Perdido pós sessão', grupo: 'Desfecho', cor_grupo: 'green', ordem: 16 },
        { nome: 'Perdido sem sessão', grupo: 'Desfecho', cor_grupo: 'green', ordem: 17 },
      ];

      // Map existing stages by name for updates
      const existingByName = new Map(currentStages?.map(s => [s.nome.toLowerCase(), s]) || []);
      
      // Name mappings for renames
      const nameMappings: Record<string, string> = {
        'd+2': 'D+2 – Instagram',
        'd+4': 'D+4 – Desconto', 
        'd+7': 'D+7 – Últimas 5 vagas',
        'cliente': 'Fechou (pós-recuperação)',
        'perdido': 'Perdido pós sessão',
      };

      // Process each target stage
      for (const target of targetStructure) {
        // Check for exact match first
        let existing = existingByName.get(target.nome.toLowerCase());
        
        // Check for rename mappings
        if (!existing) {
          for (const [oldName, newName] of Object.entries(nameMappings)) {
            if (newName === target.nome) {
              existing = existingByName.get(oldName);
              break;
            }
          }
        }

        if (existing) {
          // Update existing stage
          await supabase
            .from('pipeline_stages')
            .update({
              nome: target.nome,
              ordem: target.ordem,
              grupo: target.grupo,
              cor_grupo: target.cor_grupo,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          // Create new stage
          await supabase
            .from('pipeline_stages')
            .insert({
              pipeline_id: pipelineId,
              nome: target.nome,
              ordem: target.ordem,
              grupo: target.grupo,
              cor_grupo: target.cor_grupo,
              prazo_em_dias: 3,
              proximo_passo_tipo: 'Humano',
              gerar_agendamento_auto: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }

      toast({
        title: "Pipeline Comercial configurado!",
        description: "Estrutura completa com 17 etapas em 5 grupos foi aplicada.",
      });

      await fetchStages();
      return true;
    } catch (error) {
      logger.error('Error setting up Comercial pipeline', error as Error, { feature: 'pipeline-stages' });
      toast({
        title: "Erro ao configurar pipeline",
        description: "Ocorreu um erro ao aplicar a estrutura",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    stages,
    loading,
    saveStage,
    deleteStage,
    getStageById,
    getStagesByPipeline,
    batchUpdateStages,
    batchUpdateStageGroups,
    setupComercialPipeline,
    refetch: fetchStages
  };
}