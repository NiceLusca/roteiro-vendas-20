import { useState, useCallback } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';

interface KanbanBoardProps {
  selectedPipelineId: string;
  stageEntries: Array<{
    stage: PipelineStage;
    nextStage?: PipelineStage | null;
    entries: Array<LeadPipelineEntry & { lead: Lead }>;
    wipExceeded: boolean;
  }>;
  onRefresh?: () => void;
  onAddLead?: (stageId: string) => void;
  onViewLead?: (leadId: string) => void;
  onEditLead?: (leadId: string) => void;
  onCreateAppointment?: (leadId: string) => void;
  onAdvanceStage?: (entryId: string) => void;
  onJumpToStage?: (entryId: string) => void;
  onRegisterInteraction?: (leadId: string) => void;
  onOpenChecklist?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onTransferPipeline?: (leadId: string) => void;
}

/**
 * KanbanBoard simplificado com HTML5 Drag-and-Drop nativo:
 * - Sem @dnd-kit, sem Zustand
 * - HTML5 nativo para drag-and-drop
 * - Delega movimentação para useLeadMovement
 * - Sincronização via Supabase Realtime
 */
export function KanbanBoard({
  selectedPipelineId,
  stageEntries,
  onRefresh,
  onAddLead,
  onViewLead,
  onEditLead,
  onCreateAppointment,
  onAdvanceStage,
  onJumpToStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline
}: KanbanBoardProps) {
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const { moveLead, isMoving } = useLeadMovement();
  const { checklistItems } = useSupabaseChecklistItems();

  const handleDropLead = useCallback(async (entryId: string, toStageId: string) => {
    console.log('📍 [KanbanBoard] handleDropLead:', { entryId, toStageId });

    if (isMoving) {
      console.log('⚠️ [KanbanBoard] Já existe uma movimentação em andamento');
      return;
    }

    const entry = stageEntries
      .flatMap(s => s.entries)
      .find(e => e.id === entryId);

    if (!entry) {
      console.error('❌ Entry não encontrada');
      return;
    }

    const fromStageEntry = stageEntries.find(s => 
      s.entries.some(e => e.id === entryId)
    );
    const toStageEntry = stageEntries.find(s => s.stage.id === toStageId);

    if (!fromStageEntry || !toStageEntry) {
      console.error('❌ Stages não encontrados');
      return;
    }

    if (fromStageEntry.stage.id === toStageId) {
      console.log('⚠️ [KanbanBoard] Mesma etapa, ignorando');
      return;
    }

    // Buscar checklist items da etapa de origem
    const stageChecklistItems = checklistItems.filter(
      item => item.etapa_id === fromStageEntry.stage.id
    );

    console.log('🔄 [KanbanBoard] Executando movimentação');

    // Executar movimentação
    await moveLead({
      entry,
      fromStage: fromStageEntry.stage,
      toStage: toStageEntry.stage,
      checklistItems: stageChecklistItems,
      currentEntriesInTargetStage: toStageEntry.entries.length,
      onSuccess: () => {
        console.log('✅ Movimentação completa');
        onRefresh?.();
      },
      onError: () => {
        onRefresh?.();
      }
    });
  }, [stageEntries, checklistItems, moveLead, isMoving, onRefresh]);

  return (
    <div className="flex gap-2 md:gap-3 lg:gap-4 h-full overflow-x-auto overflow-y-hidden pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
      {stageEntries.map(({ stage, nextStage, entries, wipExceeded }) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          nextStage={nextStage}
          entries={entries}
          wipExceeded={wipExceeded}
          checklistItems={checklistItems}
          onAddLead={onAddLead}
          onViewLead={onViewLead}
          onEditLead={onEditLead}
          onCreateAppointment={onCreateAppointment}
          onAdvanceStage={onAdvanceStage}
          onJumpToStage={onJumpToStage}
          onRegisterInteraction={onRegisterInteraction}
          onOpenChecklist={onOpenChecklist}
          onRegressStage={onRegressStage}
          onTransferPipeline={onTransferPipeline}
          onDropLead={handleDropLead}
          onDragStart={(entryId) => setDraggingEntryId(entryId)}
          onDragEnd={() => setDraggingEntryId(null)}
        />
      ))}
    </div>
  );
}
