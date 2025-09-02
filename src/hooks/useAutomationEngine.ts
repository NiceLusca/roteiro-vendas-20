import { useState, useCallback, useEffect } from 'react';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'sla_violation' | 'stage_duration' | 'checklist_complete' | 'appointment_result';
  conditions: Record<string, any>;
  actions: AutomationAction[];
  active: boolean;
  pipelineId?: string;
  stageId?: string;
}

interface AutomationAction {
  type: 'advance_stage' | 'create_appointment' | 'send_notification' | 'update_health' | 'transfer_pipeline';
  parameters: Record<string, any>;
}

interface AutomationResult {
  success: boolean;
  actions: string[];
  errors: string[];
}

export function useAutomationEngine(pipelineId?: string) {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);

  const { entries, updateEntry, updateHealthStatus } = useSupabaseLeadPipelineEntries(pipelineId);
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { saveAppointment } = useSupabaseAppointments();
  const { logChange } = useAudit();
  const { toast } = useToast();
  const { user } = useAuth();

  // Default automation rules
  useEffect(() => {
    const defaultRules: AutomationRule[] = [
      {
        id: 'sla-health-update',
        name: 'Atualizar Saúde por SLA',
        trigger: 'sla_violation',
        conditions: { days_overdue: 0 },
        actions: [
          { type: 'update_health', parameters: { health: 'auto' } }
        ],
        active: true
      },
      {
        id: 'auto-appointment-creation',
        name: 'Criar Agendamento Automático',
        trigger: 'stage_duration',
        conditions: { auto_appointment: true },
        actions: [
          { type: 'create_appointment', parameters: { type: 'auto' } }
        ],
        active: true
      },
      {
        id: 'stage-advance-complete',
        name: 'Avançar por Checklist Completo',
        trigger: 'checklist_complete',
        conditions: { required_complete: true },
        actions: [
          { type: 'advance_stage', parameters: { auto: true } }
        ],
        active: false // Disabled by default - requires user configuration
      }
    ];

    setAutomationRules(defaultRules);
  }, []);

  const executeAction = useCallback(async (
    action: AutomationAction,
    entry: any,
    stage: any
  ): Promise<{ success: boolean; message: string }> => {
    
    try {
      switch (action.type) {
        case 'update_health':
          const newHealth = action.parameters.health === 'auto' 
            ? calculateAutoHealth(entry, stage)
            : action.parameters.health;
          
          await updateHealthStatus(entry.id, newHealth);
          return { success: true, message: `Saúde atualizada para ${newHealth}` };

        case 'create_appointment':
          if (stage.gerar_agendamento_auto) {
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 1);
            appointmentDate.setHours(14, 0, 0, 0);

            const endDate = new Date(appointmentDate);
            endDate.setMinutes(appointmentDate.getMinutes() + (stage.duracao_minutos || 60));

            await saveAppointment({
              lead_id: entry.lead_id,
              start_at: appointmentDate.toISOString(),
              end_at: endDate.toISOString(),
              status: 'Agendado',
              origem: 'Plataforma',
              observacao: `Agendamento automático - ${stage.nome}`,
              criado_por: 'Sistema (Automação)'
            });

            return { success: true, message: 'Agendamento criado automaticamente' };
          }
          return { success: false, message: 'Etapa não configurada para agendamento automático' };

        case 'advance_stage':
          const nextStage = getNextStage(stage.id, entry.pipeline_id);
          if (nextStage && canAutoAdvance(entry, stage)) {
            await updateEntry(entry.id, {
              etapa_atual_id: nextStage.id,
              data_entrada_etapa: new Date().toISOString(),
              tempo_em_etapa_dias: 0,
              dias_em_atraso: 0,
              nota_etapa: 'Avançado automaticamente pelo sistema'
            });

            logChange({
              entidade: 'LeadPipelineEntry',
              entidade_id: entry.id,
              alteracao: [
                { campo: 'etapa_atual_id', de: stage.id, para: nextStage.id },
                { campo: 'advancement_type', de: '', para: 'automatic' }
              ],
              ator: 'Sistema (Automação)'
            });

            return { success: true, message: `Lead avançado para ${nextStage.nome}` };
          }
          return { success: false, message: 'Não é possível avançar automaticamente' };

        case 'send_notification':
          toast({
            title: action.parameters.title || 'Notificação de Automação',
            description: action.parameters.message || 'Ação automática executada',
            variant: action.parameters.variant || 'default'
          });
          return { success: true, message: 'Notificação enviada' };

        default:
          return { success: false, message: 'Ação não implementada' };
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      return { success: false, message: `Erro: ${error}` };
    }
  }, [updateHealthStatus, saveAppointment, updateEntry, logChange, toast]);

  const calculateAutoHealth = (entry: any, stage: any): 'Verde' | 'Amarelo' | 'Vermelho' => {
    if (entry.dias_em_atraso > 0) return 'Vermelho';
    
    const warningThreshold = Math.floor(stage.prazo_em_dias * 0.8);
    if (entry.tempo_em_etapa_dias >= warningThreshold) return 'Amarelo';
    
    return 'Verde';
  };

  const getNextStage = (currentStageId: string, pipelineId: string) => {
    const pipelineStages = stages
      .filter(s => s.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem);
    
    const currentIndex = pipelineStages.findIndex(s => s.id === currentStageId);
    return currentIndex !== -1 && currentIndex < pipelineStages.length - 1 
      ? pipelineStages[currentIndex + 1] 
      : null;
  };

  const canAutoAdvance = (entry: any, stage: any): boolean => {
    // Check if all required checklist items are completed
    const checklistState = entry.checklist_state || {};
    // This would need integration with checklist items
    // For now, return false to prevent auto-advancement
    return false;
  };

  const processAutomationRules = useCallback(async (): Promise<AutomationResult> => {
    if (isProcessing || !user) {
      return { success: false, actions: [], errors: ['Processamento já em andamento'] };
    }

    setIsProcessing(true);
    const results: string[] = [];
    const errors: string[] = [];

    try {
      const activeRules = automationRules.filter(rule => rule.active);
      
      for (const rule of activeRules) {
        const applicableEntries = entries.filter(entry => {
          if (rule.pipelineId && entry.pipeline_id !== rule.pipelineId) return false;
          if (rule.stageId && entry.etapa_atual_id !== rule.stageId) return false;
          return entry.status_inscricao === 'Ativo';
        });

        for (const entry of applicableEntries) {
          const stage = stages.find(s => s.id === entry.etapa_atual_id);
          if (!stage) continue;

          let shouldTrigger = false;

          switch (rule.trigger) {
            case 'sla_violation':
              shouldTrigger = entry.dias_em_atraso > (rule.conditions.days_overdue || 0);
              break;
            
            case 'stage_duration':
              shouldTrigger = entry.tempo_em_etapa_dias >= (stage.prazo_em_dias - 1);
              break;
            
            case 'checklist_complete':
              // This would need checklist validation
              shouldTrigger = false;
              break;
          }

          if (shouldTrigger) {
            for (const action of rule.actions) {
              const result = await executeAction(action, entry, stage);
              if (result.success) {
                results.push(`${rule.name}: ${result.message}`);
              } else {
                errors.push(`${rule.name}: ${result.message}`);
              }
            }
          }
        }
      }

      setLastProcessed(new Date());
      
      if (results.length > 0) {
        toast({
          title: 'Automações Executadas',
          description: `${results.length} ação(ões) automática(s) executadas`,
          variant: 'default'
        });
      }

    } catch (error) {
      console.error('Erro no processamento de automações:', error);
      errors.push('Erro interno no processamento');
    } finally {
      setIsProcessing(false);
    }

    return { success: errors.length === 0, actions: results, errors };
  }, [isProcessing, user, automationRules, entries, stages, executeAction, toast]);

  const addAutomationRule = useCallback((rule: Omit<AutomationRule, 'id'>) => {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setAutomationRules(prev => [...prev, newRule]);
  }, []);

  const updateAutomationRule = useCallback((ruleId: string, updates: Partial<AutomationRule>) => {
    setAutomationRules(prev => 
      prev.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule)
    );
  }, []);

  const deleteAutomationRule = useCallback((ruleId: string) => {
    setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const getAutomationStats = useCallback(() => {
    const totalRules = automationRules.length;
    const activeRules = automationRules.filter(rule => rule.active).length;
    const eligibleEntries = entries.filter(entry => entry.status_inscricao === 'Ativo').length;
    
    return {
      totalRules,
      activeRules,
      eligibleEntries,
      lastProcessed,
      isProcessing
    };
  }, [automationRules, entries, lastProcessed, isProcessing]);

  // Auto-process every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (automationRules.some(rule => rule.active)) {
        processAutomationRules();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [processAutomationRules, automationRules]);

  return {
    automationRules,
    isProcessing,
    lastProcessed,
    processAutomationRules,
    addAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    getAutomationStats
  };
}