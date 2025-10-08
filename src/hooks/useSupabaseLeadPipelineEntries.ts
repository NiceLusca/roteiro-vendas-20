import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

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
  const fetchEntries = async (targetPipelineId?: string) => {
    if (!user) return;
    
    // ✅ Guard: Não fazer query se não houver pipeline selecionado
    const effectivePipelineId = targetPipelineId || pipelineId;
    if (!effectivePipelineId) {
      console.log('⚠️ Sem pipeline selecionado, pulando fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads!inner(
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
          pipeline_stages!inner(nome, ordem, pipeline_id)
        `)
        .eq('status_inscricao', 'Ativo');

      if (targetPipelineId || pipelineId) {
        query = query.eq('pipeline_id', targetPipelineId || pipelineId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar entries do pipeline:', error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setEntries((data || []).map((entry: any) => ({
        ...entry,
        tempo_em_etapa_dias: 0,
        dias_em_atraso: 0
      })) as any);
    } catch (error) {
      console.error('Erro ao buscar entries do pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new pipeline entry
  const createEntry = async (entryData: Partial<LeadPipelineEntry>) => {
    console.log('🔵 createEntry CHAMADO com:', entryData);
    console.log('🔵 User atual:', user?.id);

    if (!user) {
      console.error('❌ SEM USUÁRIO AUTENTICADO');
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para criar entradas no pipeline",
        variant: "destructive"
      });
      return null;
    }

    // Validar campos obrigatórios
    if (!entryData.lead_id || !entryData.pipeline_id || !entryData.etapa_atual_id) {
      console.error('❌ Campos obrigatórios faltando:', {
        lead_id: entryData.lead_id,
        pipeline_id: entryData.pipeline_id,
        etapa_atual_id: entryData.etapa_atual_id
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

      console.log('📝 EXECUTANDO INSERT com dados:', JSON.stringify(insertData, null, 2));

      const { data, error } = await supabase
        .from('lead_pipeline_entries')
        .insert([insertData])
        .select()
        .maybeSingle();

      console.log('🔵 Resultado do INSERT:', { data, error });

      if (error) {
        console.error('❌ ERRO SUPABASE ao criar entry:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "Erro ao inscrever lead",
          description: `${error.message} (código: ${error.code})`,
          variant: "destructive"
        });
        return null;
      }

      if (!data) {
        console.error('❌ Entry não foi criado - sem dados retornados');
        toast({
          title: "Erro",
          description: "Entrada não foi criada, mas sem erro retornado",
          variant: "destructive"
        });
        return null;
      }

      console.log('✅✅✅ Entry criado COM SUCESSO:', data);

      toast({
        title: "✅ Lead inscrito no pipeline",
        description: "Lead foi inscrito com sucesso"
      });

      await fetchEntries();
      return data;
    } catch (error) {
      console.error('❌ EXCEÇÃO JAVASCRIPT ao criar entry:', error);
      toast({
        title: "Erro inesperado",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
      return null;
    }
  };

  // Update pipeline entry
  const updateEntry = async (entryId: string, updates: Partial<LeadPipelineEntry>) => {
    if (!user) return null;

    console.log('🔄 updateEntry chamado:', { entryId, updates });

    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Convert Date objects to ISO strings for Supabase
      if (updateData.data_entrada_etapa instanceof Date) {
        updateData.data_entrada_etapa = updateData.data_entrada_etapa.toISOString();
      }
      if (updateData.data_prevista_proxima_etapa instanceof Date) {
        updateData.data_prevista_proxima_etapa = updateData.data_prevista_proxima_etapa.toISOString();
      }

      console.log('📝 Dados para update:', updateData);

      const { data, error } = await supabase
        .from('lead_pipeline_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .maybeSingle();

      console.log('✅ Resultado do update:', { data, error });

      if (error) {
        console.error('❌ Erro ao atualizar entry:', error);
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
          duration: 5000
        });
        return null;
      }

      await fetchEntries();
      console.log('🔄 Entries atualizadas após update');
      return data;
    } catch (error) {
      console.error('❌ Exceção ao atualizar entry:', error);
      return null;
    }
  };

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
        console.error('Erro ao arquivar entry:', error);
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
      console.error('Erro ao arquivar entry:', error);
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
      console.error('Erro ao transferir:', error);
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
  const updateHealthStatus = (entryId: string, health: 'Verde' | 'Amarelo' | 'Vermelho') => {
    return updateEntry(entryId, { saude_etapa: health });
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, pipelineId]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('lead_pipeline_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_pipeline_entries'
        },
        () => {
          // Refetch entries when any change occurs
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pipelineId]);

  return {
    entries,
    loading,
    createEntry,
    updateEntry,
    archiveEntry,
    transferToPipeline,
    getEntriesByLead,
    getEntriesByStage, 
    getOverdueEntries,
    updateHealthStatus,
    refetch: fetchEntries
  };
}