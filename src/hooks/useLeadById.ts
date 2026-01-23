import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContextSecure';

/**
 * Hook otimizado para buscar um único lead por ID
 * Use este hook em vez de useSupabaseLeads quando precisar de apenas um lead
 */
export function useLeadById(leadId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async (): Promise<Lead | null> => {
      if (!leadId) return null;

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          email,
          whatsapp,
          origem,
          segmento,
          status_geral,
          lead_score,
          lead_score_classification,
          closer,
          desejo_na_sessao,
          objecao_principal,
          ja_vendeu_no_digital,
          seguidores,
          faturamento_medio,
          meta_faturamento,
          resultado_sessao_ultimo,
          objecao_obs,
          observacoes,
          resultado_obs_ultima_sessao,
          valor_lead,
          user_id,
          created_at,
          updated_at
        `)
        .eq('id', leadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      } as Lead;
    },
    enabled: !!user && !!leadId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
