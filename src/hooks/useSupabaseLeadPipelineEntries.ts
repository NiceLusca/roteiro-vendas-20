import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { logger } from '@/utils/logger';

interface LeadPipelineEntry {
  id: string;
  lead_id: string;
  pipeline_id: string;
  etapa_atual_id: string;
  status_inscricao: string;
  nota_etapa?: string;
  data_entrada_etapa: string;
  data_prevista_proxima_etapa?: string;
  tempo_em_etapa_dias: number;
  dias_em_atraso: number;
  saude_etapa: 'Verde' | 'Amarelo' | 'Vermelho';
  created_at: string;
  updated_at: string;
}

export function useSupabaseLeadPipelineEntries(pipelineId?: string) {
  const [entries, setEntries] = useState<LeadPipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch lead pipeline entries
  const fetchEntries = async (targetPipelineId?: string, forceUpdate = false) => {
    if (!user) return;
    
    // ✅ Permitir buscar TODAS as entries quando pipelineId for undefined
    const effectivePipelineId = targetPipelineId || pipelineId;
    
    logger.debug('fetchEntries chamado', {
      feature: 'lead-pipeline-entries',
      metadata: { effectivePipelineId, forceUpdate }
    });
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads!fk_lead_pipeline_entries_lead(
            id,
            nome,
            email,
            whatsapp,
            status_geral,
            closer,
            lead_score,
            lead_score_classification,
            valor_lead,
            user_id
          ),
          pipeline_stages!fk_lead_pipeline_entries_stage(nome, ordem, pipeline_id)
        `)
        .eq('status_inscricao', 'Ativo');

      // ✅ Só filtrar por pipeline se um ID específico for fornecido
      if (effectivePipelineId && effectivePipelineId.trim() !== '') {
        query = query.eq('pipeline_id', effectivePipelineId);
      }

      // ✅ Adicionar timestamp na query para quebrar cache HTTP
      if (forceUpdate) {
        query = query.limit(9999); // Força query diferente do cache
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      logger.debug('fetchEntries resultado', {
        feature: 'lead-pipeline-entries',
        metadata: {
          totalEntries: data?.length || 0,
          pipelineId: effectivePipelineId,
          statusFiltrado: 'Ativo'
        }
      });

      if (error) {
        logger.error('Erro ao buscar entries', error as any, {
          feature: 'lead-pipeline-entries'
        });
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // ✅ SOLUÇÃO 3: Deep clone para forçar nova referência em TODOS os níveis
      const processedEntries = (data || []).map((entry: any) => ({
        // Deep clone explícito de todos os campos
        id: entry.id,
        lead_id: entry.lead_id,
        pipeline_id: entry.pipeline_id,
        etapa_atual_id: entry.etapa_atual_id,
        status_inscricao: entry.status_inscricao,
        data_entrada_etapa: entry.data_entrada_etapa,
        data_prevista_proxima_etapa: entry.data_prevista_proxima_etapa,
        nota_etapa: entry.nota_etapa,
        saude_etapa: entry.saude_etapa || 'Verde',
        tempo_em_etapa_dias: 0,
        dias_em_atraso: 0,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        // Clone nested objects (leads e pipeline_stages)
        leads: entry.leads ? { ...entry.leads } : null,
        pipeline_stages: entry.pipeline_stages ? { ...entry.pipeline_stages } : null,
        // Force timestamp para garantir unicidade
        _fetchedAt: Date.now()
      }));

      logger.info('Leads carregados', {
        feature: 'lead-pipeline-entries',
        metadata: { count: processedEntries.length }
      });
      
      // ✅ SEMPRE forçar novo array (sem if/else)
      setEntries([...processedEntries as any]);
    } catch (error) {
      logger.error('Erro ao buscar entries', error as Error, {
        feature: 'lead-pipeline-entries'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new pipeline entry
  const createEntry = async (entryData: Partial<LeadPipelineEntry>) => {
    logger.debug('createEntry chamado', {
      feature: 'lead-pipeline-entries',
      metadata: entryData
    });

    if (!user) {
      logger.error('Sem usuário autenticado', undefined, {
        feature: 'lead-pipeline-entries'
      });
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para criar entradas no pipeline",
        variant: "destructive"
      });
      return null;
    }

    // Validar campos obrigatórios
    if (!entryData.lead_id || !entryData.pipeline_id || !entryData.etapa_atual_id) {
      logger.error('Campos obrigatórios faltando', undefined, {
        feature: 'lead-pipeline-entries',
        metadata: {
          lead_id: entryData.lead_id,
          pipeline_id: entryData.pipeline_id,
          etapa_atual_id: entryData.etapa_atual_id
        }
      });
      toast({
        title: "Erro de validação",
        description: "Campos obrigatórios não fornecidos para criar entrada no pipeline",
        variant: "destructive"
      });
      return null;
    }

    try {
      const now = new Date();
      const isoTimestamp = now.toISOString();
      
      const insertData = {
        lead_id: entryData.lead_id,
        pipeline_id: entryData.pipeline_id,
        etapa_atual_id: entryData.etapa_atual_id,
        status_inscricao: 'Ativo',
        data_entrada_etapa: isoTimestamp,
        saude_etapa: 'Verde' as const,
        ...(entryData.nota_etapa && { nota_etapa: entryData.nota_etapa })
      };

      logger.debug('Executando INSERT', {
        feature: 'lead-pipeline-entries',
        metadata: insertData
      });

      const { data, error } = await supabase
        .from('lead_pipeline_entries')
        .insert([insertData])
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Erro ao criar entry', error as any, {
          feature: 'lead-pipeline-entries',
          metadata: {
            message: error.message,
            code: error.code
          }
        });
        toast({
          title: "Erro ao inscrever lead",
          description: `${error.message} (código: ${error.code})`,
          variant: "destructive"
        });
        return null;
      }

      if (!data) {
        logger.error('Entry não criado', undefined, {
          feature: 'lead-pipeline-entries'
        });
        toast({
          title: "Erro",
          description: "Entrada não foi criada, mas sem erro retornado",
          variant: "destructive"
        });
        return null;
      }

      logger.info('Entry criado com sucesso', {
        feature: 'lead-pipeline-entries',
        metadata: { entryId: data.id }
      });

      toast({
        title: "✅ Lead inscrito no pipeline",
        description: "Lead foi inscrito com sucesso"
      });

      await fetchEntries();
      return data;
    } catch (error) {
      logger.error('Exceção ao criar entry', error as Error, {
        feature: 'lead-pipeline-entries'
      });
      toast({
        title: "Erro inesperado",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
      return null;
    }
  };

  // Update pipeline entry

  // Archive pipeline entry
  const archiveEntry = async (entryId: string, motivo?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({
          status_inscricao: 'Arquivado',
          updated_at: new Date().toISOString(),
          nota_etapa: motivo || 'Arquivado pelo usuário'
        })
        .eq('id', entryId);

      if (error) {
        logger.error('Erro ao arquivar entry', error as any, {
          feature: 'lead-pipeline-entries'
        });
        toast({
          title: "Erro ao arquivar",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Entry arquivado",
        description: "Lead foi removido do pipeline ativo"
      });

      fetchEntries();
      return true;
    } catch (error) {
      logger.error('Erro ao arquivar entry', error as Error, {
        feature: 'lead-pipeline-entries'
      });
      return false;
    }
  };

  // Transfer between pipelines
  const transferToPipeline = async (
    entryId: string, 
    newPipelineId: string, 
    newStageId: string, 
    motivo: string
  ) => {
    if (!user) return false;

    try {
      // Archive current entry
      await archiveEntry(entryId, `Transferido para pipeline: ${newPipelineId}`);

      // Get original entry data
      const { data: originalEntry, error: fetchError } = await supabase
        .from('lead_pipeline_entries')
        .select('lead_id')
        .eq('id', entryId)
        .maybeSingle();

      if (fetchError || !originalEntry) {
        throw new Error('Entry original não encontrado');
      }

      // Create new entry in target pipeline
      const newEntry = await createEntry({
        lead_id: originalEntry.lead_id,
        pipeline_id: newPipelineId,
        etapa_atual_id: newStageId,
        nota_etapa: `Transferido de outro pipeline. Motivo: ${motivo}`
      });

      if (newEntry) {
        toast({
          title: "Lead transferido",
          description: "Lead foi transferido para o novo pipeline com sucesso"
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Erro ao transferir', error as Error, {
        feature: 'lead-pipeline-entries'
      });
      toast({
        title: "Erro na transferência",
        description: "Não foi possível transferir o lead",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get entries by lead ID
  const getEntriesByLead = (leadId: string) => {
    return entries.filter(entry => entry.lead_id === leadId && entry.status_inscricao === 'Ativo');
  };

  // Get entries by stage ID
  const getEntriesByStage = (stageId: string) => {
    return entries.filter(entry => entry.etapa_atual_id === stageId && entry.status_inscricao === 'Ativo');
  };

  // Get overdue entries
  const getOverdueEntries = () => {
    return entries.filter(entry => entry.dias_em_atraso > 0 && entry.status_inscricao === 'Ativo');
  };

  // Update health status based on SLA
  const updateHealthStatus = async (entryId: string, health: 'Verde' | 'Amarelo' | 'Vermelho') => {
    const { error } = await supabase
      .from('lead_pipeline_entries')
      .update({ saude_etapa: health })
      .eq('id', entryId);
    
    if (!error) {
      await fetchEntries();
    }
    
    return !error;
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, pipelineId]);

  // Real-time updates com debounce
  useEffect(() => {
    if (!user) return;

    let debounceTimer: NodeJS.Timeout;

    const channel = supabase
      .channel('lead_pipeline_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_pipeline_entries'
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          logger.debug('Realtime event', {
            feature: 'lead-pipeline-entries',
            metadata: { eventType: payload.eventType }
          });
          
          const recordPipelineId = newRecord?.pipeline_id || oldRecord?.pipeline_id;
          if (pipelineId && recordPipelineId !== pipelineId) {
            return;
          }
          
          // ✅ SOLUÇÃO 5: Só refetch se realmente necessário
          const shouldRefetch = 
            payload.eventType === 'INSERT' || 
            payload.eventType === 'DELETE' ||
            (payload.eventType === 'UPDATE' && 
             newRecord?.etapa_atual_id !== oldRecord?.etapa_atual_id);
          
          if (!shouldRefetch) {
            return;
          }
          
          // ✅ SOLUÇÃO 1: Debounce aumentado de 50ms para 500ms
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchEntries(pipelineId, true);
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user, pipelineId]);

  return {
    entries,
    loading,
    createEntry,
    archiveEntry,
    transferToPipeline,
    getEntriesByLead,
    getEntriesByStage, 
    getOverdueEntries,
    updateHealthStatus,
    refetch: (explicitPipelineId?: string) => {
      const targetId = explicitPipelineId || pipelineId;
      logger.debug('refetch forçado', {
        feature: 'lead-pipeline-entries',
        metadata: { explicitPipelineId, hookPipelineId: pipelineId, targetId }
      });
      return fetchEntries(targetId, true); // ✅ Força re-render
    }
  };
}