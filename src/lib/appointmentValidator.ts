import { supabase } from '@/integrations/supabase/client';
import { PipelineStage } from '@/types/crm';

export interface AppointmentForSLA {
  id: string;
  lead_id: string;
  data_hora: string;
  start_at?: string;
  titulo?: string;
  status?: string;
}

export interface AppointmentValidationResult {
  valid: boolean;
  appointments: AppointmentForSLA[];
  requiresSelection: boolean;
  message?: string;
}

/**
 * Valida se o lead tem agendamentos disponíveis para etapas que requerem agendamento
 */
export async function validateAppointmentRequirement(
  leadId: string,
  targetStage: PipelineStage
): Promise<AppointmentValidationResult> {
  // Se a etapa não requer agendamento, retorna válido
  if (!targetStage.requer_agendamento) {
    return {
      valid: true,
      appointments: [],
      requiresSelection: false
    };
  }

  try {
    // Buscar todos os agendamentos do lead (futuros e passados)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, lead_id, data_hora, start_at, titulo, status')
      .eq('lead_id', leadId)
      .order('data_hora', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return {
        valid: false,
        appointments: [],
        requiresSelection: false,
        message: 'Erro ao verificar agendamentos'
      };
    }

    const appointments = (data || []) as AppointmentForSLA[];

    // Sem agendamentos - bloquear
    if (appointments.length === 0) {
      return {
        valid: false,
        appointments: [],
        requiresSelection: false,
        message: 'É necessário definir um agendamento para mover para esta etapa'
      };
    }

    // 1 agendamento - vincular automaticamente
    if (appointments.length === 1) {
      return {
        valid: true,
        appointments,
        requiresSelection: false
      };
    }

    // Múltiplos agendamentos - solicitar seleção
    return {
      valid: true,
      appointments,
      requiresSelection: true,
      message: 'Selecione qual agendamento usar para o prazo SLA'
    };

  } catch (error) {
    console.error('Erro na validação de agendamento:', error);
    return {
      valid: false,
      appointments: [],
      requiresSelection: false,
      message: 'Erro ao verificar agendamentos'
    };
  }
}

/**
 * Busca um agendamento específico por ID
 */
export async function fetchAppointmentById(appointmentId: string): Promise<AppointmentForSLA | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, lead_id, data_hora, start_at, titulo, status')
      .eq('id', appointmentId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AppointmentForSLA;
  } catch {
    return null;
  }
}
