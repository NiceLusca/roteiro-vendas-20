import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBusinessRules() {
  const { toast } = useToast();

  // Validar checklist obrigatório
  const validateMandatoryChecklist = async (stageId: string, checklistState: Record<string, boolean>): Promise<boolean> => {
    try {
      // Buscar itens obrigatórios
      const { data: items, error } = await supabase
        .from('stage_checklist_items')
        .select('id')
        .eq('etapa_id', stageId)
        .eq('obrigatorio', true)
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao validar checklist:', error);
        return false;
      }

      // Verificar se todos os itens obrigatórios estão marcados
      return items?.every(item => checklistState[item.id] === true) ?? false;
    } catch (error) {
      console.error('Erro ao validar checklist:', error);
      return false;
    }
  };

  // Calcular lead score (implementação client-side)
  const recalculateLeadScore = async (leadData: {
    ja_vendeu_no_digital?: boolean;
    seguidores?: number;
    faturamento_medio?: number;
    meta_faturamento?: number;
    origem?: string;
    objecao_principal?: string;
  }): Promise<number> => {
    let score = 0;
    
    // Pontuação baseada em experiência digital
    if (leadData.ja_vendeu_no_digital) score += 20;
    
    // Pontuação baseada em seguidores
    const seguidores = leadData.seguidores || 0;
    if (seguidores > 10000) score += 20;
    else if (seguidores > 5000) score += 15;
    else if (seguidores > 1000) score += 10;
    
    // Pontuação baseada em faturamento
    const faturamento = leadData.faturamento_medio || 0;
    if (faturamento > 50000) score += 20;
    else if (faturamento > 20000) score += 15;
    else if (faturamento > 10000) score += 10;
    
    // Pontuação baseada em meta
    const meta = leadData.meta_faturamento || 0;
    if (meta > 100000) score += 20;
    else if (meta > 50000) score += 15;
    else if (meta > 20000) score += 10;
    
    return Math.min(score, 100);
  };

  // Obter classificação do lead score
  const getLeadScoreClassification = async (score: number): Promise<string> => {
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Médio';
    return 'Baixo';
  };

  // Validar avanço de etapa (verifica checklist obrigatório)
  const canAdvanceStage = async (stageId: string, checklistState: Record<string, boolean>): Promise<{
    canAdvance: boolean;
    missingItems: string[];
  }> => {
    try {
      // Buscar itens obrigatórios da etapa
      const { data: mandatoryItems, error } = await supabase
        .from('stage_checklist_items')
        .select('id, titulo')
        .eq('etapa_id', stageId)
        .eq('obrigatorio', true)
        .eq('ativo', true);

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

      if (!canAdvance) {
        toast({
          title: "Não é possível avançar",
          description: `Complete os itens obrigatórios: ${missingItems.join(', ')}`,
          variant: "destructive"
        });
      }

      return { canAdvance, missingItems };
    } catch (error) {
      console.error('Erro ao validar avanço:', error);
      return { canAdvance: false, missingItems: [] };
    }
  };

  return {
    validateMandatoryChecklist,
    recalculateLeadScore,
    getLeadScoreClassification,
    canAdvanceStage
  };
}