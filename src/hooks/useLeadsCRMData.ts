import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';

interface UseLeadsCRMDataOptions {
  leadIds: string[];
  enabled: boolean;
}

export interface CloserDealBreakdown {
  closerName: string;
  totalValue: number;
  dealCount: number;
}

export interface LeadDealsSummary {
  totalValue: number;
  dealCount: number;
  hasRecorrente: boolean;
  closerBreakdown: CloserDealBreakdown[];
}

export interface LeadAppointmentsSummary {
  nextAppointment: string | null;
  lastAppointment: string | null;
}

export interface LeadPipelineInfo {
  pipelineName: string;
  stageName: string;
}

export function useLeadsCRMData({ leadIds, enabled }: UseLeadsCRMDataOptions) {
  const { user } = useAuth();

  // Fetch deals summary per lead
  const { data: dealsMap } = useQuery({
    queryKey: ['crm-deals', leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return {};
      
      const { data } = await supabase
        .from('deals')
        .select('lead_id, valor_proposto, status, recorrente, closer_id, profiles:closer_id(nome, full_name)')
        .in('lead_id', leadIds);

      const map: Record<string, LeadDealsSummary> = {};
      data?.forEach((deal: any) => {
        if (!map[deal.lead_id]) {
          map[deal.lead_id] = { totalValue: 0, dealCount: 0, hasRecorrente: false, closerBreakdown: [] };
        }
        if (deal.status === 'ganho') {
          const value = Number(deal.valor_proposto) || 0;
          map[deal.lead_id].totalValue += value;
          map[deal.lead_id].dealCount += 1;

          // Track per-closer breakdown
          const closerName = deal.profiles?.nome || deal.profiles?.full_name || 'Não atribuído';
          const existing = map[deal.lead_id].closerBreakdown.find(c => c.closerName === closerName);
          if (existing) {
            existing.totalValue += value;
            existing.dealCount += 1;
          } else {
            map[deal.lead_id].closerBreakdown.push({ closerName, totalValue: value, dealCount: 1 });
          }
        }
        if (deal.recorrente) {
          map[deal.lead_id].hasRecorrente = true;
        }
      });
      return map;
    },
    enabled: enabled && leadIds.length > 0 && !!user,
    staleTime: 30000,
  });

  // Fetch resolved closer per lead via hierarchy:
  // deals.closer_id (most recent) → lead_responsibles.is_primary → null (caller falls back to leads.closer)
  const { data: resolvedCloserMap } = useQuery({
    queryKey: ['crm-resolved-closer', leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return {};

      const map: Record<string, string> = {};

      // 1) Deals — most recent first; first non-empty closer wins per lead
      const { data: dealsData } = await supabase
        .from('deals')
        .select('lead_id, created_at, profiles:closer_id(nome, full_name)')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      dealsData?.forEach((d: any) => {
        const name = d.profiles?.nome || d.profiles?.full_name;
        if (name && !map[d.lead_id]) {
          map[d.lead_id] = name;
        }
      });

      // 2) Primary responsibles — only fill if not already resolved by deals
      const unresolvedIds = leadIds.filter(id => !map[id]);
      if (unresolvedIds.length > 0) {
        const { data: respData } = await supabase
          .from('lead_responsibles')
          .select('lead_id, is_primary, profiles:user_id(nome, full_name)')
          .in('lead_id', unresolvedIds)
          .eq('is_primary', true);

        respData?.forEach((r: any) => {
          const name = r.profiles?.nome || r.profiles?.full_name;
          if (name && !map[r.lead_id]) {
            map[r.lead_id] = name;
          }
        });
      }

      return map;
    },
    enabled: enabled && leadIds.length > 0 && !!user,
    staleTime: 30000,
  });

  // Fetch appointments summary per lead
  const { data: appointmentsMap } = useQuery({
    queryKey: ['crm-appointments', leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return {};
      
      const now = new Date().toISOString();
      
      // Next future appointments
      const { data: futureData } = await supabase
        .from('appointments')
        .select('lead_id, data_hora')
        .in('lead_id', leadIds)
        .gte('data_hora', now)
        .in('status', ['agendado', 'confirmado'])
        .order('data_hora', { ascending: true });

      // Last realized appointments
      const { data: pastData } = await supabase
        .from('appointments')
        .select('lead_id, data_hora')
        .in('lead_id', leadIds)
        .eq('status', 'realizado')
        .order('data_hora', { ascending: false });

      const map: Record<string, LeadAppointmentsSummary> = {};
      
      // Set next appointment (first future per lead)
      futureData?.forEach(apt => {
        if (!map[apt.lead_id]) {
          map[apt.lead_id] = { nextAppointment: null, lastAppointment: null };
        }
        if (!map[apt.lead_id].nextAppointment) {
          map[apt.lead_id].nextAppointment = apt.data_hora;
        }
      });

      // Set last appointment (first past per lead)
      pastData?.forEach(apt => {
        if (!map[apt.lead_id]) {
          map[apt.lead_id] = { nextAppointment: null, lastAppointment: null };
        }
        if (!map[apt.lead_id].lastAppointment) {
          map[apt.lead_id].lastAppointment = apt.data_hora;
        }
      });

      return map;
    },
    enabled: enabled && leadIds.length > 0 && !!user,
    staleTime: 30000,
  });

  // Fetch pipeline entries with pipeline and stage names
  const { data: pipelinesMap } = useQuery({
    queryKey: ['crm-pipelines', leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return {};
      
      const { data } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          lead_id,
          status_inscricao,
          pipelines:pipeline_id (nome),
          pipeline_stages:etapa_atual_id (nome)
        `)
        .in('lead_id', leadIds)
        .eq('status_inscricao', 'Ativo');

      const map: Record<string, LeadPipelineInfo[]> = {};
      data?.forEach((entry: any) => {
        if (!map[entry.lead_id]) {
          map[entry.lead_id] = [];
        }
        map[entry.lead_id].push({
          pipelineName: entry.pipelines?.nome || '?',
          stageName: entry.pipeline_stages?.nome || '?',
        });
      });
      return map;
    },
    enabled: enabled && leadIds.length > 0 && !!user,
    staleTime: 30000,
  });

  return {
    dealsMap: dealsMap || {},
    appointmentsMap: appointmentsMap || {},
    pipelinesMap: pipelinesMap || {},
    resolvedCloserMap: resolvedCloserMap || {},
  };
}
