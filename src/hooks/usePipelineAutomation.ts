import { useState, useCallback } from 'react';
import { PipelineStage, LeadPipelineEntry, Appointment } from '@/types/crm';
import { mockPipelineStages } from '@/data/mockData';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook for managing pipeline automations
export function usePipelineAutomation() {
  const { logChange } = useAudit();
  const { toast } = useToast();

  const shouldAutoGenerateAppointment = useCallback((stage: PipelineStage): boolean => {
    return stage.gerar_agendamento_auto === true;
  }, []);

  const generateAutoAppointment = useCallback((
    entry: LeadPipelineEntry, 
    stage: PipelineStage
  ): Omit<Appointment, 'id' | 'created_at' | 'updated_at'> | null => {
    
    if (!shouldAutoGenerateAppointment(stage)) {
      return null;
    }

    // Calculate appointment date/time
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Next day
    appointmentDate.setHours(14, 0, 0, 0); // 2 PM default

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(appointmentDate.getMinutes() + (stage.duracao_minutos || 60));

    const appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> = {
      lead_id: entry.lead_id,
      start_at: appointmentDate,
      end_at: endDate,
      status: 'Agendado',
      origem: 'Plataforma',
      observacao: `Agendamento automático gerado pela etapa: ${stage.nome}`,
      criado_por: 'Sistema (Automação)'
    };

    logChange({
      entidade: 'Appointment',
      entidade_id: `auto-apt-${Date.now()}`,
      alteracao: [
        { campo: 'created_by_automation', de: '', para: 'true' },
        { campo: 'stage_id', de: '', para: stage.id }
      ],
      ator: 'Sistema (Automação)'
    });

    return appointment;
  }, [logChange]);

  const getNextStage = useCallback((currentStageId: string, pipelineId: string): PipelineStage | null => {
    const pipelineStages = mockPipelineStages
      .filter(s => s.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem);
    
    const currentStageIndex = pipelineStages.findIndex(s => s.id === currentStageId);
    
    if (currentStageIndex === -1 || currentStageIndex === pipelineStages.length - 1) {
      return null; // No next stage
    }

    return pipelineStages[currentStageIndex + 1];
  }, []);

  const processStageAdvancement = useCallback((
    entry: LeadPipelineEntry,
    targetStageId: string
  ): {
    shouldGenerateAppointment: boolean;
    appointment?: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;
    nextActions: string[];
  } => {
    
    const targetStage = mockPipelineStages.find(s => s.id === targetStageId);
    
    if (!targetStage) {
      return { shouldGenerateAppointment: false, nextActions: [] };
    }

    const nextActions: string[] = [];
    let appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> | undefined;

    // Check if should generate appointment
    if (shouldAutoGenerateAppointment(targetStage)) {
      appointment = generateAutoAppointment(entry, targetStage);
      if (appointment) {
        nextActions.push(`Agendamento automático criado para ${targetStage.nome}`);
      }
    }

    // Add next step suggestion
    if (targetStage.proximo_passo_label) {
      nextActions.push(`Próximo passo: ${targetStage.proximo_passo_label}`);
    }

    // Add SLA warning
    if (targetStage.prazo_em_dias) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + targetStage.prazo_em_dias);
      nextActions.push(`SLA: ${targetStage.prazo_em_dias} dias (até ${deadline.toLocaleDateString('pt-BR')})`);
    }

    return {
      shouldGenerateAppointment: !!appointment,
      appointment,
      nextActions
    };
  }, [shouldAutoGenerateAppointment, generateAutoAppointment]);

  const handleSessionResult = useCallback((
    sessionResult: 'Avançar' | 'Recuperar' | 'Upsell' | 'Desqualificar',
    entry: LeadPipelineEntry
  ): { 
    recommendedAction: string;
    targetPipeline?: string;
    targetStage?: string;
  } => {
    
    switch (sessionResult) {
      case 'Avançar':
        const nextStage = getNextStage(entry.etapa_atual_id, entry.pipeline_id);
        return {
          recommendedAction: nextStage 
            ? `Avançar para: ${nextStage.nome}`
            : 'Lead está na última etapa do pipeline',
          targetStage: nextStage?.id
        };

      case 'Recuperar':
        return {
          recommendedAction: 'Transferir para pipeline de Recuperação',
          targetPipeline: 'pipeline-recuperacao',
          targetStage: 'stage-r1'
        };

      case 'Upsell':
        return {
          recommendedAction: 'Inscrever em pipeline de Upsell',
          targetPipeline: 'pipeline-upsell', 
          targetStage: 'stage-u1'
        };

      case 'Desqualificar':
        return {
          recommendedAction: 'Arquivar lead do pipeline atual'
        };

      default:
        return {
          recommendedAction: 'Nenhuma ação automática disponível'
        };
    }
  }, [getNextStage]);

  const checkSLAViolations = useCallback((entries: LeadPipelineEntry[]): {
    violations: Array<LeadPipelineEntry & { stage: PipelineStage; daysOverdue: number }>;
    warnings: Array<LeadPipelineEntry & { stage: PipelineStage; daysUntilDue: number }>;
  } => {
    
    const violations: Array<LeadPipelineEntry & { stage: PipelineStage; daysOverdue: number }> = [];
    const warnings: Array<LeadPipelineEntry & { stage: PipelineStage; daysUntilDue: number }> = [];

    entries.forEach(entry => {
      if (entry.dias_em_atraso > 0) {
        const stage = mockPipelineStages.find(s => s.id === entry.etapa_atual_id);
        if (stage) {
          violations.push({
            ...entry,
            stage,
            daysOverdue: entry.dias_em_atraso
          });
        }
      } else if (entry.tempo_em_etapa_dias >= 1) {
        const stage = mockPipelineStages.find(s => s.id === entry.etapa_atual_id);
        if (stage && stage.prazo_em_dias) {
          const daysUntilDue = stage.prazo_em_dias - entry.tempo_em_etapa_dias;
          if (daysUntilDue <= 1 && daysUntilDue > 0) {
            warnings.push({
              ...entry,
              stage,
              daysUntilDue
            });
          }
        }
      }
    });

    return { violations, warnings };
  }, []);

  return {
    shouldAutoGenerateAppointment,
    generateAutoAppointment,
    getNextStage,
    processStageAdvancement,
    handleSessionResult,
    checkSLAViolations
  };
}