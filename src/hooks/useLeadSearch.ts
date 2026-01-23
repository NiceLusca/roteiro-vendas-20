import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContextSecure';

interface UseLeadSearchOptions {
  searchTerm?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook otimizado para busca de leads com autocomplete
 * Ideal para selects e campos de busca que precisam filtrar leads
 */
export function useLeadSearch({ searchTerm = '', limit = 50, enabled = true }: UseLeadSearchOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads-search', searchTerm, limit],
    queryFn: async (): Promise<Lead[]> => {
      let query = supabase
        .from('leads')
        .select(`
          id,
          nome,
          email,
          whatsapp,
          origem,
          segmento,
          closer,
          lead_score,
          lead_score_classification,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (searchTerm.trim()) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(lead => ({
        ...lead,
        created_at: new Date(lead.created_at),
        updated_at: new Date(lead.updated_at)
      })) as Lead[];
    },
    enabled: !!user && enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
