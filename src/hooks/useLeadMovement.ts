import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useAudit } from '@/contexts/AuditContext';
import { LeadMovementValidator } from '@/lib/leadMovementValidator';
import { LeadPipelineEntry, PipelineStage, StageChecklistItem } from '@/types/crm';

interface MoveLeadParams {
  entry: LeadPipelineEntry;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  checklistItems: StageChecklistItem[];
  currentEntriesInTargetStage: number;
  onSuccess?: () => void;
  onError?: () => void;
}

interface MoveResult {
  success: boolean;
  message: string;
}

/**
 * Hook simplificado para movimentação de leads:
 * - Update direto no banco (sem Zustand)
 * - Sincronização via Supabase Realtime (~50ms)
 * - Validações completas
 * - Logs detalhados
 */
export function useLeadMovement() {
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { logChange } = useAudit();

  const moveLead = useCallback(async ({
    entry,
    fromStage,
    toStage,
    checklistItems,
    currentEntriesInTargetStage,
    onSuccess,
    onError
  }: MoveLeadParams): Promise<MoveResult> => {
    console.log('🚀 [useLeadMovement] Iniciando movimentação:', {
      entryId: entry.id,
      from: fromStage.nome,
      to: toStage.nome
    });

    // Validação 1: Usuário autenticado
    if (!user) {
      const error = 'Usuário não autenticado';
      console.error('❌ [useLeadMovement]', error);
      toast({
        title: 'Erro de autenticação',
        description: error,
        variant: 'destructive'
      });
      return { success: false, message: error };
    }

    // Validação 2: Não mover para mesma etapa
    if (fromStage.id === toStage.id) {
      console.log('⚠️ [useLeadMovement] Mesma etapa, cancelando');
      return { success: false, message: 'Lead já está nesta etapa' };
    }

    // Validação 3: Regras de negócio
    const validation = LeadMovementValidator.validateMovement(
      entry,
      fromStage,
      toStage,
      checklistItems,
      currentEntriesInTargetStage
    );

    if (!validation.canMove) {
      const errorMsg = validation.blockers.join('\n');
      console.log('⛔ [useLeadMovement] Validação bloqueou:', validation.blockers);
      
      toast({
        title: 'Movimentação bloqueada',
        description: errorMsg,
        variant: 'destructive',
        duration: 6000
      });
      
      return { success: false, message: errorMsg };
    }

    // Mostrar warnings se houver
    if (validation.warnings.length > 0) {
      console.log('⚠️ [useLeadMovement] Warnings:', validation.warnings);
    }

    try {
      setIsMoving(true);

      // ✅ UPDATE OTIMISTA - Notifica UI ANTES da API responder
      console.log('⚡ [useLeadMovement] Update otimista - UI atualiza imediatamente');
      onSuccess?.();

      // Preparar dados de update
      const updateData = {
        etapa_atual_id: toStage.id,
        data_entrada_etapa: new Date().toISOString(),
        saude_etapa: 'Verde' as const,
        updated_at: new Date().toISOString()
      };

      console.log('💾 [useLeadMovement] Executando update no banco (background):', {
        entryId: entry.id,
        fromStage: fromStage.nome,
        toStage: toStage.nome
      });

      // Update direto no Supabase (sem .select() - realtime enviará dados atualizados)
      const { error } = await supabase
        .from('lead_pipeline_entries')
        .update(updateData)
        .eq('id', entry.id);

      if (error) {
        // Se falhar, notifica erro para reverter UI
        onError?.();
        throw new Error(error.message);
      }

      console.log('✅ [useLeadMovement] Update confirmado no banco');

      // Log de auditoria
      logChange({
        entidade: 'LeadPipelineEntry',
        entidade_id: entry.id,
        alteracao: [
          { campo: 'etapa_atual_id', de: fromStage.nome, para: toStage.nome },
          { campo: 'data_entrada_etapa', de: entry.data_entrada_etapa, para: updateData.data_entrada_etapa }
        ],
        ator: `${user.email} (Sistema de Movimentação)`
      });

      // Feedback de confirmação (UI já foi atualizada otimisticamente)
      const successMsg = `Lead movido para "${toStage.nome}"`;
      toast({
        title: '✅ Movimentação confirmada',
        description: successMsg,
        duration: 2000
      });

      console.log('✅ [useLeadMovement] Sucesso total');

      return { success: true, message: successMsg };

    } catch (error) {
      console.error('❌ [useLeadMovement] Erro no update:', error);
      
      // Notificar componente pai sobre erro
      onError?.();
      
      let errorMessage = 'Erro ao mover lead';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Você não tem permissão para esta ação';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Erro na movimentação',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      });

      return { success: false, message: errorMessage };

    } finally {
      setIsMoving(false);
    }
  }, [user, toast, logChange]);

  return {
    moveLead,
    isMoving
  };
}
