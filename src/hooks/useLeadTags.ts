import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useToast } from '@/hooks/use-toast';
import { LeadTag } from '@/types/bulkImport';

export function useLeadTags() {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_tags')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      toast({
        title: 'Erro ao carregar tags',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createTag = useCallback(async (nome: string, cor: string = '#3b82f6') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .insert({
          user_id: user.id,
          nome,
          cor,
        })
        .select()
        .single();

      if (error) throw error;

      setTags(prev => [...prev, data]);
      toast({
        title: 'Tag criada',
        description: `Tag "${nome}" criada com sucesso.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Erro ao criar tag',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const assignTagsToLead = useCallback(async (leadId: string, tagIds: string[]) => {
    try {
      const assignments = tagIds.map(tagId => ({
        lead_id: leadId,
        tag_id: tagId,
      }));

      const { error } = await supabase
        .from('lead_tag_assignments')
        .insert(assignments);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error assigning tags:', error);
      throw error;
    }
  }, []);

  const getLeadTags = useCallback(async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_tag_assignments')
        .select('tag_id, lead_tags(*)')
        .eq('lead_id', leadId);

      if (error) throw error;
      return data?.map(item => item.lead_tags).filter(Boolean) as LeadTag[];
    } catch (error) {
      console.error('Error fetching lead tags:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTags();
    }
  }, [user, fetchTags]);

  return {
    tags,
    loading,
    createTag,
    assignTagsToLead,
    getLeadTags,
    refetch: fetchTags,
  };
}
