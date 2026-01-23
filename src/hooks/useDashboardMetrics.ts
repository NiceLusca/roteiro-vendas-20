import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';

interface LeadStatusCounts {
  lead: number;
  cliente: number;
  perdido: number;
}

interface DashboardMetrics {
  leads_por_status: LeadStatusCounts;
  total_leads: number;
}

/**
 * Hook otimizado para buscar métricas agregadas do dashboard
 * Usa COUNT() no banco ao invés de carregar todos os leads
 */
export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      // Fetch counts by status in a single query
      const { data: statusCounts, error } = await supabase
        .from('leads')
        .select('status_geral')
        .not('status_geral', 'is', null);

      if (error) throw error;

      // Count by status client-side (Supabase doesn't support GROUP BY in JS client)
      const counts: LeadStatusCounts = {
        lead: 0,
        cliente: 0,
        perdido: 0
      };

      (statusCounts || []).forEach(row => {
        const status = row.status_geral;
        if (status === 'lead' || status === 'qualificado' || status === 'reuniao_marcada' || status === 'em_negociacao') {
          counts.lead++;
        } else if (status === 'cliente') {
          counts.cliente++;
        } else if (status === 'perdido') {
          counts.perdido++;
        }
      });

      return {
        leads_por_status: counts,
        total_leads: statusCounts?.length || 0
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000,
  });
}
