import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { Appointment } from '@/types/crm';

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
        .select('*')
        .order('data_hora', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro ao carregar agendamentos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAppointment = async (appointmentData: Partial<Appointment> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, ...dataToSave } = appointmentData;
      
      if (id) {
        const { data, error } = await supabase
          .from('appointments')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao atualizar agendamento",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Agendamento atualizado",
          description: "Agendamento foi atualizado com sucesso"
        });

        fetchAppointments();
        return data;
      } else {
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            ...dataToSave,
            status: dataToSave.status || 'agendado'
          })
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao criar agendamento",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Agendamento criado",
          description: "Agendamento foi criado com sucesso"
        });

        fetchAppointments();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      return null;
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao cancelar agendamento",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Agendamento cancelado",
        description: "Agendamento foi cancelado"
      });

      fetchAppointments();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const getAppointmentById = (id: string): Appointment | undefined => {
    return appointments.find(apt => apt.id === id);
  };

  const getUpcomingAppointments = (): Appointment[] => {
    const now = new Date().toISOString();
    return appointments.filter(apt => 
      apt.data_hora >= now && apt.status === 'agendado'
    );
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
