import { LeadPipelineEntry, Lead, PipelineStage } from '@/types/crm';
import { StageAdvancementCriteria, LeadCriteriaState, RuleConfig, CriteriaValidationResult, AdvancementValidationResult } from '@/types/advancedCriteria';

export class CriteriaValidator {
  
  static validateRule(rule: RuleConfig, lead: Lead, entry: LeadPipelineEntry, context?: any): boolean {
    if (!rule) return true;

    switch (rule.type) {
      case 'lead_data':
        return this.validateLeadDataRule(rule, lead);
      
      case 'activity':
        return this.validateActivityRule(rule, lead, context);
      
      case 'time':
        return this.validateTimeRule(rule, entry);
      
      case 'relationship':
        return this.validateRelationshipRule(rule, lead, context);
      
      case 'composite':
        return this.validateCompositeRule(rule, lead, entry, context);
      
      default:
        return true;
    }
  }

  private static validateLeadDataRule(rule: RuleConfig, lead: Lead): boolean {
    if (!rule.field || rule.value === undefined) return false;
    
    const fieldValue = this.getLeadFieldValue(lead, rule.field);
    
    switch (rule.operator) {
      case '>':
        return Number(fieldValue) > Number(rule.value);
      case '<':
        return Number(fieldValue) < Number(rule.value);
      case '>=':
        return Number(fieldValue) >= Number(rule.value);
      case '<=':
        return Number(fieldValue) <= Number(rule.value);
      case '==':
        return fieldValue == rule.value;
      case '!=':
        return fieldValue != rule.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      default:
        return false;
    }
  }

  private static validateActivityRule(rule: RuleConfig, lead: Lead, context?: any): boolean {
    // This would check activities like appointments, interactions, etc.
    // For now, we'll implement basic checks and extend later
    if (!rule.field) return false;

    switch (rule.field) {
      case 'tem_agendamento_ativo':
        return context?.hasActiveAppointment || false;
      case 'ultima_interacao_dias':
        const daysSinceInteraction = context?.daysSinceLastInteraction || 999;
        return this.compareValues(daysSinceInteraction, rule.operator, rule.value);
      case 'total_interacoes':
        const totalInteractions = context?.totalInteractions || 0;
        return this.compareValues(totalInteractions, rule.operator, rule.value);
      default:
        return false;
    }
  }

  private static validateTimeRule(rule: RuleConfig, entry: LeadPipelineEntry): boolean {
    if (!rule.field) return false;

    const now = new Date();
    const entryDate = new Date(entry.data_entrada_etapa);
    
    switch (rule.field) {
      case 'dias_na_etapa':
        const daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        return this.compareValues(daysInStage, rule.operator, rule.value);
      case 'tempo_em_etapa_dias':
        return this.compareValues(entry.tempo_em_etapa_dias || 0, rule.operator, rule.value);
      case 'dias_em_atraso':
        return this.compareValues(entry.dias_em_atraso || 0, rule.operator, rule.value);
      default:
        return false;
    }
  }

  private static validateRelationshipRule(rule: RuleConfig, lead: Lead, context?: any): boolean {
    if (!rule.field) return false;

    switch (rule.field) {
      case 'tem_deal_ativo':
        return context?.hasActiveDeal || false;
      case 'tem_pedido_pendente':
        return context?.hasPendingOrder || false;
      case 'valor_deals_total':
        const totalDealsValue = context?.totalDealsValue || 0;
        return this.compareValues(totalDealsValue, rule.operator, rule.value);
      default:
        return false;
    }
  }

  private static validateCompositeRule(rule: RuleConfig, lead: Lead, entry: LeadPipelineEntry, context?: any): boolean {
    if (!rule.rules || rule.rules.length === 0) return true;

    const results = rule.rules.map(r => this.validateRule(r, lead, entry, context));
    
    switch (rule.logic) {
      case 'AND':
        return results.every(r => r);
      case 'OR':
        return results.some(r => r);
      default:
        return results.every(r => r);
    }
  }

  private static compareValues(value: number, operator: string, targetValue: number): boolean {
    switch (operator) {
      case '>':
        return value > targetValue;
      case '<':
        return value < targetValue;
      case '>=':
        return value >= targetValue;
      case '<=':
        return value <= targetValue;
      case '==':
        return value === targetValue;
      case '!=':
        return value !== targetValue;
      default:
        return false;
    }
  }

  private static getLeadFieldValue(lead: Lead, field: string): any {
    const fieldMap: Record<string, keyof Lead> = {
      'lead_score': 'lead_score',
      'seguidores': 'seguidores',
      'faturamento_medio': 'faturamento_medio',
      'meta_faturamento': 'meta_faturamento',
      'ja_vendeu_no_digital': 'ja_vendeu_no_digital'
    };

    const mappedField = fieldMap[field];
    return mappedField ? lead[mappedField] : null;
  }

  static async validateStageCriteria(
    criteria: StageAdvancementCriteria[],
    lead: Lead,
    entry: LeadPipelineEntry,
    criteriaStates: LeadCriteriaState[],
    context?: any
  ): Promise<AdvancementValidationResult> {
    
    const results: CriteriaValidationResult[] = [];
    
    for (const criterio of criteria) {
      const existingState = criteriaStates.find(cs => cs.criterio_id === criterio.id);
      let validationResult: CriteriaValidationResult;

      switch (criterio.tipo) {
        case 'checklist':
          // Already handled by existing checklist system
          validationResult = this.validateChecklistCriteria(criterio, entry, existingState);
          break;
          
        case 'automatico':
          validationResult = this.validateAutomaticCriteria(criterio, lead, entry, context);
          break;
          
        case 'manual':
          validationResult = this.validateManualCriteria(criterio, existingState);
          break;
          
        case 'condicional':
          validationResult = this.validateConditionalCriteria(criterio, lead, entry, context);
          break;
          
        default:
          validationResult = {
            criteriaId: criterio.id,
            valid: true,
            status: 'nao_aplicavel',
            message: 'Tipo de critério não reconhecido'
          };
      }

      results.push(validationResult);
    }

    const blockers = results.filter(r => !r.valid && r.status === 'bloqueado');
    const warnings = results.filter(r => !r.valid && r.status === 'pendente');
    const passedCriteria = results.filter(r => r.valid);

    return {
      canAdvance: blockers.length === 0,
      blockers,
      warnings,
      passedCriteria
    };
  }

  private static validateChecklistCriteria(
    criterio: StageAdvancementCriteria,
    entry: LeadPipelineEntry,
    existingState?: LeadCriteriaState
  ): CriteriaValidationResult {
    // This integrates with the existing checklist system
    const isCompleted = existingState?.status === 'atendido';
    
    return {
      criteriaId: criterio.id,
      valid: !criterio.obrigatorio || isCompleted,
      status: isCompleted ? 'atendido' : 'pendente',
      message: isCompleted ? 'Checklist completo' : `Checklist pendente: ${criterio.id}`
    };
  }

  private static validateAutomaticCriteria(
    criterio: StageAdvancementCriteria,
    lead: Lead,
    entry: LeadPipelineEntry,
    context?: any
  ): CriteriaValidationResult {
    if (!criterio.regra_condicional) {
      return {
        criteriaId: criterio.id,
        valid: true,
        status: 'nao_aplicavel',
        message: 'Regra não configurada'
      };
    }

    const isValid = this.validateRule(criterio.regra_condicional, lead, entry, context);
    
    return {
      criteriaId: criterio.id,
      valid: isValid,
      status: isValid ? 'atendido' : 'bloqueado',
      message: isValid ? `${criterio.nome} - Atendido` : `${criterio.nome} - Não atendido`
    };
  }

  private static validateManualCriteria(
    criterio: StageAdvancementCriteria,
    existingState?: LeadCriteriaState
  ): CriteriaValidationResult {
    const isApproved = existingState?.status === 'atendido';
    
    return {
      criteriaId: criterio.id,
      valid: !criterio.obrigatorio || isApproved,
      status: isApproved ? 'atendido' : 'pendente',
      message: isApproved ? `${criterio.nome} - Aprovado` : `${criterio.nome} - Aguardando aprovação manual`
    };
  }

  private static validateConditionalCriteria(
    criterio: StageAdvancementCriteria,
    lead: Lead,
    entry: LeadPipelineEntry,
    context?: any
  ): CriteriaValidationResult {
    if (!criterio.regra_condicional) {
      return {
        criteriaId: criterio.id,
        valid: true,
        status: 'nao_aplicavel',
        message: 'Regra condicional não configurada'
      };
    }

    const isValid = this.validateRule(criterio.regra_condicional, lead, entry, context);
    
    return {
      criteriaId: criterio.id,
      valid: isValid,
      status: isValid ? 'atendido' : 'bloqueado',
      message: isValid ? 
        `${criterio.nome} - Condição atendida` : 
        `${criterio.nome} - Condição não atendida`
    };
  }
}