import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SlaAppointmentInfo {
  id: string;
  lead_id: string;
  data_hora: string;
  start_at?: string;
  titulo?: string;
}

interface UseSlaAppointmentsProps {
  appointmentIds: (string | null | undefined)[];
}

/**
 * Hook para buscar dados dos agendamentos vinculados ao SLA de cada entry
 */
export function useSlaAppointments({ appointmentIds }: UseSlaAppointmentsProps) {
  // Filtrar IDs válidos
  const validIds = useMemo(() => 
    appointmentIds.filter((id): id is string => !!id),
    [appointmentIds]
  );

  const { data: slaAppointments = [], isLoading } = useQuery({
    queryKey: ['sla-appointments', validIds.length, validIds[0], validIds[validIds.length - 1]],
    enabled: validIds.length > 0,
    staleTime: 30000, // 30 seconds
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, lead_id, data_hora, start_at, titulo')
        .in('id', validIds);

      if (error) {
        console.error('Error fetching SLA appointments:', error);
        return [];
      }

      return (data || []) as SlaAppointmentInfo[];
    }
  });

  // Map por ID do agendamento
  const slaAppointmentsById = useMemo(() => {
    const map: Record<string, SlaAppointmentInfo> = {};
    for (const apt of slaAppointments) {
      map[apt.id] = apt;
    }
    return map;
  }, [slaAppointments]);

  return {
    slaAppointmentsById,
    loading: isLoading
  };
}
