import { useCallback } from 'react';
import { LeadPipelineEntry, PipelineStage, StageChecklistItem } from '@/types/crm';
import { ChecklistValidation } from '@/components/checklist/ChecklistValidation';
import { usePipelineAutomation } from './usePipelineAutomation';
import { useMultiPipeline } from './useMultiPipeline';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook that combines checklist validation with pipeline automation
export function useValidatedAdvancement() {
  const { processStageAdvancement, getNextStage } = usePipelineAutomation();
  const { advanceStage } = useMultiPipeline();
  const { logChange } = useAudit();
  const { toast } = useToast();

  const attemptStageAdvancement = useCallback((
    entry: LeadPipelineEntry,
    stage: PipelineStage,
    checklistItems: StageChecklistItem[],
    targetStageId?: string
  ): Promise<{ success: boolean; message: string }> => {
    
    return new Promise((resolve) => {
      // Validate checklist completion
      const validation = ChecklistValidation.validateStageAdvancement(entry, checklistItems);
      
      if (!validation.valid) {
        resolve({
          success: false,
          message: validation.errors.join('\n')
        });
        return;
      }

      // Determine target stage
      const nextStageId = targetStageId || getNextStage(stage.id, entry.pipeline_id)?.id;
      
      if (!nextStageId) {
        resolve({
          success: false,
          message: 'Não há próxima etapa disponível neste pipeline'
        });
        return;
      }

      try {
        // Process automation effects
        const automation = processStageAdvancement(entry, nextStageId);
        
        // Log the advancement
        logChange({
          entidade: 'LeadPipelineEntry',
          entidade_id: entry.id,
          alteracao: [
            { campo: 'etapa_atual_id', de: entry.etapa_atual_id, para: nextStageId },
            { campo: 'automated_actions', de: '', para: automation.nextActions.join(', ') }
          ],
          ator: 'Sistema (Avanço Validado)'
        });

        // Execute the advancement
        advanceStage(entry.id, nextStageId);

        // Show automation results
        if (automation.nextActions.length > 0) {
          toast({
            title: 'Etapa avançada com automações',
            description: automation.nextActions.join(' • '),
            duration: 5000
          });
        }

        resolve({
          success: true,
          message: `Etapa avançada com sucesso${automation.shouldGenerateAppointment ? ' (agendamento automático criado)' : ''}`
        });

      } catch (error) {
        resolve({
          success: false,
          message: 'Erro interno ao processar avanço de etapa'
        });
      }
    });
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