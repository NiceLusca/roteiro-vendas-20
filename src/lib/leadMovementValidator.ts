import { LeadPipelineEntry, PipelineStage, StageChecklistItem } from '@/types/crm';

export interface MovementValidationResult {
  canMove: boolean;
  blockers: string[];
  warnings: string[];
}

/**
 * Biblioteca centralizada de validações para movimentação de leads
 */
export class LeadMovementValidator {
  
  /**
   * Valida se o checklist obrigatório está completo
   */
  static validateChecklist(
    entry: LeadPipelineEntry,
    checklistItems: StageChecklistItem[]
  ): { valid: boolean; missingItems: string[] } {
    const requiredItems = checklistItems.filter(item => item.obrigatorio);
    const checklistState = entry.checklist_state || {};
    
    const missingItems = requiredItems
      .filter(item => !checklistState[item.id])
      .map(item => item.titulo);
    
    return {
      valid: missingItems.length === 0,
      missingItems
    };
  }

  /**
   * Valida WIP limit da etapa de destino
   */
  static validateWIPLimit(
    targetStage: PipelineStage,
    currentEntriesInStage: number
  ): { valid: boolean; message?: string } {
    if (!targetStage.wip_limit) {
      return { valid: true };
    }
    
    if (currentEntriesInStage >= targetStage.wip_limit) {
      return {
        valid: false,
        message: `A etapa "${targetStage.nome}" atingiu o limite de ${targetStage.wip_limit} leads`
      };
    }
    
    return { valid: true };
  }

  /**
   * Validação completa de movimentação
   */
  static validateMovement(
    entry: LeadPipelineEntry,
    fromStage: PipelineStage,
    toStage: PipelineStage,
    checklistItems: StageChecklistItem[],
    currentEntriesInTargetStage: number
  ): MovementValidationResult {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Validar checklist
    const checklistValidation = this.validateChecklist(entry, checklistItems);
    if (!checklistValidation.valid) {
      blockers.push(
        `Complete os itens obrigatórios: ${checklistValidation.missingItems.join(', ')}`
      );
    }

    // Validar WIP limit
    const wipValidation = this.validateWIPLimit(toStage, currentEntriesInTargetStage);
    if (!wipValidation.valid && wipValidation.message) {
      blockers.push(wipValidation.message);
    }

    // Verificar se está retrocedendo (pode ser warning apenas)
    if (toStage.ordem < fromStage.ordem) {
      warnings.push('Este movimento retrocede o lead no pipeline');
    }

    return {
      canMove: blockers.length === 0,
      blockers,
      warnings
    };
  }
}
