import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

import { PipelineDisplayConfig } from '@/types/pipelineDisplay';

interface Pipeline {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  objetivo?: string;
  ativo: boolean;
  primary_pipeline: boolean;
  created_at: string;
  updated_at: string;
  segmento_alvo?: string;
  responsaveis?: string[];
  tags?: string[];
  default_para_novos_leads?: boolean;
  display_config?: PipelineDisplayConfig | null;
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
        .select(`
          id,
          nome,
          slug,
          descricao,
          objetivo,
          ativo,
          primary_pipeline,
          created_at,
          updated_at,
          display_config
        `)
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

      setPipelines((data as unknown as Pipeline[]) || []);
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

  // Validate UUID helper function
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Save complex pipeline with stages and checklist items (with better error handling)
  const saveComplexPipeline = async (complexData: ComplexPipelineData & { id?: string }) => {
    if (!user || !user.id) {
      console.error('No user found:', user);
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return null;
    }

    // Validate user ID is a valid UUID
    if (!isValidUUID(user.id)) {
      console.error('Invalid user ID format:', user.id);
      toast({
        title: "Erro de autenticação",
        description: "ID do usuário inválido. Faça login novamente.",
        variant: "destructive"
      });
      return null;
    }

    // Validate required pipeline fields
    if (!complexData.nome || complexData.nome.trim() === '') {
      toast({
        title: "Erro de validação",
        description: "Nome do pipeline é obrigatório",
        variant: "destructive"
      });
      return null;
    }

    // Validate stages if provided
    if (complexData.stages && complexData.stages.length > 0) {
      for (let i = 0; i < complexData.stages.length; i++) {
        const stage = complexData.stages[i];
        if (!stage.nome || stage.nome.trim() === '') {
          toast({
            title: "Erro de validação",
            description: `Nome da etapa ${i + 1} é obrigatório`,
            variant: "destructive"
          });
          return null;
        }
        if (!stage.prazo_em_dias || stage.prazo_em_dias < 1) {
          toast({
            title: "Erro de validação",
            description: `Prazo da etapa "${stage.nome}" deve ser pelo menos 1 dia`,
            variant: "destructive"
          });
          return null;
        }
      }
    }

    try {
      const isUpdate = !!complexData.id;
      
      // Separate pipeline data from stages
      const { stages, ...pipelineData } = complexData;
      
      // Build pipeline payload with only valid fields  
      const pipelinePayload: any = {
        nome: pipelineData.nome?.trim(),
        updated_at: new Date().toISOString()
      };

      // Add optional fields if they exist
      if (pipelineData.descricao !== undefined) pipelinePayload.descricao = pipelineData.descricao;
      if (pipelineData.objetivo !== undefined) pipelinePayload.objetivo = pipelineData.objetivo;
      if (pipelineData.ativo !== undefined) pipelinePayload.ativo = pipelineData.ativo;
      if (pipelineData.primary_pipeline !== undefined) pipelinePayload.primary_pipeline = pipelineData.primary_pipeline;
      
      if (!isUpdate) {
        pipelinePayload.created_at = new Date().toISOString();
      }

      // Save pipeline first
      let savedPipeline;
      
      if (isUpdate) {
        // Delete existing stages first to avoid conflicts
        const { error: deleteError } = await supabase
          .from('pipeline_stages')
          .delete()
          .eq('pipeline_id', complexData.id!);

        if (deleteError) {
          console.warn('Warning deleting existing stages:', deleteError.message);
          // Continue anyway as stages might not exist
        }

        const { data, error } = await supabase
          .from('pipelines')
          .update(pipelinePayload)
          .eq('id', complexData.id!)
          .select()
          .single();
        
        if (error) {
          console.error('Update pipeline error:', error);
          throw new Error(`Erro ao atualizar pipeline: ${error.message}`);
        }
        savedPipeline = data;
      } else {
        const { data, error } = await supabase
          .from('pipelines')
          .insert(pipelinePayload)
          .select()
          .single();
        
        if (error) {
          console.error('Create pipeline error:', error);
          console.error('Failed payload:', pipelinePayload);
          throw new Error(`Erro ao criar pipeline: ${error.message}`);
        }
        savedPipeline = data;
      }

      // Save stages if provided
      if (stages && stages.length > 0) {
        let stagesSaved = 0;
        let checklistItemsSaved = 0;

        for (const [index, stage] of stages.entries()) {
          const { checklist_items, ...stageData } = stage;
          
          // Ensure required stage fields and proper order
          const stagePayload: any = {
            nome: stageData.nome!,
            ordem: index + 1, // Force sequential order
            prazo_em_dias: stageData.prazo_em_dias!,
            proximo_passo_tipo: stageData.proximo_passo_tipo || 'Humano',
            pipeline_id: savedPipeline.id,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          // Add optional stage fields
          if (stageData.proximo_passo_label) stagePayload.proximo_passo_label = stageData.proximo_passo_label;
          if (stageData.entrada_criteria) stagePayload.entrada_criteria = stageData.entrada_criteria;
          if (stageData.saida_criteria) stagePayload.saida_criteria = stageData.saida_criteria;
          if (stageData.wip_limit) stagePayload.wip_limit = stageData.wip_limit;
          if (stageData.gerar_agendamento_auto !== undefined) stagePayload.gerar_agendamento_auto = stageData.gerar_agendamento_auto;
          if (stageData.duracao_minutos) stagePayload.duracao_minutos = stageData.duracao_minutos;

          const { data: savedStage, error: stageError } = await supabase
            .from('pipeline_stages')
            .insert(stagePayload)
            .select()
            .single();

          if (stageError) {
            throw new Error(`Erro ao salvar etapa "${stageData.nome}": ${stageError.message}`);
          }

          stagesSaved++;

          // Save checklist items for this stage
          if (checklist_items && checklist_items.length > 0) {
            const validChecklistItems = checklist_items
              .filter(item => item.titulo && item.titulo.trim() !== '')
              .map((item, itemIndex) => ({
                titulo: item.titulo!,
                ordem: itemIndex + 1,
                obrigatorio: item.obrigatorio || false,
                etapa_id: savedStage.id,
                created_at: new Date().toISOString(),
              }));
            
            if (validChecklistItems.length > 0) {
              const { error: checklistError } = await supabase
                .from('stage_checklist_items')
                .insert(validChecklistItems);

              if (checklistError) {
                throw new Error(`Erro ao salvar checklist da etapa "${stageData.nome}": ${checklistError.message}`);
              }

              checklistItemsSaved += validChecklistItems.length;
            }
          }
        }

        toast({
          title: `Pipeline ${isUpdate ? 'atualizado' : 'criado'} com sucesso!`,
          description: `"${savedPipeline.nome}" - ${stagesSaved} etapas e ${checklistItemsSaved} itens de checklist salvos`,
        });
      } else {
        toast({
          title: `Pipeline ${isUpdate ? 'atualizado' : 'criado'} com sucesso!`,
          description: `"${savedPipeline.nome}" foi salvo sem etapas`,
        });
      }

      await fetchPipelines();
      
      return savedPipeline;
    } catch (error) {
      console.error('Erro ao salvar pipeline complexo:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar pipeline";
      
      toast({
        title: "Erro ao salvar pipeline",
        description: errorMessage,
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
        
        stages: originalStages?.map(stage => ({
          nome: stage.nome,
          ordem: stage.ordem,
          prazo_em_dias: stage.prazo_em_dias,
          proximo_passo_tipo: stage.proximo_passo_tipo as any,
          proximo_passo_label: stage.proximo_passo_label,
          wip_limit: stage.wip_limit,
          gerar_agendamento_auto: stage.gerar_agendamento_auto,
          duracao_minutos: stage.duracao_minutos,
          checklist_items: (stage.stage_checklist_items as any[])?.map(item => ({
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

  // Delete pipeline
  const deletePipeline = async (pipelineId: string) => {
    if (!user) return false;

    try {
      // Check if pipeline has leads before deleting
      const { data: leadEntries, error: leadCheckError } = await supabase
        .from('lead_pipeline_entries')
        .select('id')
        .eq('pipeline_id', pipelineId)
        .limit(1);

      if (leadCheckError) {
        throw new Error(`Erro ao verificar leads: ${leadCheckError.message}`);
      }

      if (leadEntries && leadEntries.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este pipeline possui leads ativos. Transfira ou arquive os leads antes de excluir o pipeline.",
          variant: "destructive"
        });
        return false;
      }

      // Delete checklist items first
      // Delete checklist items (simplified query)
      const stageIds = (await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipelineId)
      ).data?.map(s => s.id) || [];
      
      if (stageIds.length > 0) {
        const { error: checklistError } = await supabase
          .from('stage_checklist_items')
          .delete()
          .in('etapa_id', stageIds);
        
        if (checklistError) console.error('Error deleting checklist items:', checklistError);
      }

      // Delete stages
      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('pipeline_id', pipelineId);

      if (stagesError) {
        throw new Error(`Erro ao excluir etapas: ${stagesError.message}`);
      }

      // Delete pipeline
      const { error: pipelineError } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', pipelineId);

      if (pipelineError) {
        throw new Error(`Erro ao excluir pipeline: ${pipelineError.message}`);
      }

      toast({
        title: "Pipeline excluído",
        description: "Pipeline e todas suas etapas foram excluídos com sucesso.",
      });

      await fetchPipelines();
      return true;
    } catch (error) {
      console.error('Erro ao excluir pipeline:', error);
      toast({
        title: "Erro ao excluir pipeline",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get pipeline by slug
  const getPipelineBySlug = async (slug: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar pipeline por slug:', error);
        return null;
      }

      return data as unknown as Pipeline;
    } catch (error) {
      console.error('Erro ao buscar pipeline por slug:', error);
      return null;
    }
  };

  // Update display config only
  const updateDisplayConfig = async (pipelineId: string, config: PipelineDisplayConfig): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pipelines')
        .update({ 
          display_config: config as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', pipelineId);

      if (error) {
        console.error('Erro ao atualizar display_config:', error);
        toast({
          title: "Erro ao salvar configuração",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Configuração salva!",
        description: "As alterações de visualização foram aplicadas.",
      });

      await fetchPipelines();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar display_config:', error);
      return false;
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
    saveComplexPipeline,
    duplicatePipeline,
    deletePipeline,
    getPipelineById,
    getPipelineBySlug,
    getActivePipelines,
    getPrimaryPipeline,
    updateDisplayConfig,
    refetch: fetchPipelines
  };
}