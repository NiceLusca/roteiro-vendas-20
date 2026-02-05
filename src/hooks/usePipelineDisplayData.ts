import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PipelineDisplayConfig, DealDisplayInfo, AppointmentDisplayInfo } from '@/types/pipelineDisplay';

interface UsePipelineDisplayDataProps {
  pipelineId: string | undefined;
  leadIds: string[];
  displayConfig?: PipelineDisplayConfig | null;
}

export function usePipelineDisplayData({
  pipelineId,
  leadIds,
  displayConfig
}: UsePipelineDisplayDataProps) {
  const shouldLoadDeals = displayConfig?.show_deals && leadIds.length > 0;
  const shouldLoadAppointments = displayConfig?.show_appointments && leadIds.length > 0;

  // Fetch deals for leads (only if show_deals is true)
  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['pipeline-deals', pipelineId, leadIds.length, leadIds[0], leadIds[leadIds.length - 1]],
    enabled: !!shouldLoadDeals && !!pipelineId,
    staleTime: 30000, // 30 seconds - otimização de cache
    gcTime: 60000, // 1 minuto de cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('id, lead_id, valor_proposto, valor_recorrente, status, motivo_perda, data_fechamento')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        return [];
      }

      return (data || []) as DealDisplayInfo[];
    }
  });

  // Fetch appointments for leads (only if show_appointments is true)
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['pipeline-appointments', pipelineId, leadIds.length, leadIds[0], leadIds[leadIds.length - 1]],
    enabled: !!shouldLoadAppointments && !!pipelineId,
    staleTime: 30000, // 30 seconds - otimização de cache
    gcTime: 60000, // 1 minuto de cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, lead_id, data_hora, start_at, status, titulo')
        .in('lead_id', leadIds)
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return (data || []) as AppointmentDisplayInfo[];
    }
  });

  // Map deals by lead_id (get the most recent one per lead)
  const dealsByLeadId = useMemo(() => {
    const map: Record<string, DealDisplayInfo> = {};
    for (const deal of deals) {
      // Only keep the first (most recent) deal per lead
      if (!map[deal.lead_id]) {
        map[deal.lead_id] = deal;
      }
    }
    return map;
  }, [deals]);

  // Map appointments by lead_id (get the next upcoming one per lead)
  const appointmentsByLeadId = useMemo(() => {
    const map: Record<string, AppointmentDisplayInfo> = {};
    for (const apt of appointments) {
      // Only keep the first (next) appointment per lead
      if (!map[apt.lead_id]) {
        map[apt.lead_id] = apt;
      }
    }
    return map;
  }, [appointments]);

  return {
    dealsByLeadId,
    appointmentsByLeadId,
    loading: loadingDeals || loadingAppointments,
    hasDeals: deals.length > 0,
    hasAppointments: appointments.length > 0,
  };
}
