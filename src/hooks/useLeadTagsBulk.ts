import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeadTag } from '@/types/bulkImport';

interface UseMultipleLeadTagsResult {
  data: Record<string, LeadTag[]>;
  loading: boolean;
  refetch: () => void;
}

export function useMultipleLeadTags(leadIds: string[]): UseMultipleLeadTagsResult {
  const [data, setData] = useState<Record<string, LeadTag[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!leadIds.length) {
      setData({});
      return;
    }

    try {
      setLoading(true);
      
      const { data: assignments, error } = await supabase
        .from('lead_tag_assignments')
        .select('lead_id, tag_id, tags(*)')
        .in('lead_id', leadIds);

      if (error) throw error;

      // Agrupar por lead_id
      const tagsMap: Record<string, LeadTag[]> = {};
      
      for (const assignment of assignments || []) {
        if (!tagsMap[assignment.lead_id]) {
          tagsMap[assignment.lead_id] = [];
        }
        if (assignment.tags) {
          tagsMap[assignment.lead_id].push(assignment.tags as unknown as LeadTag);
        }
      }

      setData(tagsMap);
    } catch (error) {
      console.error('Error fetching lead tags:', error);
    } finally {
      setLoading(false);
    }
  }, [leadIds.join(',')]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { data, loading, refetch: fetchTags };
}
