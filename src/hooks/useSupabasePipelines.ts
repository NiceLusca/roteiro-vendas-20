import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { Pipeline } from '@/types/crm';

export function useSupabasePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPipelines = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar pipelines:', error);
        toast({
          title: "Erro ao carregar pipelines",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setPipelines(data || []);
    } catch (error) {
      console.error('Erro ao buscar pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePipeline = async (pipelineData: Partial<Pipeline> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, created_at, updated_at, ...dataToSave } = pipelineData;
      
      if (id) {
        const { data, error } = await supabase
          .from('pipelines')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao atualizar pipeline",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Pipeline atualizado",
          description: `${data.nome} foi atualizado`
        });

        fetchPipelines();
        return data;
      } else {
        const { data, error } = await supabase
          .from('pipelines')
          .insert(dataToSave)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao criar pipeline",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Pipeline criado",
          description: `${data.nome} foi criado`
        });

        fetchPipelines();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPipelines();
    }
  }, [user]);

  return {
    pipelines,
    loading,
    savePipeline,
    refetch: fetchPipelines
  };
}
