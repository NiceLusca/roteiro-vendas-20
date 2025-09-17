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
          pipeline_stages!inner(nome, ordem, prazo_em_dias, gerar_agendamento_auto)
        `)
        .eq('id', entryId)
        .single();

      if (fetchError || !currentEntry) {
        return { success: false, message: 'Entry não encontrado' };
      }

      // Get target stage info
      const { data: targetStage, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('nome, ordem, prazo_em_dias, gerar_agendamento_auto')
        .eq('id', newStageId)
        .single();

      if (stageError || !targetStage) {
        return { success: false, message: 'Etapa de destino não encontrada' };
      }

      // Calculate new SLA date
      const newSLADate = new Date();
      newSLADate.setDate(newSLADate.getDate() + targetStage.prazo_em_dias);

      // Update entry
      const updateData: any = {
        etapa_atual_id: newStageId,
        data_entrada_etapa: new Date().toISOString(),
        data_prevista_proxima_etapa: newSLADate.toISOString(),
        tempo_em_etapa_dias: 0,
        dias_em_atraso: 0,
        saude_etapa: 'Verde',
        updated_at: new Date().toISOString()
      };

      if (checklistState) {
        updateData.checklist_state = checklistState;
      }

      if (note) {
        updateData.nota_etapa = note;
      }

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

      const automaticActions: string[] = [];

      // Handle automatic appointment creation
      if (targetStage.gerar_agendamento_auto) {
        try {
          // Get lead info for appointment
          const { data: lead } = await supabase
            .from('leads')
            .select('nome, whatsapp')
            .eq('id', currentEntry.lead_id)
            .single();

          if (lead) {
            // Create automatic appointment
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 1); // Next day
            appointmentDate.setHours(10, 0, 0, 0); // 10 AM

            const { error: appointmentError } = await supabase
              .from('appointments')
              .insert([{
                lead_id: currentEntry.lead_id,
                start_at: appointmentDate.toISOString(),
                end_at: new Date(appointmentDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
                observacao: `Agendamento automático criado ao avançar para ${targetStage.nome}`,
                origem: 'Sistema',
                status: 'Agendado'
              }]);

            if (!appointmentError) {
              automaticActions.push('Agendamento automático criado');
            }
          }
        } catch (error) {
          console.error('Erro ao criar agendamento automático:', error);
        }
      }

      // Log to pipeline events
      await supabase
        .from('pipeline_events')
        .insert([{
          lead_pipeline_entry_id: entryId,
          tipo: 'stage_advancement',
          de_etapa_id: currentEntry.etapa_atual_id,
          para_etapa_id: newStageId,
          ator: user.email || 'Sistema',
          detalhes: {
            checklistCompleted: !!checklistState,
            automaticActions,
            note: note || null
          }
        }]);

      const message = `Lead avançado para ${targetStage.nome}${automaticActions.length > 0 ? ` (${automaticActions.join(', ')})` : ''}`;

      toast({
        title: "Etapa avançada",
        description: message
      });

      return { 
        success: true, 
        message,
        automaticActions
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
        // Log the reversion
        await supabase
          .from('pipeline_events')
          .insert([{
            lead_pipeline_entry_id: entryId,
            tipo: 'stage_reversion',
            para_etapa_id: previousStageId,
            ator: user.email || 'Sistema',
            detalhes: {
              reason,
              revertedAt: new Date().toISOString()
            }
          }]);

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

  // Update checklist state only
  const updateChecklistState = useCallback(async (
    entryId: string,
    checklistState: Record<string, boolean>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({
          checklist_state: checklistState,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        toast({
          title: "Erro ao atualizar checklist",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Log checklist update
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: entryId,
        alteracao: [
          { 
            campo: 'checklist_state', 
            de: 'Estado anterior', 
            para: JSON.stringify(checklistState) 
          }
        ],
        ator: 'Usuário'
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      return false;
    }
  }, [user, toast, logChange]);

  // Update stage note
  const updateStageNote = useCallback(async (
    entryId: string,
    note: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update({
          nota_etapa: note,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        toast({
          title: "Erro ao atualizar nota",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      return false;
    }
  }, [user, toast]);

  return {
    loading,
    advanceStage,
    revertStage,
    updateChecklistState,
    updateStageNote
  };
}