import { useState, useCallback, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanStageGroupHeader, KanbanCollapsedGroup, KanbanGroupColorBar } from './KanbanStageGroup';
import { AppointmentSelectorDialog, AppointmentOption } from './AppointmentSelectorDialog';
import { useLeadMovement } from '@/hooks/useLeadMovement';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { validateAppointmentRequirement } from '@/lib/appointmentValidator';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { PipelineDisplayConfig, DealDisplayInfo, AppointmentDisplayInfo } from '@/types/pipelineDisplay';
import { LeadTag } from '@/types/bulkImport';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

export type SortOption = 'chronological' | 'alphabetical' | 'delay' | 'score';

const COLLAPSED_STORAGE_KEY_PREFIX = 'kanban-collapsed-groups-';

// Helper to get/set collapsed groups from localStorage
const getCollapsedGroups = (pipelineId: string): string[] => {
  try {
    const saved = localStorage.getItem(`${COLLAPSED_STORAGE_KEY_PREFIX}${pipelineId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const setCollapsedGroups = (pipelineId: string, groups: string[]) => {
  try {
    localStorage.setItem(`${COLLAPSED_STORAGE_KEY_PREFIX}${pipelineId}`, JSON.stringify(groups));
  } catch {
    // Ignore localStorage errors
  }
};

// Helper to detect fragmented groups (non-consecutive stages)
const detectFragmentation = (stageOrders: number[]): { isFragmented: boolean; ranges: string } => {
  if (stageOrders.length <= 1) return { isFragmented: false, ranges: '' };
  
  const sorted = [...stageOrders].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
  
  const isFragmented = ranges.length > 1;
  return { isFragmented, ranges: ranges.join(', ') };
};

interface KanbanBoardProps {
  selectedPipelineId: string;
  stageEntries: Array<{
    stage: PipelineStage;
    nextStage?: PipelineStage | null;
    entries: Array<LeadPipelineEntry & { lead: Lead }>;
    wipExceeded: boolean;
  }>;
  tagsMap?: Record<string, LeadTag[]>;
  sortBy?: SortOption;
  displayConfig?: PipelineDisplayConfig | null;
  dealsByLeadId?: Record<string, DealDisplayInfo>;
  appointmentsByLeadId?: Record<string, AppointmentDisplayInfo>;
  slaAppointmentsById?: Record<string, { id: string; data_hora: string; start_at?: string }>;
  onRefresh?: () => void;
  onTagsChange?: () => void;
  onAddLead?: (stageId: string) => void;
  onViewLead?: (leadId: string) => void;
  onEditLead?: (leadId: string, options?: { initialTab?: string }) => void;
  onCreateAppointment?: (leadId: string) => void;
  onManageDeal?: (leadId: string) => void;
  onAdvanceStage?: (entryId: string) => void;
  onJumpToStage?: (entryId: string) => void;
  onRegisterInteraction?: (leadId: string) => void;
  onOpenChecklist?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onTransferPipeline?: (leadId: string) => void;
  onUnsubscribeFromPipeline?: (entryId: string, leadId: string) => void;
  onPendingMoveForNewAppointment?: (data: { entryId: string; leadId: string; toStageId: string }) => void;
  onMoveSuccess?: (data: { entryId: string; fromStageId: string; toStageId: string; leadName: string }) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

/**
 * KanbanBoard com suporte a grupos não-consecutivos:
 * - Expandido: colunas na ordem natural do pipeline
 * - Colapsado: todas as etapas do grupo se agregam em um único card
 */
export function KanbanBoard({
  selectedPipelineId,
  stageEntries,
  tagsMap = {},
  sortBy = 'chronological',
  displayConfig,
  dealsByLeadId = {},
  appointmentsByLeadId = {},
  slaAppointmentsById = {},
  onRefresh,
  onTagsChange,
  onAddLead,
  onViewLead,
  onEditLead,
  onCreateAppointment,
  onManageDeal,
  onAdvanceStage,
  onJumpToStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline,
  onUnsubscribeFromPipeline,
  onPendingMoveForNewAppointment,
  onMoveSuccess,
  hasMore,
  onLoadMore,
  loadingMore
}: KanbanBoardProps) {
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroupsState] = useState<string[]>(() => 
    getCollapsedGroups(selectedPipelineId)
  );
  
  // Estado para seleção de agendamento
  const [appointmentSelectorState, setAppointmentSelectorState] = useState<{
    open: boolean;
    appointments: AppointmentOption[];
    entryId: string;
    leadName: string;
    stageName: string;
    pendingMove: {
      entry: LeadPipelineEntry & { lead: Lead };
      fromStage: PipelineStage;
      toStage: PipelineStage;
      checklistItems: any[];
      currentEntriesInTargetStage: number;
    } | null;
  }>({
    open: false,
    appointments: [],
    entryId: '',
    leadName: '',
    stageName: '',
    pendingMove: null
  });
  const [isMovingWithAppointment, setIsMovingWithAppointment] = useState(false);

  const { moveLead, isMoving } = useLeadMovement();
  const { checklistItems } = useSupabaseChecklistItems();
  const { batchUpdateStages } = useSupabasePipelineStages(selectedPipelineId);
  const { toast } = useToast();

  // Toggle group collapse
  const toggleGroupCollapse = useCallback((groupName: string) => {
    setCollapsedGroupsState(prev => {
      const newState = prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName];
      setCollapsedGroups(selectedPipelineId, newState);
      return newState;
    });
  }, [selectedPipelineId]);

  const handleDropLead = useCallback(async (entryId: string, toStageId: string) => {
    logger.debug('handleDropLead', {
      feature: 'kanban',
      metadata: { entryId, toStageId }
    });

    if (isMoving || isMovingWithAppointment) {
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

    const stageChecklistItems = checklistItems.filter(
      item => item.etapa_id === fromStageEntry.stage.id
    );

    // Verificar se a etapa de destino requer agendamento
    if (toStageEntry.stage.requer_agendamento) {
      logger.debug('Etapa requer agendamento, validando...', { feature: 'kanban' });
      
      const validation = await validateAppointmentRequirement(entry.lead_id, toStageEntry.stage);
      
      if (!validation.valid) {
        // Sem agendamentos - abrir dialog do lead na aba de agenda
        toast({
          title: 'Agendamento necessário',
          description: validation.message || 'Defina um agendamento para mover para esta etapa',
          variant: 'destructive',
          duration: 5000
        });
        
        // Abrir o dialog de edição do lead na aba agenda
        if (onEditLead) {
          onEditLead(entry.lead_id, { initialTab: 'appointments' });
        }
        return;
      }
      
      if (validation.requiresSelection) {
        // Múltiplos agendamentos - abrir seletor
        setAppointmentSelectorState({
          open: true,
          appointments: validation.appointments,
          entryId,
          leadName: entry.lead?.nome || 'Lead',
          stageName: toStageEntry.stage.nome,
          pendingMove: {
            entry,
            fromStage: fromStageEntry.stage,
            toStage: toStageEntry.stage,
            checklistItems: stageChecklistItems,
            currentEntriesInTargetStage: toStageEntry.entries.length
          }
        });
        return;
      }
      
      // 1 agendamento - mover com vínculo automático
      const result = await moveLead({
        entry,
        fromStage: fromStageEntry.stage,
        toStage: toStageEntry.stage,
        checklistItems: stageChecklistItems,
        currentEntriesInTargetStage: toStageEntry.entries.length,
        appointmentSlaId: validation.appointments[0]?.id,
        onSuccess: () => {
          onRefresh?.();
        },
        onError: () => {
          onRefresh?.();
        }
      });
      if (result.success && result.previousStageId) {
        onMoveSuccess?.({
          entryId: entry.id,
          fromStageId: result.previousStageId,
          toStageId: toStageEntry.stage.id,
          leadName: entry.lead?.nome || 'Lead'
        });
      }
      return;
    }

    // Movimento normal sem requisito de agendamento
    const result = await moveLead({
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
    if (result.success && result.previousStageId) {
      onMoveSuccess?.({
        entryId: entry.id,
        fromStageId: result.previousStageId,
        toStageId: toStageEntry.stage.id,
        leadName: entry.lead?.nome || 'Lead'
      });
    }
  }, [stageEntries, checklistItems, moveLead, isMoving, isMovingWithAppointment, onRefresh, onEditLead, toast, onMoveSuccess]);

  // Handler para confirmar seleção de agendamento
  const handleAppointmentSelected = useCallback(async (appointmentId: string) => {
    const { pendingMove, entryId } = appointmentSelectorState;
    
    if (!pendingMove) return;
    
    setIsMovingWithAppointment(true);
    
    try {
      const result = await moveLead({
        entry: pendingMove.entry,
        fromStage: pendingMove.fromStage,
        toStage: pendingMove.toStage,
        checklistItems: pendingMove.checklistItems,
        currentEntriesInTargetStage: pendingMove.currentEntriesInTargetStage,
        appointmentSlaId: appointmentId,
        onSuccess: () => {
          onRefresh?.();
        },
        onError: () => {
          onRefresh?.();
        }
      });
      if (result.success && result.previousStageId) {
        onMoveSuccess?.({
          entryId: pendingMove.entry.id,
          fromStageId: result.previousStageId,
          toStageId: pendingMove.toStage.id,
          leadName: pendingMove.entry.lead?.nome || 'Lead'
        });
      }
    } finally {
      setIsMovingWithAppointment(false);
      setAppointmentSelectorState(prev => ({ ...prev, open: false, pendingMove: null }));
    }
  }, [appointmentSelectorState, moveLead, onRefresh, onMoveSuccess]);

  const handleAppointmentSelectorCancel = useCallback(() => {
    setAppointmentSelectorState(prev => ({ ...prev, open: false, pendingMove: null }));
  }, []);

  const handleColumnDrop = useCallback(async (fromStageId: string, toStageId: string) => {
    const stages = stageEntries.map(s => s.stage);
    const fromStage = stages.find(s => s.id === fromStageId);
    const toStage = stages.find(s => s.id === toStageId);

    if (!fromStage || !toStage) return;

    const sortedStages = [...stages].sort((a, b) => a.ordem - b.ordem);
    const fromIndex = sortedStages.findIndex(s => s.id === fromStageId);
    const toIndex = sortedStages.findIndex(s => s.id === toStageId);

    if (fromIndex === toIndex) return;

    const [moved] = sortedStages.splice(fromIndex, 1);
    sortedStages.splice(toIndex, 0, moved);

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

  // Build render data based on collapse state
  const renderData = useMemo(() => {
    // Get all unique group names and their info
    const groupInfo = new Map<string, {
      color: string | null;
      stageOrders: number[];
      entries: typeof stageEntries;
      stageNames: string[];
    }>();
    
    stageEntries.forEach(entry => {
      const groupName = entry.stage.grupo;
      if (groupName) {
        const existing = groupInfo.get(groupName);
        if (existing) {
          existing.stageOrders.push(entry.stage.ordem);
          existing.entries.push(entry);
          existing.stageNames.push(entry.stage.nome);
        } else {
          groupInfo.set(groupName, {
            color: entry.stage.cor_grupo || null,
            stageOrders: [entry.stage.ordem],
            entries: [entry],
            stageNames: [entry.stage.nome]
          });
        }
      }
    });

    // Build render items: column (normal or grouped) and collapsed-group
    type RenderItem = 
      | { type: 'column'; entry: typeof stageEntries[0]; groupName?: string }
      | { type: 'collapsed-group'; groupName: string; color: string | null; totalLeads: number; stageCount: number; stageNames: string[] };
    
    const items: RenderItem[] = [];
    const processedCollapsedGroups = new Set<string>();
    
    stageEntries.forEach((entry) => {
      const groupName = entry.stage.grupo;
      
      if (!groupName) {
        // Stage without group - render normally
        items.push({ type: 'column', entry });
      } else if (collapsedGroups.includes(groupName)) {
        // Group is collapsed - add collapsed card only once
        if (!processedCollapsedGroups.has(groupName)) {
          const info = groupInfo.get(groupName)!;
          const totalLeads = info.entries.reduce((sum, e) => sum + e.entries.length, 0);
          items.push({
            type: 'collapsed-group',
            groupName,
            color: info.color,
            totalLeads,
            stageCount: info.entries.length,
            stageNames: info.stageNames
          });
          processedCollapsedGroups.add(groupName);
        }
        // Skip individual columns for collapsed groups
      } else {
        // Group is expanded - render as normal column in natural position!
        items.push({ type: 'column', entry, groupName });
      }
    });
    
    return { items, groupInfo };
  }, [stageEntries, collapsedGroups]);

  // Props comuns para KanbanColumn
  const getColumnProps = (stageEntry: typeof stageEntries[0]) => ({
    stage: stageEntry.stage,
    nextStage: stageEntry.nextStage,
    entries: stageEntry.entries,
    tagsMap,
    sortBy,
    wipExceeded: stageEntry.wipExceeded,
    displayConfig,
    dealsByLeadId,
    appointmentsByLeadId,
    slaAppointmentsById,
    hasMore,
    onLoadMore,
    loadingMore,
    checklistItems,
    onAddLead,
    onViewLead,
    onEditLead,
    onCreateAppointment,
    onManageDeal,
    onAdvanceStage,
    onJumpToStage,
    onRegisterInteraction,
    onOpenChecklist,
    onRegressStage,
    onTransferPipeline,
    onUnsubscribeFromPipeline,
    onDropLead: handleDropLead,
    onDragStart: (entryId: string) => setDraggingEntryId(entryId),
    onDragEnd: () => setDraggingEntryId(null),
    onTagsChange,
    onColumnDragStart: (stageId: string) => setDraggingColumnId(stageId),
    onColumnDragEnd: () => setDraggingColumnId(null),
    onColumnDrop: handleColumnDrop,
    isColumnDragging: draggingColumnId === stageEntry.stage.id
  });

  return (
    <>
      <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {renderData.items.map((item) => {
          if (item.type === 'collapsed-group') {
            return (
              <KanbanCollapsedGroup
                key={`collapsed-${item.groupName}`}
                groupName={item.groupName}
                groupColor={item.color}
                totalLeads={item.totalLeads}
                stageCount={item.stageCount}
                stageNames={item.stageNames}
                onToggleCollapse={() => toggleGroupCollapse(item.groupName)}
              />
            );
          }
          
          // Column (with or without group) - renders in natural position
          return (
            <KanbanColumn 
              key={item.entry.stage.id} 
              {...getColumnProps(item.entry)}
              groupName={item.groupName}
              onToggleGroupCollapse={item.groupName ? () => toggleGroupCollapse(item.groupName!) : undefined}
            />
          );
        })}
      </div>
      
      {/* Dialog para seleção de agendamento quando há múltiplos */}
      <AppointmentSelectorDialog
        open={appointmentSelectorState.open}
        onOpenChange={(open) => setAppointmentSelectorState(prev => ({ ...prev, open }))}
        appointments={appointmentSelectorState.appointments}
        stageName={appointmentSelectorState.stageName}
        leadName={appointmentSelectorState.leadName}
        onConfirm={handleAppointmentSelected}
        onCancel={handleAppointmentSelectorCancel}
        onCreateNew={() => {
          const { pendingMove } = appointmentSelectorState;
          if (pendingMove) {
            // Notificar o pai (Pipelines.tsx) sobre a movimentação pendente
            onPendingMoveForNewAppointment?.({
              entryId: appointmentSelectorState.entryId,
              leadId: pendingMove.entry.lead_id,
              toStageId: pendingMove.toStage.id
            });
          }
          setAppointmentSelectorState(prev => ({ ...prev, open: false, pendingMove: null }));
          if (onEditLead && pendingMove?.entry.lead_id) {
            onEditLead(pendingMove.entry.lead_id, { initialTab: 'appointments' });
          }
        }}
        isLoading={isMovingWithAppointment}
      />
    </>
  );
}
