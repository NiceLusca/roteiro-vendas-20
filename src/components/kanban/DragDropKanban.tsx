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
    nextStage?: PipelineStage | null;
    entries: Array<LeadPipelineEntry & { lead: Lead }>;
    wipExceeded: boolean;
  }>;
  checklistItems?: Array<{ id: string; etapa_id: string; obrigatorio: boolean }>;
  onDragEnd: (result: DragDropResult) => void;
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

export function DragDropKanban({
  stageEntries,
  checklistItems = [],
  onDragEnd,
  onAddLead,
  onViewLead,
  onEditLead,
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
    const overId = over.id as string;

    console.log('🎯 DragDropKanban handleDragEnd:', { activeEntryId, overId });

    // Encontrar a entrada atual
    const currentStageEntry = stageEntries.find(s => 
      s.entries.some(e => e.id === activeEntryId)
    );

    if (!currentStageEntry) {
      console.error('❌ Entry atual não encontrada');
      return;
    }

    const fromStageId = currentStageEntry.stage.id;
    
    // overId pode ser tanto o ID de um estágio (quando solto na área vazia)
    // quanto o ID de outra entry (quando solto sobre outro card)
    // Precisamos descobrir qual é o estágio de destino
    let toStageId = overId;
    
    // Verificar se overId é um entry ID
    const overEntry = stageEntries.find(s => 
      s.entries.some(e => e.id === overId)
    );
    
    if (overEntry) {
      // Se solto sobre outro card, pegar o estágio desse card
      toStageId = overEntry.stage.id;
      console.log('📍 Solto sobre outro card, estágio de destino:', toStageId);
    } else {
      // Se solto na área vazia, overId já é o stageId
      console.log('📍 Solto na área vazia da coluna:', toStageId);
    }

    console.log('📍 Movendo de:', fromStageId, 'para:', toStageId);

    // Se moveu para um estágio diferente
    if (fromStageId !== toStageId) {
      onDragEnd({
        fromStage: fromStageId,
        toStage: toStageId,
        entryId: activeEntryId
      });
    } else {
      console.log('⚠️ Mesmo estágio, ignorando movimento');
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
              isDragAndDrop={true}
              checklistItems={checklistItems}
              onAddLead={onAddLead}
              onViewLead={onViewLead}
              onEditLead={onEditLead}
              onCreateAppointment={onCreateAppointment}
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