import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

import { Appointment, StatusAppointment } from '@/types/crm';

export function useSupabaseAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          lead_id,
          titulo,
          data_hora,
          start_at,
          end_at,
          duracao_minutos,
          status,
          resultado_sessao,
          notas,
          created_at,
          updated_at
        `)
        .order('start_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro ao carregar agendamentos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setAppointments((data || []).map(apt => ({
        ...apt,
        data_hora: new Date(apt.data_hora),
        start_at: apt.start_at ? new Date(apt.start_at) : undefined,
        end_at: apt.end_at ? new Date(apt.end_at) : undefined,
        created_at: apt.created_at ? new Date(apt.created_at) : undefined,
        updated_at: apt.updated_at ? new Date(apt.updated_at) : undefined,
        status: (apt.status.charAt(0).toUpperCase() + apt.status.slice(1)) as StatusAppointment,
        resultado_sessao: apt.resultado_sessao ? (apt.resultado_sessao.charAt(0).toUpperCase() + apt.resultado_sessao.slice(1)) as any : undefined
      })));
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAppointment = async (appointmentData: Partial<Appointment> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!appointmentData.id;
      
      const payload: any = {};
      
      Object.keys(appointmentData).forEach(key => {
        if (key !== 'id' && appointmentData[key as keyof typeof appointmentData] !== undefined) {
          payload[key] = appointmentData[key as keyof typeof appointmentData];
        }
      });
      
      payload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', appointmentData.id!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('appointments')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Erro ao salvar agendamento:', result.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} agendamento`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Agendamento ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Agendamento foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      fetchAppointments();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      return null;
    }
  };

  const getAppointmentById = (id: string): Appointment | undefined => {
    return appointments.find(appointment => appointment.id === id);
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast({
          title: "Erro ao cancelar agendamento",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso"
      });

      fetchAppointments();
      return data;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return null;
    }
  };

  const getUpcomingAppointments = (hours: number = 48): Appointment[] => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_at);
      return appointmentDate >= now && appointmentDate <= futureTime;
    });
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  return {
    appointments,
    loading,
    saveAppointment,
    cancelAppointment,
    getAppointmentById,
    getUpcomingAppointments,
    refetch: fetchAppointments
  };
}