import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { LeadPipelineEntry } from '@/types/crm';

export function useSupabaseLeadPipelineEntries(pipelineId?: string) {
  const [entries, setEntries] = useState<LeadPipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads (*),
          pipeline_stages (*)
        `)
        .eq('status_inscricao', 'ativo')
        .order('data_inscricao', { ascending: false });

      if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar inscrições:', error);
        toast({
          title: "Erro ao carregar inscrições",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setEntries(data as any || []);
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
    } finally {
      setLoading(false);
    }
  };

  const inscribeLead = async (leadId: string, pipelineIdParam: string, etapaAtualId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_pipeline_entries')
        .insert({
          lead_id: leadId,
          pipeline_id: pipelineIdParam,
          etapa_atual_id: etapaAtualId,
          status_inscricao: 'ativo',
          data_inscricao: new Date().toISOString(),
          data_entrada_etapa: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao inscrever lead",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Lead inscrito",
        description: "Lead foi inscrito no pipeline"
      });

      fetchEntries();
      return data;
    } catch (error) {
      console.error('Erro ao inscrever lead:', error);
      return null;
    }
  };

  const updateEntry = async (entryId: string, updates: Partial<LeadPipelineEntry> & Record<string, any>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update(updates)
        .eq('id', entryId);

      if (error) {
        toast({
          title: "Erro ao atualizar inscrição",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      fetchEntries();
    } catch (error) {
      console.error('Erro ao atualizar inscrição:', error);
    }
  };

  const archiveEntry = async (entryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({ 
          status_inscricao: 'arquivado',
          data_conclusao: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        toast({
          title: "Erro ao arquivar inscrição",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Inscrição arquivada",
        description: "Lead foi arquivado do pipeline"
      });

      fetchEntries();
    } catch (error) {
      console.error('Erro ao arquivar inscrição:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, pipelineId]);

  return {
    entries,
    loading,
    inscribeLead,
    updateEntry,
    archiveEntry,
    refetch: fetchEntries
  };
}
