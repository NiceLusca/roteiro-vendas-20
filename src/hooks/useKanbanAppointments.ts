import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';

interface AppointmentInfo {
  id: string;
  lead_id: string;
  start_at: string;
  status: string;
}

export function useKanbanAppointments() {
  const [appointments, setAppointments] = useState<Record<string, AppointmentInfo>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNextAppointments = useCallback(async (leadIds: string[]) => {
    if (!user || leadIds.length === 0) return;

    try {
      setLoading(true);
      
      // Buscar próximos agendamentos para os leads
      const { data } = await supabase
        .from('appointments')
        .select('id, lead_id, start_at, status')
        .in('lead_id', leadIds)
        .eq('status', 'agendado')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true });

      if (data) {
        // Criar mapa com o próximo agendamento de cada lead
        const appointmentMap: Record<string, AppointmentInfo> = {};
        
        data.forEach(appointment => {
          // Só manter o primeiro (mais próximo) agendamento de cada lead
          if (!appointmentMap[appointment.lead_id]) {
            appointmentMap[appointment.lead_id] = appointment;
          }
        });

        setAppointments(appointmentMap);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getNextAppointmentForLead = useCallback((leadId: string): AppointmentInfo | null => {
    return appointments[leadId] || null;
  }, [appointments]);

  const refreshAppointments = useCallback((leadIds: string[]) => {
    fetchNextAppointments(leadIds);
  }, [fetchNextAppointments]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          // Quando há mudanças, precisamos saber quais leads atualizar
          // Por simplicidade, vamos limpar o cache e deixar o componente pai requisitar novamente
          setAppointments({});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    loading,
    fetchNextAppointments,
    getNextAppointmentForLead,
    refreshAppointments
  };
}
