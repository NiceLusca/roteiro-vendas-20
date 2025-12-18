import { useState, useCallback } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { LeadTag } from '@/types/bulkImport';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  selectedPipelineId: string;
  stageEntries: Array<{
    stage: PipelineStage;
    nextStage?: PipelineStage | null;
    entries: Array<LeadPipelineEntry & { lead: Lead }>;
    wipExceeded: boolean;
  }>;
  tagsMap?: Record<string, LeadTag[]>;
  onRefresh?: () => void;
  onTagsChange?: () => void;
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
  onUnsubscribeFromPipeline?: (entryId: string, leadId: string) => void;
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
  tagsMap = {},
  onRefresh,
  onTagsChange,
  onAddLead,
  onViewLead,
  onEditLead,
  onCreateAppointment,
  onAdvanceStage,
  onJumpToStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline,
  onUnsubscribeFromPipeline,
  hasMore,
  onLoadMore,
  loadingMore
}: KanbanBoardProps & { hasMore?: boolean; onLoadMore?: () => void; loadingMore?: boolean }) {
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const { moveLead, isMoving } = useLeadMovement();
  const { checklistItems } = useSupabaseChecklistItems();
  const { batchUpdateStages } = useSupabasePipelineStages(selectedPipelineId);
  const { toast } = useToast();

  const handleDropLead = useCallback(async (entryId: string, toStageId: string) => {
    logger.debug('handleDropLead', {
      feature: 'kanban',
      metadata: { entryId, toStageId }
    });

    if (isMoving) {
      logger.debug('Movimentação já em andamento', { feature: 'kanban' });
      return;
    }

    const entry = stageEntries
      .flatMap(s => s.entries)
      .find(e => e.id === entryId);

    if (!entry) {
      logger.error('Entry não encontrada', undefined, { feature: 'kanban' });
      return;
    }

    const fromStageEntry = stageEntries.find(s => 
      s.entries.some(e => e.id === entryId)
    );
    const toStageEntry = stageEntries.find(s => s.stage.id === toStageId);

    if (!fromStageEntry || !toStageEntry) {
      logger.error('Stages não encontrados', undefined, { feature: 'kanban' });
      return;
    }

    if (fromStageEntry.stage.id === toStageId) {
      return;
    }

    // Buscar checklist items da etapa de origem
    const stageChecklistItems = checklistItems.filter(
      item => item.etapa_id === fromStageEntry.stage.id
    );

    // Executar movimentação
    await moveLead({
      entry,
      fromStage: fromStageEntry.stage,
      toStage: toStageEntry.stage,
      checklistItems: stageChecklistItems,
      currentEntriesInTargetStage: toStageEntry.entries.length,
      onSuccess: () => {
        onRefresh?.();
      },
      onError: () => {
        onRefresh?.();
      }
    });
  }, [stageEntries, checklistItems, moveLead, isMoving, onRefresh]);

  // Handler para reordenar colunas via drag-and-drop
  const handleColumnDrop = useCallback(async (fromStageId: string, toStageId: string) => {
    const stages = stageEntries.map(s => s.stage);
    const fromStage = stages.find(s => s.id === fromStageId);
    const toStage = stages.find(s => s.id === toStageId);

    if (!fromStage || !toStage) return;

    // Calcular nova ordem
    const sortedStages = [...stages].sort((a, b) => a.ordem - b.ordem);
    const fromIndex = sortedStages.findIndex(s => s.id === fromStageId);
    const toIndex = sortedStages.findIndex(s => s.id === toStageId);

    if (fromIndex === toIndex) return;

    // Reordenar array
    const [moved] = sortedStages.splice(fromIndex, 1);
    sortedStages.splice(toIndex, 0, moved);

    // Criar updates com novas ordens
    const updates = sortedStages.map((stage, index) => ({
      id: stage.id,
      ordem: index + 1
    }));

    try {
      await batchUpdateStages(updates);
      toast({
        title: 'Ordem atualizada',
        description: `"${fromStage.nome}" movido para nova posição`,
      });
      onRefresh?.();
    } catch (error) {
      logger.error('Erro ao reordenar etapas', error as Error, { feature: 'kanban' });
      toast({
        title: 'Erro ao reordenar',
        description: 'Não foi possível alterar a ordem das etapas',
        variant: 'destructive'
      });
    }
  }, [stageEntries, batchUpdateStages, toast, onRefresh]);

  return (
    <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
      {stageEntries.map(({ stage, nextStage, entries, wipExceeded }) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          nextStage={nextStage}
          entries={entries}
          tagsMap={tagsMap}
          wipExceeded={wipExceeded}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          loadingMore={loadingMore}
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
          onUnsubscribeFromPipeline={onUnsubscribeFromPipeline}
          onDropLead={handleDropLead}
          onDragStart={(entryId) => setDraggingEntryId(entryId)}
          onDragEnd={() => setDraggingEntryId(null)}
          onTagsChange={onTagsChange}
          // Drag de colunas
          onColumnDragStart={(stageId) => setDraggingColumnId(stageId)}
          onColumnDragEnd={() => setDraggingColumnId(null)}
          onColumnDrop={handleColumnDrop}
          isColumnDragging={draggingColumnId === stage.id}
        />
      ))}
    </div>
  );
}
