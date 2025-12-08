import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useAudit } from '@/contexts/AuditContext';
import { LeadMovementValidator } from '@/lib/leadMovementValidator';
import { logger } from '@/utils/logger';
import { LeadPipelineEntry, PipelineStage, StageChecklistItem } from '@/types/crm';
import { useLeadActivityLog } from './useLeadActivityLog';

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
  const { logActivity } = useLeadActivityLog();

  const moveLead = useCallback(async ({
    entry,
    fromStage,
    toStage,
    checklistItems,
    currentEntriesInTargetStage,
    onSuccess,
    onError
  }: MoveLeadParams): Promise<MoveResult> => {
    logger.debug('Iniciando movimentação', {
      feature: 'lead-movement',
      metadata: { entryId: entry.id, from: fromStage.nome, to: toStage.nome }
    });

    // Validação 1: Usuário autenticado
    if (!user) {
      const error = 'Usuário não autenticado';
      logger.error('Usuário não autenticado na movimentação', undefined, {
        feature: 'lead-movement'
      });
      toast({
        title: 'Erro de autenticação',
        description: error,
        variant: 'destructive'
      });
      return { success: false, message: error };
    }

    // Validação 2: Não mover para mesma etapa
    if (fromStage.id === toStage.id) {
      logger.debug('Mesma etapa, cancelando movimentação', {
        feature: 'lead-movement',
        metadata: { stageId: fromStage.id }
      });
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
      logger.warn('Validação bloqueou movimentação', {
        feature: 'lead-movement',
        metadata: { blockers: validation.blockers }
      });
      
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
      logger.warn('Warnings na movimentação', {
        feature: 'lead-movement',
        metadata: { warnings: validation.warnings }
      });
    }

    try {
      setIsMoving(true);

      // Preparar dados de update
      const updateData = {
        etapa_atual_id: toStage.id,
        data_entrada_etapa: new Date().toISOString(),
        saude_etapa: 'Verde' as const,
        updated_at: new Date().toISOString()
      };

      logger.debug('Executando update no banco', {
        feature: 'lead-movement',
        metadata: { entryId: entry.id, fromStage: fromStage.nome, toStage: toStage.nome }
      });

      // Update direto no Supabase
      const { data, error } = await supabase
        .from('lead_pipeline_entries')
        .update(updateData)
        .eq('id', entry.id)
        .select('*, leads(*), pipeline_stages(*)')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado do banco após update');
      }

      logger.info('Update confirmado', {
        feature: 'lead-movement',
        metadata: { entryId: data.id }
      });

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

      // Registrar atividade no log
      await logActivity({
        leadId: entry.lead_id,
        pipelineEntryId: entry.id,
        activityType: 'stage_change',
        details: {
          from_stage: fromStage.nome,
          from_stage_id: fromStage.id,
          to_stage: toStage.nome,
          to_stage_id: toStage.id,
          pipeline_id: entry.pipeline_id
        }
      });

      // Feedback de sucesso
      const successMsg = `Lead movido para "${toStage.nome}"`;
      toast({
        title: '✅ Movimentação concluída',
        description: successMsg,
        duration: 3000
      });

      // Notificar sucesso após API confirmar
      onSuccess?.();

      logger.info('Movimentação concluída com sucesso', {
        feature: 'lead-movement',
        metadata: { entryId: entry.id, toStage: toStage.nome }
      });

      return { success: true, message: successMsg };

    } catch (error) {
      logger.error('Erro no update', error as Error, {
        feature: 'lead-movement',
        metadata: { entryId: entry.id }
      });
      
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
  }, [user, toast, logChange, logActivity]);

  return {
    moveLead,
    isMoving
  };
}
