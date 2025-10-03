import { memo } from 'react';
import { KanbanCard } from './KanbanCard';
import { Lead, LeadPipelineEntry, PipelineStage } from '@/types/crm';

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
  nextAppointment?: AppointmentInfo | null;
  isDragging?: boolean;
  onViewLead?: () => void;
  onCreateAppointment?: () => void;
  onAdvanceStage?: () => void;
  onRegisterInteraction?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onTransferPipeline?: () => void;
}

/**
 * Versão memoizada do KanbanCard para melhor performance em listas grandes
 * Só re-renderiza quando props relevantes mudam
 */
export const MemoizedKanbanCard = memo(
  KanbanCard,
  (prevProps, nextProps) => {
    // Custom comparison - só re-renderiza se dados importantes mudaram
    return (
      prevProps.entry.id === nextProps.entry.id &&
      prevProps.entry.saude_etapa === nextProps.entry.saude_etapa &&
      prevProps.entry.tempo_em_etapa_dias === nextProps.entry.tempo_em_etapa_dias &&
      prevProps.entry.dias_em_atraso === nextProps.entry.dias_em_atraso &&
      prevProps.entry.nota_etapa === nextProps.entry.nota_etapa &&
      prevProps.lead?.id === nextProps.lead?.id &&
      prevProps.lead?.nome === nextProps.lead?.nome &&
      prevProps.lead?.lead_score === nextProps.lead?.lead_score &&
      prevProps.lead?.lead_score_classification === nextProps.lead?.lead_score_classification &&
      prevProps.lead?.whatsapp === nextProps.lead?.whatsapp &&
      prevProps.lead?.closer === nextProps.lead?.closer &&
      prevProps.stage.id === nextProps.stage.id &&
      prevProps.stage.proximo_passo_label === nextProps.stage.proximo_passo_label &&
      prevProps.stage.proximo_passo_tipo === nextProps.stage.proximo_passo_tipo &&
      prevProps.nextAppointment?.id === nextProps.nextAppointment?.id &&
      prevProps.nextAppointment?.start_at === nextProps.nextAppointment?.start_at &&
      prevProps.isDragging === nextProps.isDragging
    );
  }
);

MemoizedKanbanCard.displayName = 'MemoizedKanbanCard';
