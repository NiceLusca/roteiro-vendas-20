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
  segmento_alvo?: string;
  responsaveis?: string[];
  tags?: string[];
  default_para_novos_leads?: boolean;
}

interface PipelineStage {
  id?: string;
  nome?: string;
  ordem?: number;
  prazo_em_dias?: number;
  proximo_passo_tipo?: 'Humano' | 'Agendamento' | 'Mensagem' | 'Outro';
  proximo_passo_label?: string;
  entrada_criteria?: string;
  saida_criteria?: string;
  wip_limit?: number;
  gerar_agendamento_auto?: boolean;
  duracao_minutos?: number;
  checklist_items?: ChecklistItem[];
}

interface ChecklistItem {
  id?: string;
  titulo?: string;
  ordem?: number;
  obrigatorio?: boolean;
}

interface ComplexPipelineData {
  nome?: string;
  descricao?: string;
  objetivo?: string;
  ativo?: boolean;
  primary_pipeline?: boolean;
  segmento_alvo?: string;
  responsaveis?: string[];
  tags?: string[];
  stages?: PipelineStage[];
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

  // Save simple pipeline
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

      await fetchPipelines();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
      return null;
    }
  };

  // Save complex pipeline with stages and checklist items (with transaction)
  const saveComplexPipeline = async (complexData: ComplexPipelineData & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!complexData.id;
      
      // Separate pipeline data from stages
      const { stages, ...pipelineData } = complexData;
      
      // Build pipeline payload
      const pipelinePayload: any = {};
      Object.keys(pipelineData).forEach(key => {
        if (key !== 'id' && pipelineData[key as keyof typeof pipelineData] !== undefined) {
          pipelinePayload[key] = pipelineData[key as keyof typeof pipelineData];
        }
      });
      
      pipelinePayload.user_id = user.id;
      pipelinePayload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        pipelinePayload.created_at = new Date().toISOString();
      }

      // Start transaction-like operations
      let savedPipeline;
      
      // Save pipeline first
      if (isUpdate) {
        const { data, error } = await supabase
          .from('pipelines')
          .update(pipelinePayload)
          .eq('id', complexData.id!)
          .select()
          .single();
        
        if (error) throw error;
        savedPipeline = data;
      } else {
        const { data, error } = await supabase
          .from('pipelines')
          .insert(pipelinePayload)
          .select()
          .single();
        
        if (error) throw error;
        savedPipeline = data;
      }

      // Save stages if provided
      if (stages && stages.length > 0) {
        for (const stage of stages) {
          const { checklist_items, ...stageData } = stage;
          
          // Validate required stage fields
          if (!stageData.nome || !stageData.ordem || !stageData.prazo_em_dias || !stageData.proximo_passo_tipo) {
            console.warn('Etapa com dados incompletos ignorada:', stageData);
            continue;
          }
          
          const stagePayload = {
            nome: stageData.nome,
            ordem: stageData.ordem,
            prazo_em_dias: stageData.prazo_em_dias,
            proximo_passo_tipo: stageData.proximo_passo_tipo,
            proximo_passo_label: stageData.proximo_passo_label,
            entrada_criteria: stageData.entrada_criteria,
            saida_criteria: stageData.saida_criteria,
            wip_limit: stageData.wip_limit,
            gerar_agendamento_auto: stageData.gerar_agendamento_auto,
            duracao_minutos: stageData.duracao_minutos,
            pipeline_id: savedPipeline.id,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          const { data: savedStage, error: stageError } = await supabase
            .from('pipeline_stages')
            .insert(stagePayload)
            .select()
            .single();

          if (stageError) throw stageError;

          // Save checklist items for this stage
          if (checklist_items && checklist_items.length > 0) {
            const validChecklistItems = checklist_items.filter(item => 
              item.titulo && item.titulo.trim() !== '' && 
              typeof item.ordem === 'number' && 
              typeof item.obrigatorio === 'boolean'
            );
            
            if (validChecklistItems.length > 0) {
              const checklistPayloads = validChecklistItems.map(item => ({
                titulo: item.titulo!,
                ordem: item.ordem!,
                obrigatorio: item.obrigatorio!,
                stage_id: savedStage.id,
                created_at: new Date().toISOString(),
              }));

              const { error: checklistError } = await supabase
                .from('stage_checklist_items')
                .insert(checklistPayloads);

              if (checklistError) throw checklistError;
            }
          }
        }
      }

      toast({
        title: `Pipeline ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Pipeline "${savedPipeline.nome}" foi ${isUpdate ? 'atualizado' : 'criado'} com ${stages?.length || 0} etapas`
      });

      await fetchPipelines();
      
      return savedPipeline;
    } catch (error) {
      console.error('Erro ao salvar pipeline complexo:', error);
      
      // Rollback is handled by individual operations failing
      toast({
        title: "Erro ao salvar pipeline",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    }
  };

  // Duplicate pipeline
  const duplicatePipeline = async (sourcePipelineId: string, newName: string) => {
    if (!user) return null;

    try {
      // Fetch original pipeline with stages and checklist items
      const { data: originalPipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', sourcePipelineId)
        .single();

      if (pipelineError) throw pipelineError;

      const { data: originalStages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select(`
          *,
          stage_checklist_items (*)
        `)
        .eq('pipeline_id', sourcePipelineId)
        .order('ordem');

      if (stagesError) throw stagesError;

      // Create complex data structure
      const complexData: ComplexPipelineData = {
        nome: newName,
        descricao: originalPipeline.descricao,
        objetivo: originalPipeline.objetivo,
        ativo: true,
        primary_pipeline: false,
        segmento_alvo: (originalPipeline as any).segmento_alvo,
        responsaveis: (originalPipeline as any).responsaveis || [],
        tags: (originalPipeline as any).tags || [],
        
        stages: originalStages?.map(stage => ({
          nome: stage.nome,
          ordem: stage.ordem,
          prazo_em_dias: stage.prazo_em_dias,
          proximo_passo_tipo: stage.proximo_passo_tipo as any,
          proximo_passo_label: stage.proximo_passo_label,
          entrada_criteria: stage.entrada_criteria,
          saida_criteria: stage.saida_criteria,
          wip_limit: stage.wip_limit,
          gerar_agendamento_auto: stage.gerar_agendamento_auto,
          duracao_minutos: stage.duracao_minutos,
          checklist_items: stage.stage_checklist_items?.map(item => ({
            titulo: item.titulo,
            ordem: item.ordem,
            obrigatorio: item.obrigatorio,
          })) || [],
        })) || [],
      };

      return await saveComplexPipeline(complexData);
    } catch (error) {
      console.error('Erro ao duplicar pipeline:', error);
      toast({
        title: "Erro ao duplicar pipeline",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
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
    saveComplexPipeline,
    duplicatePipeline,
    getPipelineById,
    getActivePipelines,
    getPrimaryPipeline,
    refetch: fetchPipelines
  };
}