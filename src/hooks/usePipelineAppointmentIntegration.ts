import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentData {
  id?: string;
  lead_id: string;
  start_at: string;
  end_at: string;
  etapa_origem_id?: string;
  tipo_sessao?: string;
  closer_responsavel?: string;
  observacao?: string;
  status?: 'Agendado' | 'Realizado' | 'Cancelado' | 'Remarcado' | 'No-Show';
}

interface PipelineStageAppointmentConfig {
  tipo_agendamento?: 'Descoberta' | 'Apresentacao' | 'Fechamento' | 'Follow-up';
  closer_padrao?: string;
  horarios_preferenciais?: {
    dias_semana: number[];
    horarios: string[];
  };
  template_agendamento?: {
    titulo: string;
    descricao: string;
  };
}

export function usePipelineAppointmentIntegration() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Cria agendamento automático baseado na etapa do pipeline
  const createAutomaticAppointment = useCallback(async (
    leadId: string,
    stageId: string,
    stageConfig: PipelineStageAppointmentConfig
  ): Promise<AppointmentData | null> => {
    if (!user) return null;

    try {
      setLoading(true);

      // Buscar informações do lead
      const { data: lead } = await supabase
        .from('leads')
        .select('nome, closer')
        .eq('id', leadId)
        .single();

      if (!lead) {
        toast({
          title: "Erro",
          description: "Lead não encontrado",
          variant: "destructive"
        });
        return null;
      }

      // Calcular horário sugerido baseado nas preferências da etapa
      const suggestedTime = calculateSuggestedTime(stageConfig.horarios_preferenciais);
      
      // Determinar closer responsável
      const closerResponsavel = stageConfig.closer_padrao || lead.closer || 'Não definido';

      // Criar título contextual
      const titulo = stageConfig.template_agendamento?.titulo || 
        `Sessão de ${stageConfig.tipo_agendamento} - ${lead.nome}`;

      const appointmentData: AppointmentData = {
        lead_id: leadId,
        start_at: suggestedTime.start,
        end_at: suggestedTime.end,
        etapa_origem_id: stageId,
        tipo_sessao: stageConfig.tipo_agendamento,
        closer_responsavel: closerResponsavel,
        observacao: stageConfig.template_agendamento?.descricao || 
          `Agendamento automático para etapa de ${stageConfig.tipo_agendamento}`,
        status: 'Agendado'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento automático:', error);
        toast({
          title: "Erro ao criar agendamento",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Agendamento criado automaticamente",
        description: `${titulo} foi agendado para ${new Date(suggestedTime.start).toLocaleString()}`
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar agendamento automático:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Buscar próximo agendamento de um lead
  const getNextAppointmentForLead = useCallback(async (leadId: string) => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'Agendado')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1);

      return data?.[0] || null;
    } catch (error) {
      console.error('Erro ao buscar próximo agendamento:', error);
      return null;
    }
  }, []);

  // Buscar agendamentos por etapa
  const getAppointmentsByStage = useCallback(async (stageId: string) => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          leads (nome, whatsapp)
        `)
        .eq('etapa_origem_id', stageId)
        .order('start_at', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar agendamentos por etapa:', error);
      return [];
    }
  }, []);

  // Atualizar configuração de agendamento da etapa
  const updateStageAppointmentConfig = useCallback(async (
    stageId: string,
    config: PipelineStageAppointmentConfig
  ) => {
    try {
      const { error } = await supabase
        .from('pipeline_stages')
        .update({
          tipo_agendamento: config.tipo_agendamento,
          closer_padrao: config.closer_padrao,
          horarios_preferenciais: config.horarios_preferenciais,
          template_agendamento: config.template_agendamento,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) {
        console.error('Erro ao atualizar configuração de agendamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar configuração de agendamento",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Configuração atualizada",
        description: "Configuração de agendamento da etapa foi atualizada"
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return false;
    }
  }, [toast]);

  return {
    loading,
    createAutomaticAppointment,
    getNextAppointmentForLead,
    getAppointmentsByStage,
    updateStageAppointmentConfig
  };
}

// Função auxiliar para calcular horário sugerido
function calculateSuggestedTime(preferencias?: { dias_semana: number[]; horarios: string[] }) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Se não há preferências, agendar para amanhã às 14h
  if (!preferencias || !preferencias.horarios.length) {
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(15, 0, 0, 0);
    
    return {
      start: tomorrow.toISOString(),
      end: end.toISOString()
    };
  }

  // Encontrar próximo dia preferencial
  let suggestedDate = new Date(tomorrow);
  const preferredDays = preferencias.dias_semana || [1, 2, 3, 4, 5]; // Segunda a sexta por padrão
  
  while (!preferredDays.includes(suggestedDate.getDay())) {
    suggestedDate.setDate(suggestedDate.getDate() + 1);
  }

  // Usar primeiro horário preferencial
  const firstPreferredTime = preferencias.horarios[0] || '14:00';
  const [hours, minutes] = firstPreferredTime.split(':').map(Number);
  
  suggestedDate.setHours(hours, minutes, 0, 0);
  
  const endTime = new Date(suggestedDate);
  endTime.setHours(endTime.getHours() + 1); // 1 hora de duração padrão

  return {
    start: suggestedDate.toISOString(),
    end: endTime.toISOString()
  };
}