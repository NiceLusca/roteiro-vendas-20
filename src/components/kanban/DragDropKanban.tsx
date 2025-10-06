import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { DragDropResult, PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';

interface DragDropKanbanProps {
  stageEntries: Array<{
    stage: PipelineStage;
    entries: Array<LeadPipelineEntry & { lead: Lead }>;
    wipExceeded: boolean;
  }>;
  onDragEnd: (result: DragDropResult) => void;
  onAddLead?: (stageId: string) => void;
  onViewLead?: (leadId: string) => void;
  onCreateAppointment?: (leadId: string) => void;
  onAdvanceStage?: (entryId: string) => void;
  onRegisterInteraction?: (leadId: string) => void;
  onOpenChecklist?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onTransferPipeline?: (leadId: string) => void;
}

export function DragDropKanban({
  stageEntries,
  onDragEnd,
  onAddLead,
  onViewLead,
  onCreateAppointment,
  onAdvanceStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline
}: DragDropKanbanProps) {
  const [activeEntry, setActiveEntry] = useState<(LeadPipelineEntry & { lead: Lead }) | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const entry = stageEntries
      .flatMap(s => s.entries)
      .find(e => e.id === active.id);
    
    if (entry) {
      setActiveEntry(entry);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntry(null);

    if (!over) return;

    const activeEntryId = active.id as string;
    const overStageId = over.id as string;

    // Encontrar a entrada e estágio atual
    const currentStageEntry = stageEntries.find(s => 
      s.entries.some(e => e.id === activeEntryId)
    );

    if (!currentStageEntry) return;

    const fromStageId = currentStageEntry.stage.id;
    const toStageId = overStageId;

    // Se moveu para um estágio diferente
    if (fromStageId !== toStageId) {
      onDragEnd({
        fromStage: fromStageId,
        toStage: toStageId,
        entryId: activeEntryId
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {stageEntries.map(({ stage, entries, wipExceeded }) => (
          <SortableContext
            key={stage.id}
            id={stage.id}
            items={entries.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              stage={stage}
              entries={entries}
              wipExceeded={wipExceeded}
              isDragAndDrop={true}
              onAddLead={onAddLead}
              onViewLead={onViewLead}
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