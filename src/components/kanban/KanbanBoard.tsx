import { useState, useCallback, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useSensors, 
  useSensor, 
  PointerSensor, 
  closestCorners,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { useLeadPipelineStore } from '@/stores/leadPipelineStore';

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
  onRegisterInteraction?: (leadId: string) => void;
  onOpenChecklist?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onTransferPipeline?: (leadId: string) => void;
}

/**
 * Novo KanbanBoard simplificado com responsabilidades claras:
 * - Gerencia drag-and-drop
 * - Delega movimentação para useLeadMovement
 * - Refetch após mudanças
 * - Feedback visual
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
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline
}: KanbanBoardProps) {
  const [activeEntry, setActiveEntry] = useState<(LeadPipelineEntry & { lead: Lead }) | null>(null);
  const { moveLead, isMoving } = useLeadMovement();
  const { stages } = useSupabasePipelineStages(selectedPipelineId);
  const { checklistItems } = useSupabaseChecklistItems();
  const { setEntries } = useLeadPipelineStore();

  // ✅ FASE 2: Sincronizar stageEntries com Zustand store
  useEffect(() => {
    const allEntries = stageEntries.flatMap(({ entries }) => entries);
    setEntries(allEntries);
  }, [stageEntries, setEntries]);

  // ✅ FASE 2: Sensores otimizados para @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Previne drag acidental, permite cliques
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const entry = stageEntries
      .flatMap(s => s.entries)
      .find(e => e.id === active.id);
    
    if (entry) {
      setActiveEntry(entry);
      console.log('🎯 [KanbanBoard] Drag iniciado:', entry.lead?.nome);
    }
  }, [stageEntries]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntry(null);

    if (!over || isMoving) {
      console.log('⚠️ [KanbanBoard] Drag cancelado');
      return;
    }

    const activeEntryId = active.id as string;
    const overId = over.id as string;

    console.log('🎯 [KanbanBoard] Drag finalizado:', { activeEntryId, overId });

    // Encontrar entry e stages
    const entry = stageEntries.flatMap(s => s.entries).find(e => e.id === activeEntryId);
    if (!entry) {
      console.error('❌ [KanbanBoard] Entry não encontrada');
      return;
    }

    const currentStageEntry = stageEntries.find(s => s.entries.some(e => e.id === activeEntryId));
    if (!currentStageEntry) {
      console.error('❌ [KanbanBoard] Stage atual não encontrado');
      return;
    }

    const fromStage = currentStageEntry.stage;

    // Determinar stage de destino
    let toStageId = overId;
    const overEntry = stageEntries.find(s => s.entries.some(e => e.id === overId));
    
    if (overEntry) {
      toStageId = overEntry.stage.id;
    }

    if (fromStage.id === toStageId) {
      console.log('⚠️ [KanbanBoard] Mesma etapa, ignorando');
      return;
    }

    const toStageEntry = stageEntries.find(s => s.stage.id === toStageId);
    if (!toStageEntry) {
      console.error('❌ [KanbanBoard] Stage de destino não encontrado');
      return;
    }

    const toStage = toStageEntry.stage;

    // Buscar checklist items da etapa de origem
    const stageChecklistItems = checklistItems.filter(item => item.etapa_id === fromStage.id);

    console.log('🔄 [KanbanBoard] Executando movimentação');

    // Executar movimentação usando hook centralizado
    const result = await moveLead({
      entry,
      fromStage,
      toStage,
      checklistItems: stageChecklistItems,
      currentEntriesInTargetStage: toStageEntry.entries.length,
      onSuccess: () => {
        // ✅ FASE 1: Removido refetch daqui - deixa o pai (Pipelines.tsx) controlar
        // Apenas notifica o pai para atualizar
        onRefresh?.();
      },
      onError: () => {
        // ✅ FASE 1: Removido refetch - o realtime vai sincronizar
        onRefresh?.();
      }
    });

    if (result.success) {
      console.log('✅ [KanbanBoard] Movimentação completa');
    }
  }, [stageEntries, checklistItems, moveLead, onRefresh, isMoving]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      autoScroll={{ threshold: { x: 0.2, y: 0.2 } }}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {stageEntries.map(({ stage, nextStage, entries, wipExceeded }) => (
          <SortableContext
            key={stage.id}
            id={stage.id}
            items={entries.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
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
              onRegisterInteraction={onRegisterInteraction}
              onOpenChecklist={onOpenChecklist}
              onRegressStage={onRegressStage}
              onTransferPipeline={onTransferPipeline}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeEntry && activeEntry.lead && (
          <div className="transform rotate-6 scale-110 shadow-2xl">
            <KanbanCard
              entry={activeEntry}
              lead={activeEntry.lead}
              stage={stageEntries.find(s => s.stage.id === activeEntry.etapa_atual_id)?.stage!}
              isDragging={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
