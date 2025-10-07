import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBusinessRules() {
  const { toast } = useToast();

  // Validar checklist obrigatório
  const validateMandatoryChecklist = async (stageId: string, checklistState: Record<string, boolean>): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_mandatory_checklist', {
        stage_id_param: stageId,
        checklist_state_param: checklistState
      });

      if (error) {
        console.error('Erro ao validar checklist:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erro ao validar checklist:', error);
      return false;
    }
  };

  // Recalcular lead score manualmente (o trigger já faz automaticamente)
  const recalculateLeadScore = async (leadData: {
    ja_vendeu_no_digital?: boolean;
    seguidores?: number;
    faturamento_medio?: number;
    meta_faturamento?: number;
    origem?: string;
    objecao_principal?: string;
  }): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('calculate_lead_score', {
        ja_vendeu_digital: leadData.ja_vendeu_no_digital || false,
        seguidores: leadData.seguidores || 0,
        faturamento_medio: leadData.faturamento_medio || 0,
        meta_faturamento: leadData.meta_faturamento || 0,
        origem: leadData.origem || '',
        objecao_principal: leadData.objecao_principal || ''
      });

      if (error) {
        console.error('Erro ao calcular lead score:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erro ao calcular lead score:', error);
      return 0;
    }
  };

  // Obter classificação do lead score
  const getLeadScoreClassification = async (score: number): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_lead_score_classification', {
        score
      });

      if (error) {
        console.error('Erro ao obter classificação do lead score:', error);
        return 'Baixo';
      }

      return data || 'Baixo';
    } catch (error) {
      console.error('Erro ao obter classificação do lead score:', error);
      return 'Baixo';
    }
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