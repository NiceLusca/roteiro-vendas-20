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
  data_entrada_etapa: string;
  data_prevista_proxima_etapa?: string;
  tempo_em_etapa_dias: number;
  dias_em_atraso: number;
  saude_etapa: 'Verde' | 'Amarelo' | 'Vermelho';
  created_at: string;
  updated_at: string;
  leads?: {
    id: string;
    nome: string;
    email: string | null;
    whatsapp: string | null;
    status_geral: string | null;
    closer: string | null;
    lead_score: number | null;
    lead_score_classification: string | null;
    valor_lead: number | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  pipeline_stages?: {
    nome: string;
    ordem: number;
    pipeline_id: string;
  } | null;
}

export function useSupabaseLeadPipelineEntries(pipelineId?: string) {
  const [entries, setEntries] = useState<LeadPipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const ITEMS_PER_PAGE = 100;

  // Fetch lead pipeline entries com paginação opcional
  const fetchEntries = async (targetPipelineId?: string, forceUpdate = false, append = false, noPagination = false) => {
    if (!user) return;
    
    const effectivePipelineId = targetPipelineId || pipelineId;
    const offset = append ? page * ITEMS_PER_PAGE : 0;
    
    // ✅ Guard interno: prevenir chamadas duplicadas usando flag dedicada
    if (isFetching && !forceUpdate) {
      logger.debug('Fetch já em progresso, ignorando chamada duplicada', {
        feature: 'lead-pipeline-entries'
      });
      return;
    }

    logger.debug('fetchEntries chamado', {
      feature: 'lead-pipeline-entries',
      metadata: { effectivePipelineId, forceUpdate, append, offset }
    });
    
    try {
      setIsFetching(true);
      
      if (!append) {
        setLoading(true);
      }
      
      // ✅ Otimização: SELECT apenas campos essenciais para Kanban
      let query = supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads!fk_lead_pipeline_entries_lead(
            id,
            nome,
            email,
            whatsapp,
            closer,
            lead_score,
            origem
          ),
          pipeline_stages!fk_lead_pipeline_entries_stage(nome, ordem, pipeline_id)
        `)
        .eq('status_inscricao', 'Ativo')
        .order('data_entrada_etapa', { ascending: false });
      
      if (effectivePipelineId && effectivePipelineId.trim() !== '') {
        query = query.eq('pipeline_id', effectivePipelineId);
      }

      let data: any[] | null = null;
      let error: any = null;

      if (noPagination) {
        // ✅ Batching para superar limite de 1000 rows do Supabase
        const BATCH_SIZE = 1000;
        const allRows: any[] = [];
        let batchOffset = 0;
        let keepFetching = true;

        while (keepFetching) {
          // Clone the query builder for each batch
          let batchQuery = supabase
            .from('lead_pipeline_entries')
            .select(`
              *,
              leads!fk_lead_pipeline_entries_lead(
                id, nome, email, whatsapp, closer, lead_score, origem
              ),
              pipeline_stages!fk_lead_pipeline_entries_stage(nome, ordem, pipeline_id)
            `)
            .eq('status_inscricao', 'Ativo')
            .order('data_entrada_etapa', { ascending: false })
            .range(batchOffset, batchOffset + BATCH_SIZE - 1);

          if (effectivePipelineId && effectivePipelineId.trim() !== '') {
            batchQuery = batchQuery.eq('pipeline_id', effectivePipelineId);
          }

          const result = await batchQuery;

          if (result.error) {
            error = result.error;
            keepFetching = false;
          } else {
            const rows = result.data || [];
            allRows.push(...rows);
            batchOffset += BATCH_SIZE;
            keepFetching = rows.length === BATCH_SIZE;
            logger.debug('Batch carregado', {
              feature: 'lead-pipeline-entries',
              metadata: { batchOffset, rowsInBatch: rows.length, totalSoFar: allRows.length }
            });
          }
        }

        if (!error) {
          data = allRows;
        }
      } else {
        // Paginação normal
        query = query.range(offset, offset + ITEMS_PER_PAGE - 1);
        const result = await query;
        data = result.data;
        error = result.error;
      }

      logger.debug('fetchEntries resultado', {
        feature: 'lead-pipeline-entries',
        metadata: {
          totalEntries: data?.length || 0,
          pipelineId: effectivePipelineId,
          statusFiltrado: 'Ativo'
        }
      });

      // Diagnóstico: alertar quando nenhum lead é retornado para um pipeline específico
      if (effectivePipelineId && (!data || data.length === 0)) {
        logger.warn('Nenhum lead retornado para pipeline - possível problema de RLS ou cache', {
          feature: 'lead-pipeline-entries',
          metadata: { 
            pipelineId: effectivePipelineId, 
            userId: user?.id,
            suggestion: 'Verificar pipeline_access e token JWT do usuário'
          }
        });
      }

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
        metadata: { count: processedEntries.length, append, offset }
      });
      
      // Verificar se há mais páginas
      setHasMore(processedEntries.length === ITEMS_PER_PAGE);
      
      // Append ou replace entries
      if (append) {
        setEntries(prev => [...prev, ...processedEntries as any]);
        setPage(prev => prev + 1);
      } else {
        setEntries([...processedEntries as any]);
        setPage(0);
      }
      
      // Atualizar timestamp da última atualização
      setLastUpdated(new Date());
    } catch (error) {
      logger.error('Erro ao buscar entries', error as Error, {
        feature: 'lead-pipeline-entries'
      });
    } finally {
      setIsFetching(false);
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
        saude_etapa: 'Verde' as const
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

  // Archive pipeline entry with activity logging
  const archiveEntry = async (entryId: string, motivo?: string) => {
    if (!user) return false;

    try {
      // 1. Buscar dados do entry antes de arquivar
      const { data: entry, error: fetchError } = await supabase
        .from('lead_pipeline_entries')
        .select('lead_id, pipeline_id, etapa_atual_id')
        .eq('id', entryId)
        .maybeSingle();

      if (fetchError || !entry) {
        logger.error('Entry não encontrado para arquivar', fetchError as any, {
          feature: 'lead-pipeline-entries'
        });
        return false;
      }

      // 2. Atualizar status para Arquivado
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({
          status_inscricao: 'Arquivado',
          updated_at: new Date().toISOString()
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

      // 3. Buscar nome do usuário para o log
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const performerName = profile?.nome || profile?.full_name || user.email || 'Usuário';

      // 4. Registrar no activity log
      const { error: logError } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: entry.lead_id,
          pipeline_entry_id: entryId,
          activity_type: 'archive',
          details: {
            motivo: motivo || 'Sem motivo informado',
            pipeline_id: entry.pipeline_id,
            etapa_id: entry.etapa_atual_id
          },
          performed_by: user.id,
          performed_by_name: performerName
        });

      if (logError) {
        logger.warn('Falha ao registrar log de arquivamento', {
          feature: 'lead-pipeline-entries',
          metadata: { error: logError.message }
        });
      } else {
        logger.info('Arquivamento registrado no activity log', {
          feature: 'lead-pipeline-entries',
          metadata: { entryId, motivo }
        });
      }

      toast({
        title: "Lead descadastrado",
        description: "Lead foi removido do pipeline"
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
        etapa_atual_id: newStageId
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
      // Não limpar entries - manter dados visíveis enquanto busca novos
      setPage(0);
      // Se há pipelineId, buscar sem paginação
      const shouldPaginate = !pipelineId;
      fetchEntries(pipelineId, false, false, !shouldPaginate);
    }
  }, [pipelineId]); // Removido 'user' das dependências para evitar reset ao mudar de aba

  // Real-time updates com debounce e filtros
  useEffect(() => {
    if (!user) return;

    let debounceTimer: NodeJS.Timeout;

    // ✅ OTIMIZAÇÃO: Filtrar realtime por pipeline_id
    const channelFilter = pipelineId 
      ? `lead_pipeline_entries:pipeline_id=eq.${pipelineId}`
      : 'lead_pipeline_entries_changes';

    const channel = supabase
      .channel(channelFilter)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_pipeline_entries',
          // ✅ Filtro server-side no realtime
          ...(pipelineId ? { filter: `pipeline_id=eq.${pipelineId}` } : {})
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          logger.debug('Realtime event', {
            feature: 'lead-pipeline-entries',
            metadata: { eventType: payload.eventType }
          });
          
          // Só refetch se realmente necessário
          const shouldRefetch = 
            payload.eventType === 'INSERT' || 
            payload.eventType === 'DELETE' ||
            (payload.eventType === 'UPDATE' && 
             newRecord?.etapa_atual_id !== oldRecord?.etapa_atual_id);
          
          if (!shouldRefetch) {
            return;
          }
          
          // ✅ Debounce aumentado para 2000ms (2s)
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            // Resetar paginação ao receber updates
            setPage(0);
            // Buscar sem paginação quando há pipelineId específico
            fetchEntries(pipelineId, true, false, !!pipelineId);
          }, 2000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user, pipelineId]);

  // Load more function para infinite scroll
  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchEntries(pipelineId, false, true);
  };

  // Busca server-side com .ilike()
  const searchLeads = async (searchTerm: string, targetPipelineId: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      // Se busca vazia, buscar todos sem paginação
      return fetchEntries(targetPipelineId, true, false, true);
    }
    
    setLoading(true);
    logger.debug('Busca server-side iniciada', {
      feature: 'lead-pipeline-entries',
      metadata: { searchTerm, targetPipelineId }
    });
    
    try {
      // ✅ Otimização: SELECT apenas campos essenciais para Kanban
      const { data, error } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads!fk_lead_pipeline_entries_lead(
            id, nome, email, whatsapp, closer, lead_score, origem
          ),
          pipeline_stages!fk_lead_pipeline_entries_stage(nome, ordem, pipeline_id)
        `)
        .eq('status_inscricao', 'Ativo')
        .eq('pipeline_id', targetPipelineId)
        .ilike('leads.nome', `%${searchTerm}%`)
        .order('data_entrada_etapa', { ascending: false });
      
      if (error) {
        logger.error('Erro na busca server-side', error as any);
        toast({
          title: "Erro ao buscar leads",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const processedEntries = (data || []).map((entry: any) => ({
        id: entry.id,
        lead_id: entry.lead_id,
        pipeline_id: entry.pipeline_id,
        etapa_atual_id: entry.etapa_atual_id,
        status_inscricao: entry.status_inscricao,
        data_entrada_etapa: entry.data_entrada_etapa,
        data_prevista_proxima_etapa: entry.data_prevista_proxima_etapa,
        saude_etapa: entry.saude_etapa || 'Verde',
        tempo_em_etapa_dias: 0,
        dias_em_atraso: 0,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        leads: entry.leads ? { ...entry.leads } : null,
        pipeline_stages: entry.pipeline_stages ? { ...entry.pipeline_stages } : null,
        _fetchedAt: Date.now()
      }));
      
      setEntries(processedEntries as any);
      setHasMore(false);
      setLoading(false);
      
      logger.info('Busca server-side concluída', {
        feature: 'lead-pipeline-entries',
        metadata: { resultados: processedEntries.length, termo: searchTerm }
      });
    } catch (error) {
      logger.error('Erro na busca server-side', error as Error);
      setLoading(false);
    }
  };

  return {
    entries,
    loading,
    isFetching,
    hasMore,
    lastUpdated,
    loadMore,
    searchLeads,
    createEntry,
    archiveEntry,
    transferToPipeline,
    getEntriesByLead,
    getEntriesByStage, 
    getOverdueEntries,
    updateHealthStatus,
    refetch: (explicitPipelineId?: string, noPagination?: boolean) => {
      const targetId = explicitPipelineId || pipelineId;
      logger.debug('refetch forçado', {
        feature: 'lead-pipeline-entries',
        metadata: { explicitPipelineId, hookPipelineId: pipelineId, targetId, noPagination }
      });
      setPage(0);
      // Não limpar entries - manter dados visíveis enquanto busca novos
      return fetchEntries(targetId, true, false, noPagination || false);
    }
  };
}