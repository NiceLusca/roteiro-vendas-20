import { useCallback } from 'react';
import { LeadPipelineEntry, PipelineStage, StageChecklistItem } from '@/types/crm';
import { ChecklistValidation } from '@/components/checklist/ChecklistValidation';
import { usePipelineAutomation } from './usePipelineAutomation';
import { useSupabaseLeadStageManagement } from './useSupabaseLeadStageManagement';
import { useSupabasePipelineStages } from './useSupabasePipelineStages';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook that combines checklist validation with pipeline automation
export function useValidatedAdvancement() {
  const { processStageAdvancement } = usePipelineAutomation();
  const { advanceStage } = useSupabaseLeadStageManagement();
  const { stages } = useSupabasePipelineStages();
  const { logChange } = useAudit();
  const { toast } = useToast();

  const getNextStage = useCallback((currentStageId: string, pipelineId: string) => {
    const pipelineStages = stages.filter(s => s.pipeline_id === pipelineId).sort((a, b) => a.ordem - b.ordem);
    const currentIndex = pipelineStages.findIndex(s => s.id === currentStageId);
    return currentIndex >= 0 && currentIndex < pipelineStages.length - 1 ? pipelineStages[currentIndex + 1] : null;
  }, [stages]);

  const attemptStageAdvancement = useCallback(async (
    entry: LeadPipelineEntry,
    stage: PipelineStage,
    checklistItems: StageChecklistItem[],
    targetStageId?: string
  ): Promise<{ success: boolean; message: string }> => {
    
    // Validate checklist completion
    const validation = ChecklistValidation.validateStageAdvancement(entry, checklistItems);
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join('\n')
      };
    }

    // Determine target stage
    const nextStageId = targetStageId || getNextStage(stage.id, entry.pipeline_id)?.id;
    
    if (!nextStageId) {
      return {
        success: false,
        message: 'Não há próxima etapa disponível neste pipeline'
      };
    }

    try {
      // Use the real stage advancement hook
      const result = await advanceStage(
        entry.id,
        nextStageId,
        entry.checklist_state,
        entry.nota_etapa
      );

      return {
        success: result.success,
        message: result.message || (result.success ? 'Etapa avançada com sucesso' : 'Erro ao avançar etapa')
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro interno ao processar avanço de etapa'
      };
    }
  }, [processStageAdvancement, getNextStage, advanceStage, logChange, toast]);

  const canAdvanceFromCurrentStage = useCallback((
    entry: LeadPipelineEntry,
    checklistItems: StageChecklistItem[]
  ): { canAdvance: boolean; blockers: string[] } => {
    
    const validation = ChecklistValidation.validateStageAdvancement(entry, checklistItems);
    const nextStage = getNextStage(entry.etapa_atual_id, entry.pipeline_id);
    
    const blockers: string[] = [];
    
    if (!validation.valid) {
      blockers.push(...validation.errors);
    }
    
    if (!nextStage) {
      blockers.push('Não há próxima etapa configurada');
    }

    return {
      canAdvance: validation.valid && !!nextStage,
      blockers
    };
  }, [getNextStage]);

  return {
    attemptStageAdvancement,
    canAdvanceFromCurrentStage
  };
}