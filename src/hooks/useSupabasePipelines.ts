import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Pipeline {
  id: string;
  nome: string;
  descricao?: string;
  objetivo?: string;
  ativo: boolean;
  primary_pipeline: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useSupabasePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch pipelines
  const fetchPipelines = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Save pipeline
  const savePipeline = async (pipelineData: Partial<Pipeline> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!pipelineData.id;
      
      const payload: any = {};
      
      Object.keys(pipelineData).forEach(key => {
        if (key !== 'id' && pipelineData[key as keyof typeof pipelineData] !== undefined) {
          payload[key] = pipelineData[key as keyof typeof pipelineData];
        }
      });
      
      payload.user_id = user.id;
      payload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('pipelines')
          .update(payload)
          .eq('id', pipelineData.id!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('pipelines')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Erro ao salvar pipeline:', result.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} pipeline`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Pipeline ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Pipeline ${result.data.nome} foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      fetchPipelines();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
      return null;
    }
  };

  // Get pipeline by ID
  const getPipelineById = (id: string): Pipeline | undefined => {
    return pipelines.find(pipeline => pipeline.id === id);
  };

  // Get active pipelines
  const getActivePipelines = (): Pipeline[] => {
    return pipelines.filter(p => p.ativo);
  };

  // Get primary pipeline
  const getPrimaryPipeline = (): Pipeline | undefined => {
    return pipelines.find(p => p.primary_pipeline && p.ativo);
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
    getPipelineById,
    getActivePipelines,
    getPrimaryPipeline,
    refetch: fetchPipelines
  };
}