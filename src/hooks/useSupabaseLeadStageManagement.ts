import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useAudit } from '@/contexts/AuditContext';

interface StageAdvancementResult {
  success: boolean;
  message: string;
  automaticActions?: string[];
}

export function useSupabaseLeadStageManagement() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { logChange } = useAudit();

  // Advance lead to next stage with validation
  const advanceStage = useCallback(async (
    entryId: string,
    newStageId: string,
    checklistState?: Record<string, boolean>,
    note?: string
  ): Promise<StageAdvancementResult> => {
    if (!user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);

      // Get current entry
      const { data: currentEntry, error: fetchError } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          *,
          pipeline_stages!etapa_atual_id(nome, ordem, sla_horas)
        `)
        .eq('id', entryId)
        .single();

      if (fetchError || !currentEntry) {
        return { success: false, message: 'Entry não encontrado' };
      }

      // Get target stage info
      const { data: targetStage, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('nome, ordem, sla_horas')
        .eq('id', newStageId)
        .single();

      if (stageError || !targetStage) {
        return { success: false, message: 'Etapa de destino não encontrada' };
      }

      // Update entry
      const updateData: any = {
        etapa_atual_id: newStageId,
        data_entrada_etapa: new Date().toISOString(),
        saude_etapa: 'verde',
        updated_at: new Date().toISOString()
      };

      const { data: updatedEntry, error: updateError } = await supabase
        .from('lead_pipeline_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      // Log the advancement
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: entryId,
        alteracao: [
          { 
            campo: 'etapa_atual_id', 
            de: currentEntry.etapa_atual_id, 
            para: newStageId 
          },
          {
            campo: 'data_entrada_etapa',
            de: currentEntry.data_entrada_etapa,
            para: updateData.data_entrada_etapa
          }
        ],
        ator: 'Sistema (Avanço de Etapa)'
      });

      const message = `Lead avançado para ${targetStage.nome}`;

      toast({
        title: "Etapa avançada",
        description: message
      });

      return { 
        success: true, 
        message
      };

    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      return { success: false, message: 'Erro interno ao processar avanço' };
    } finally {
      setLoading(false);
    }
  }, [user, toast, logChange]);

  // Move lead back to previous stage
  const revertStage = useCallback(async (
    entryId: string,
    previousStageId: string,
    reason: string
  ): Promise<StageAdvancementResult> => {
    if (!user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);

      const result = await advanceStage(entryId, previousStageId, undefined, `Revertido: ${reason}`);
      
      if (result.success) {
        return { success: true, message: `Lead revertido para etapa anterior. Motivo: ${reason}` };
      }

      return result;
    } catch (error) {
      console.error('Erro ao reverter etapa:', error);
      return { success: false, message: 'Erro ao reverter etapa' };
    } finally {
      setLoading(false);
    }
  }, [user, advanceStage]);


  return {
    loading,
    advanceStage,
    revertStage
  };
}