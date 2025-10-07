import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBusinessRules() {
  const { toast } = useToast();

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
    canAdvanceStage
  };
}
