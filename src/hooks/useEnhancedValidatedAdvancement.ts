import { useCallback } from 'react';
import { LeadPipelineEntry, PipelineStage, Lead } from '@/types/crm';
import { AdvancementValidationResult } from '@/types/advancedCriteria';
import { CriteriaValidator } from '@/utils/criteriaValidator';
import { useAdvancedCriteria, useLeadCriteriaState } from './useAdvancedCriteria';
import { useSupabaseLeadStageManagement } from './useSupabaseLeadStageManagement';
import { useSupabasePipelineStages } from './useSupabasePipelineStages';
import { useSupabaseChecklistItems } from './useSupabaseChecklistItems';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedValidatedAdvancement() {
  const { advanceStage } = useSupabaseLeadStageManagement();
  const { stages } = useSupabasePipelineStages();
  const { toast } = useToast();

  const validateMandatoryChecklist = useCallback(async (stageId: string, checklistState: Record<string, boolean>): Promise<{
    canAdvance: boolean;
    missingItems: string[];
  }> => {
    try {
      // Buscar itens obrigatórios da etapa
      const { data: mandatoryItems, error } = await supabase
        .from('stage_checklist_items')
        .select('id, titulo')
        .eq('stage_id', stageId)
        .eq('obrigatorio', true);

      if (error) {
        console.error('Erro ao buscar itens obrigatórios:', error);
        return { canAdvance: false, missingItems: [] };
      }

      const missingItems: string[] = [];
      
      for (const item of mandatoryItems || []) {
        const isCompleted = checklistState[item.id] === true;
        if (!isCompleted) {
          missingItems.push(item.titulo);
        }
      }

      const canAdvance = missingItems.length === 0;
      return { canAdvance, missingItems };
    } catch (error) {
      console.error('Erro ao validar avanço:', error);
      return { canAdvance: false, missingItems: [] };
    }
  }, []);

  const getNextStage = useCallback((currentStageId: string, pipelineId: string) => {
    const pipelineStages = stages.filter(s => s.pipeline_id === pipelineId).sort((a, b) => a.ordem - b.ordem);
    const currentIndex = pipelineStages.findIndex(s => s.id === currentStageId);
    return currentIndex >= 0 && currentIndex < pipelineStages.length - 1 ? pipelineStages[currentIndex + 1] : null;
  }, [stages]);

  const validateStageAdvancement = useCallback(async (
    entry: LeadPipelineEntry,
    lead: Lead,
    targetStageId?: string
  ): Promise<AdvancementValidationResult> => {
    
    const stageId = targetStageId || getNextStage(entry.etapa_atual_id, entry.pipeline_id)?.id;
    
    if (!stageId) {
      return {
        canAdvance: false,
        blockers: [{
          criteriaId: 'no_next_stage',
          valid: false,
          status: 'bloqueado',
          message: 'Não há próxima etapa disponível neste pipeline'
        }],
        warnings: [],
        passedCriteria: []
      };
    }

    // For now, we'll use empty arrays since the hooks need to be used at component level
    const criteria: any[] = [];
    const criteriaStates: any[] = [];

    // Validate mandatory checklist items first
    const checklistState = entry.checklist_state as Record<string, boolean> || {};
    const { canAdvance, missingItems } = await validateMandatoryChecklist(entry.etapa_atual_id, checklistState);
    
    if (!canAdvance) {
      return {
        canAdvance: false,
        blockers: [{
          criteriaId: 'mandatory_checklist',
          valid: false,
          status: 'bloqueado',
          message: `Complete os itens obrigatórios: ${missingItems.join(', ')}`
        }],
        warnings: [],
        passedCriteria: []
      };
    }

    // Get additional context for validation
    const context = await getValidationContext(lead, entry);
    
    // Validate all criteria
    return CriteriaValidator.validateStageCriteria(
      criteria,
      lead,
      entry,
      criteriaStates,
      context
    );
  }, [validateMandatoryChecklist, getNextStage]);

  const attemptStageAdvancement = useCallback(async (
    entry: LeadPipelineEntry,
    lead: Lead,
    targetStageId?: string
  ): Promise<{ success: boolean; message: string; details?: AdvancementValidationResult }> => {
    
    const validationResult = await validateStageAdvancement(entry, lead, targetStageId);
    
    if (!validationResult.canAdvance) {
      const blockerMessages = validationResult.blockers.map(b => b.message).join('\n');
      return {
        success: false,
        message: `Avanço bloqueado:\n${blockerMessages}`,
        details: validationResult
      };
    }

    // If validation passes, proceed with stage advancement
    const nextStageId = targetStageId || getNextStage(entry.etapa_atual_id, entry.pipeline_id)?.id;
    
    if (!nextStageId) {
      return {
        success: false,
        message: 'Não há próxima etapa disponível neste pipeline'
      };
    }

    try {
      const result = await advanceStage(
        entry.id,
        nextStageId,
        entry.checklist_state,
        entry.nota_etapa
      );

      if (result.success) {
        toast({
          title: "Etapa avançada com sucesso",
          description: `${validationResult.passedCriteria.length} critérios validados.`,
        });
      }

      return {
        success: result.success,
        message: result.message || (result.success ? 'Etapa avançada com sucesso' : 'Erro ao avançar etapa'),
        details: validationResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro interno ao processar avanço de etapa'
      };
    }
  }, [validateStageAdvancement, getNextStage, advanceStage, toast]);

  const getValidationContext = useCallback(async (lead: Lead, entry: LeadPipelineEntry) => {
    // This would fetch additional data needed for validation
    // For now, we'll return a basic context
    return {
      hasActiveAppointment: false,
      daysSinceLastInteraction: 999,
      totalInteractions: 0,
      hasActiveDeal: false,
      hasPendingOrder: false,
      totalDealsValue: 0
    };
  }, []);

  const canAdvanceFromCurrentStage = useCallback(async (
    entry: LeadPipelineEntry,
    lead: Lead
  ): Promise<{ canAdvance: boolean; details: AdvancementValidationResult }> => {
    
    const validationResult = await validateStageAdvancement(entry, lead);
    
    return {
      canAdvance: validationResult.canAdvance,
      details: validationResult
    };
  }, [validateStageAdvancement]);

  return {
    attemptStageAdvancement,
    validateStageAdvancement,
    canAdvanceFromCurrentStage,
    getNextStage
  };
}