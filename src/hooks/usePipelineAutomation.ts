import { useEffect, useCallback } from 'react';
import { useAutomationEngine } from './useAutomationEngine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PipelineAutomationConfig {
  autoAdvancement: boolean;
  slaEnforcement: boolean;
  leadScoring: boolean;
  inactivityAlerts: boolean;
  stageTimeouts: Record<string, number>; // stage_id -> timeout in days
}

export function usePipelineAutomation(pipelineId: string) {
  const { checkTriggers } = useAutomationEngine();
  const { toast } = useToast();

  const config: PipelineAutomationConfig = {
    autoAdvancement: true,
    slaEnforcement: true,
    leadScoring: true,
    inactivityAlerts: true,
    stageTimeouts: {
      // Default timeouts - would be configurable
      'default': 7
    }
  };

  const monitorStageTimeouts = useCallback(async () => {
    if (!config.slaEnforcement) return;

    try {
      const { data: entries } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads (*),
          pipeline_stages (*)
        `)
        .eq('pipeline_id', pipelineId)
        .eq('status_inscricao', 'Ativo');

      if (!entries) return;

      const now = new Date();
      
      for (const entry of entries) {
        const stageTimeout = config.stageTimeouts[entry.etapa_atual_id] || config.stageTimeouts.default;
        const entryDate = new Date(entry.data_entrada_etapa);
        const daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysInStage > stageTimeout) {
          // Update overdue status
          await supabase
            .from('lead_pipeline_entries')
            .update({
              dias_em_atraso: daysInStage - stageTimeout,
              saude_etapa: daysInStage > stageTimeout * 1.5 ? 'Vermelho' : 'Amarelo'
            })
            .eq('id', entry.id);

          // Trigger automation
          await checkTriggers(entry.lead_id, 'time_elapsed', {
            daysInStage,
            stageTimeout,
            overdueDays: daysInStage - stageTimeout,
            stageId: entry.etapa_atual_id
          });
        }
      }
    } catch (error) {
      console.error('Error monitoring stage timeouts:', error);
    }
  }, [pipelineId, checkTriggers, config]);

  const handleStageAdvancement = useCallback(async (leadId: string, fromStageId: string, toStageId: string) => {
    if (!config.autoAdvancement) return;

    try {
      await checkTriggers(leadId, 'stage_change', {
        fromStageId,
        toStageId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling stage advancement:', error);
    }
  }, [checkTriggers, config]);

  const updateLeadScore = useCallback(async (leadId: string, factors: Record<string, number>) => {
    if (!config.leadScoring) return;

    try {
      // Calculate lead score based on various factors
      const baseScore = 0;
      let score = baseScore;

      // Engagement factors
      if (factors.appointmentsCompleted) {
        score += factors.appointmentsCompleted * 10;
      }
      
      if (factors.daysInPipeline) {
        score += Math.max(0, 20 - factors.daysInPipeline); // Newer leads get higher scores
      }
      
      if (factors.interactionCount) {
        score += factors.interactionCount * 5;
      }

      // Business factors
      if (factors.revenue) {
        score += Math.min(50, factors.revenue / 1000); // Up to 50 points for revenue
      }

      // Update lead score
      const classification = score >= 80 ? 'Alto' : score >= 50 ? 'Médio' : 'Baixo';
      
      await supabase
        .from('leads')
        .update({
          lead_score: Math.round(score),
          lead_score_classification: classification
        })
        .eq('id', leadId);

      // Trigger score-based automation
      await checkTriggers(leadId, 'lead_score', {
        score: Math.round(score),
        classification,
        factors
      });

    } catch (error) {
      console.error('Error updating lead score:', error);
    }
  }, [checkTriggers, config]);

  const monitorInactivity = useCallback(async () => {
    if (!config.inactivityAlerts) return;

    try {
      const inactivityThreshold = new Date();
      inactivityThreshold.setDate(inactivityThreshold.getDate() - 3); // 3 days

      const { data: inactiveLeads } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          leads (*),
          interactions (
            timestamp
          )
        `)
        .eq('pipeline_id', pipelineId)
        .eq('status_inscricao', 'Ativo')
        .lt('updated_at', inactivityThreshold.toISOString());

      if (!inactiveLeads) return;

      for (const entry of inactiveLeads) {
        const lastInteraction = entry.interactions?.[0];
        const daysSinceLastInteraction = lastInteraction 
          ? Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastInteraction >= 3) {
          await checkTriggers(entry.lead_id, 'inactivity', {
            daysSinceLastInteraction,
            stageId: entry.etapa_atual_id,
            leadId: entry.lead_id
          });
        }
      }
    } catch (error) {
      console.error('Error monitoring inactivity:', error);
    }
  }, [pipelineId, checkTriggers, config]);

  // Set up periodic monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      monitorStageTimeouts();
      monitorInactivity();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Initial run
    monitorStageTimeouts();
    monitorInactivity();

    return () => clearInterval(interval);
  }, [monitorStageTimeouts, monitorInactivity]);

  return {
    config,
    handleStageAdvancement,
    updateLeadScore,
    monitorStageTimeouts,
    monitorInactivity,
    processStageAdvancement: handleStageAdvancement,
    checkSLAViolations: monitorStageTimeouts
  };
}