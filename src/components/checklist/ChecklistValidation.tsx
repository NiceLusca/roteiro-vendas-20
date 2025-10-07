import { StageChecklistItem, LeadPipelineEntry } from '@/types/crm';

// Utility functions for checklist validation
export class ChecklistValidation {
  
  static canAdvanceStage(
    checklistItems: StageChecklistItem[], 
    checklistState: Record<string, boolean>
  ): { canAdvance: boolean; missingRequired: StageChecklistItem[] } {
    
    const requiredItems = checklistItems.filter(item => item.obrigatorio);
    const missingRequired = requiredItems.filter(item => !checklistState[item.id]);
    
    return {
      canAdvance: missingRequired.length === 0,
      missingRequired
    };
  }

  static getCompletionPercentage(
    checklistItems: StageChecklistItem[], 
    checklistState: Record<string, boolean>
  ): number {
    if (checklistItems.length === 0) return 100;
    
    const completedCount = checklistItems.filter(item => checklistState[item.id]).length;
    return Math.round((completedCount / checklistItems.length) * 100);
  }

  static getMissingRequiredCount(
    checklistItems: StageChecklistItem[], 
    checklistState: Record<string, boolean>
  ): number {
    return checklistItems.filter(item => item.obrigatorio && !checklistState[item.id]).length;
  }

  static validateStageAdvancement(
    checklistState: Record<string, boolean>,
    checklistItems: StageChecklistItem[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const validation = this.canAdvanceStage(checklistItems, checklistState);
    
    if (!validation.canAdvance) {
      errors.push(`${validation.missingRequired.length} item(s) obrigatório(s) pendente(s)`);
      validation.missingRequired.forEach(item => {
        errors.push(`• ${item.titulo}`);
      });
    }

    return {
      valid: validation.canAdvance,
      errors
    };
  }
}