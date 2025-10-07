import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { PipelineStage } from '@/types/crm';

export function useSupabasePipelineStages(pipelineId?: string) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchStages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('pipeline_stages')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
      }

      const { data, error } = await query;

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

  const saveStage = async (stageData: Partial<PipelineStage> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, created_at, updated_at, ...dataToSave } = stageData;
      
      if (id) {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao atualizar etapa",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Etapa atualizada",
          description: `${data.nome} foi atualizada`
        });

        fetchStages();
        return data;
      } else {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao criar etapa",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Etapa criada",
          description: `${data.nome} foi criada`
        });

        fetchStages();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      return null;
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
    refetch: fetchStages
  };
}
