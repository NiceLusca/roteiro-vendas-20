import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
        .select('*');
      
      const queryPipelineId = targetPipelineId || pipelineId;
      
      // If a specific pipeline is provided, filter by it
      if (queryPipelineId) {
        query = query.eq('pipeline_id', queryPipelineId);
      }
      
      const { data, error } = await query.order('ordem', { ascending: true });

      if (error) {
        console.error('Erro ao buscar etapas:', error);
        toast({
          title: "Erro ao carregar etapas",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setStages(data || []);
    } catch (error) {
      console.error('Erro ao buscar etapas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save stage (create or update)
  const saveStage = async (stageData: Partial<PipelineStage> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!stageData.id;
      
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
        console.error('Erro ao salvar etapa:', result.error);
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

      fetchStages();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
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
        console.error('Erro ao excluir etapa:', error);
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
      console.error('Erro ao excluir etapa:', error);
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
    refetch: fetchStages
  };
}