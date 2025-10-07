import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'stage_change' | 'time_elapsed' | 'field_change' | 'lead_score' | 'inactivity';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'move_stage' | 'create_appointment' | 'send_notification' | 'update_field' | 'assign_user';
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
  priority: number;
}

interface AutomationExecution {
  ruleId: string;
  leadId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: Date;
}

export function useAutomationEngine() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadRules = useCallback(async () => {
    try {
      // Load automation rules from database or local storage
      const storedRules = localStorage.getItem('automation_rules');
      if (storedRules) {
        setRules(JSON.parse(storedRules));
      }
    } catch (error) {
      console.error('Error loading automation rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRules = useCallback(async (newRules: AutomationRule[]) => {
    try {
      localStorage.setItem('automation_rules', JSON.stringify(newRules));
      setRules(newRules);
    } catch (error) {
      console.error('Error saving automation rules:', error);
    }
  }, []);

  const createRule = useCallback(async (rule: Omit<AutomationRule, 'id'>) => {
    const newRule: AutomationRule = {
      ...rule,
      id: crypto.randomUUID()
    };
    
    const updatedRules = [...rules, newRule];
    await saveRules(updatedRules);
    
    toast({
      title: "Regra de Automação Criada",
      description: `Regra "${rule.name}" foi criada com sucesso.`,
    });
    
    return newRule;
  }, [rules, saveRules, toast]);

  const updateRule = useCallback(async (ruleId: string, updates: Partial<AutomationRule>) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    await saveRules(updatedRules);
    
    toast({
      title: "Regra Atualizada",
      description: "Regra de automação foi atualizada com sucesso.",
    });
  }, [rules, saveRules, toast]);

  const deleteRule = useCallback(async (ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    await saveRules(updatedRules);
    
    toast({
      title: "Regra Removida",
      description: "Regra de automação foi removida com sucesso.",
    });
  }, [rules, saveRules, toast]);

  const executeRule = useCallback(async (rule: AutomationRule, leadId: string, context: Record<string, any> = {}) => {
    const execution: AutomationExecution = {
      ruleId: rule.id,
      leadId,
      status: 'executing',
      timestamp: new Date()
    };

    setExecutions(prev => [...prev, execution]);

    try {
      // Execute each action in the rule
      for (const action of rule.actions) {
        switch (action.type) {
          case 'move_stage':
            // Move lead to different stage
            await supabase
              .from('lead_pipeline_entries')
              .update({ 
                etapa_atual_id: action.parameters.stageId,
                data_entrada_etapa: new Date().toISOString()
              })
              .eq('lead_id', leadId);
            break;

          case 'create_appointment':
            // Create new appointment
            const startTime = new Date(action.parameters.dateTime);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            await supabase
              .from('appointments')
              .insert([{
                lead_id: leadId,
                data_hora: startTime.toISOString(),
                start_at: startTime.toISOString(),
                end_at: endTime.toISOString(),
                titulo: `Agendamento automático - ${rule.name}`,
                duracao_minutos: 60,
                status: 'agendado',
                notas: `Agendamento automático via regra: ${rule.name}`
              }]);
            break;

          case 'update_field':
            // Update lead field
            await supabase
              .from('leads')
              .update({ [action.parameters.field]: action.parameters.value })
              .eq('id', leadId);
            break;

          case 'send_notification':
            // Send notification (would integrate with notification system)
            if (process.env.NODE_ENV === 'development') {
              console.log(`Sending notification: ${action.parameters.message}`);
            }
            break;
        }
      }

      // Update execution status
      setExecutions(prev => prev.map(e => 
        e.ruleId === rule.id && e.leadId === leadId 
          ? { ...e, status: 'completed' as const }
          : e
      ));

      toast({
        title: "Automação Executada",
        description: `Regra "${rule.name}" foi executada com sucesso.`,
      });

    } catch (error) {
      console.error('Error executing automation rule:', error);
      
      setExecutions(prev => prev.map(e => 
        e.ruleId === rule.id && e.leadId === leadId 
          ? { 
              ...e, 
              status: 'failed' as const, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : e
      ));
      
      toast({
        title: "Erro na Automação",
        description: `Falha ao executar regra "${rule.name}".`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const checkTriggers = useCallback(async (leadId: string, triggerType: AutomationRule['trigger']['type'], context: Record<string, any>) => {
    const applicableRules = rules.filter(rule => 
      rule.enabled && 
      rule.trigger.type === triggerType
    );

    for (const rule of applicableRules) {
      // Check if trigger conditions are met
      const conditionsMet = evaluateTriggerConditions(rule.trigger.conditions, context);
      
      if (conditionsMet) {
        await executeRule(rule, leadId, context);
      }
    }
  }, [rules, executeRule]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return {
    rules,
    executions,
    loading,
    createRule,
    updateRule,
    deleteRule,
    executeRule,
    checkTriggers
  };
}

function evaluateTriggerConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
  // Simple condition evaluation - can be enhanced
  return Object.entries(conditions).every(([key, expectedValue]) => {
    const actualValue = context[key];
    
    if (typeof expectedValue === 'object' && expectedValue.operator) {
      switch (expectedValue.operator) {
        case 'equals':
          return actualValue === expectedValue.value;
        case 'greater_than':
          return actualValue > expectedValue.value;
        case 'less_than':
          return actualValue < expectedValue.value;
        case 'contains':
          return String(actualValue).includes(expectedValue.value);
        default:
          return actualValue === expectedValue.value;
      }
    }
    
    return actualValue === expectedValue;
  });
}