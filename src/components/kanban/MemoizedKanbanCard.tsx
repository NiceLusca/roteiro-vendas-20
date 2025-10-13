import { memo, useMemo } from 'react';
import { KanbanCard } from './KanbanCard';
import { Lead, LeadPipelineEntry, PipelineStage } from '@/types/crm';
import { useLeadPipelineStore } from '@/stores/leadPipelineStore';

interface AppointmentInfo {
  id: string;
  start_at: string;
  status: string;
  tipo_sessao?: string;
  closer_responsavel?: string;
}

interface MemoizedKanbanCardProps {
  entry: LeadPipelineEntry;
  lead: Lead | null | undefined;
  stage: PipelineStage;
  nextStage?: PipelineStage | null;
  checklistComplete?: boolean;
  nextAppointment?: AppointmentInfo | null;
  isDragging?: boolean;
  onViewLead?: () => void;
  onEditLead?: () => void;
  onCreateAppointment?: () => void;
  onAdvanceStage?: () => void;
  onRegisterInteraction?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onTransferPipeline?: () => void;
}

/**
 * Versão memoizada que mescla updates otimistas com os dados reais
 * Updates otimistas aparecem instantaneamente enquanto API processa
 */
export const MemoizedKanbanCard = memo(function MemoizedKanbanCard(props: MemoizedKanbanCardProps) {
  const optimisticUpdate = useLeadPipelineStore(
    state => state.getOptimisticUpdate(props.entry.id)
  );

  // Mesclar entry original com update otimista (se existir)
  const displayEntry = useMemo(() => {
    if (optimisticUpdate) {
      console.log('✨ [MemoizedKanbanCard] Aplicando update otimista:', props.entry.id);
      return { ...props.entry, ...optimisticUpdate };
    }
    return props.entry;
  }, [props.entry, optimisticUpdate]);

  return <KanbanCard {...props} entry={displayEntry} />;
}, (prevProps, nextProps) => {
  // Custom comparison - só re-renderiza se dados importantes mudaram
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.saude_etapa === nextProps.entry.saude_etapa &&
    prevProps.entry.data_entrada_etapa === nextProps.entry.data_entrada_etapa &&
    prevProps.entry.etapa_atual_id === nextProps.entry.etapa_atual_id &&
    prevProps.lead?.id === nextProps.lead?.id &&
    prevProps.lead?.nome === nextProps.lead?.nome &&
    prevProps.lead?.lead_score === nextProps.lead?.lead_score &&
    prevProps.lead?.whatsapp === nextProps.lead?.whatsapp &&
    prevProps.lead?.closer === nextProps.lead?.closer &&
    prevProps.stage.id === nextProps.stage.id &&
    prevProps.stage.proximo_passo_label === nextProps.stage.proximo_passo_label &&
    prevProps.stage.proximo_passo_tipo === nextProps.stage.proximo_passo_tipo &&
    prevProps.nextAppointment?.id === nextProps.nextAppointment?.id &&
    prevProps.nextAppointment?.start_at === nextProps.nextAppointment?.start_at &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.checklistComplete === nextProps.checklistComplete
  );
});

MemoizedKanbanCard.displayName = 'MemoizedKanbanCard';
