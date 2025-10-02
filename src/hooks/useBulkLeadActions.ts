import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

interface BulkActionFilters {
  searchTerm?: string;
  filterStatus?: string;
  filterScore?: string;
  filterTag?: string;
}

export function useBulkLeadActions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getFilteredLeadIds = async (filters: BulkActionFilters): Promise<string[]> => {
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('leads')
      .select('id');

    // Apply filters
    if (filters.filterStatus && filters.filterStatus !== 'all') {
      query = query.eq('status_geral', filters.filterStatus as any);
    }
    
    if (filters.filterScore && filters.filterScore !== 'all') {
      query = query.eq('lead_score_classification', filters.filterScore as any);
    }

    // Apply tag filter
    if (filters.filterTag && filters.filterTag !== 'all') {
      const { data: tagAssignments } = await supabase
        .from('lead_tag_assignments')
        .select('lead_id')
        .eq('tag_id', filters.filterTag);
      
      const leadIdsWithTag = tagAssignments?.map(a => a.lead_id) || [];
      if (leadIdsWithTag.length > 0) {
        query = query.in('id', leadIdsWithTag);
      } else {
        return [];
      }
    }

    // Apply search
    if (filters.searchTerm) {
      query = query.or(`nome.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,whatsapp.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(lead => lead.id) || [];
  };

  const addTagsToLeads = async (leadIds: string[], tagIds: string[]) => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Verificar tags existentes para evitar duplicatas
      const { data: existing } = await supabase
        .from('lead_tag_assignments')
        .select('lead_id, tag_id')
        .in('lead_id', leadIds)
        .in('tag_id', tagIds);

      const existingSet = new Set(
        existing?.map(e => `${e.lead_id}-${e.tag_id}`) || []
      );

      // Criar apenas as atribuições que não existem
      const assignments = leadIds.flatMap(leadId =>
        tagIds
          .filter(tagId => !existingSet.has(`${leadId}-${tagId}`))
          .map(tagId => ({
            lead_id: leadId,
            tag_id: tagId
          }))
      );

      if (assignments.length === 0) {
        toast({
          title: 'Nenhuma alteração necessária',
          description: 'Todos os leads já possuem as tags selecionadas.'
        });
        return;
      }

      // Inserir em batches de 500
      const batchSize = 500;
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        const { error } = await supabase
          .from('lead_tag_assignments')
          .insert(batch);

        if (error) throw error;

        setProgress(Math.round(((i + batch.length) / assignments.length) * 100));
      }

      toast({
        title: 'Tags adicionadas com sucesso',
        description: `${leadIds.length} leads foram tagueados.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar tags',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const removeTagsFromLeads = async (leadIds: string[], tagIds: string[]) => {
    setIsLoading(true);
    setProgress(0);

    try {
      const { error } = await supabase
        .from('lead_tag_assignments')
        .delete()
        .in('lead_id', leadIds)
        .in('tag_id', tagIds);

      if (error) throw error;

      toast({
        title: 'Tags removidas com sucesso',
        description: `Tags removidas de ${leadIds.length} leads.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover tags',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const replaceTagsOnLeads = async (leadIds: string[], newTagIds: string[]) => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Remover todas as tags atuais
      await supabase
        .from('lead_tag_assignments')
        .delete()
        .in('lead_id', leadIds);

      setProgress(50);

      // Adicionar novas tags
      const assignments = leadIds.flatMap(leadId =>
        newTagIds.map(tagId => ({
          lead_id: leadId,
          tag_id: tagId
        }))
      );

      if (assignments.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < assignments.length; i += batchSize) {
          const batch = assignments.slice(i, i + batchSize);
          const { error } = await supabase
            .from('lead_tag_assignments')
            .insert(batch);

          if (error) throw error;

          setProgress(50 + Math.round(((i + batch.length) / assignments.length) * 50));
        }
      }

      toast({
        title: 'Tags substituídas com sucesso',
        description: `${leadIds.length} leads atualizados.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao substituir tags',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const deleteLeads = async (leadIds: string[]) => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Deletar em batches de 500
      const batchSize = 500;
      for (let i = 0; i < leadIds.length; i += batchSize) {
        const batch = leadIds.slice(i, i + batchSize);
        const { error } = await supabase
          .from('leads')
          .delete()
          .in('id', batch);

        if (error) throw error;

        setProgress(Math.round(((i + batch.length) / leadIds.length) * 100));
      }

      toast({
        title: 'Leads excluídos com sucesso',
        description: `${leadIds.length} leads foram excluídos permanentemente.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir leads',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return {
    getFilteredLeadIds,
    addTagsToLeads,
    removeTagsFromLeads,
    replaceTagsOnLeads,
    deleteLeads,
    isLoading,
    progress
  };
}
