import React, { memo, useMemo, useCallback, DragEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { KanbanCard } from './KanbanCard';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { LeadTag } from '@/types/bulkImport';
import { AlertTriangle, Loader2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface KanbanColumnProps {
  stage: PipelineStage;
  nextStage?: PipelineStage | null;
  entries: Array<LeadPipelineEntry & { lead: Lead }>;
  tagsMap?: Record<string, LeadTag[]>;
  wipExceeded: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  
  checklistItems?: Array<{ id: string; etapa_id: string; obrigatorio: boolean }>;
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
  onDropLead?: (entryId: string, toStageId: string) => void;
  onDragStart?: (entryId: string) => void;
  onDragEnd?: () => void;
  onTagsChange?: () => void;
  // Drag de colunas
  onColumnDragStart?: (stageId: string) => void;
  onColumnDragEnd?: () => void;
  onColumnDrop?: (stageId: string, targetStageId: string) => void;
  isColumnDragging?: boolean;
}

export const KanbanColumn = memo(function KanbanColumn({
  stage,
  nextStage,
  entries,
  tagsMap = {},
  wipExceeded,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  
  checklistItems = [],
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
  onDropLead,
  onDragStart,
  onDragEnd,
  onTagsChange,
  // Drag de colunas
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDrop,
  isColumnDragging = false
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const [isColumnOver, setIsColumnOver] = useState(false);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);

  // HTML5 Native Drop Handlers para cards
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // CRUCIAL para permitir drop
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { entryId, fromStageId } = data;

      if (fromStageId === stage.id) {
        return;
      }

      await onDropLead?.(entryId, stage.id);
    } catch {
      // Pode ser drop de coluna, não de card - ignorar
      logger.debug('Drop não é de card, possivelmente coluna', {
        feature: 'kanban-column'
      });
    }
  };

  const healthCounts = useMemo(() => {
    return entries.reduce((acc, entry) => {
      acc[entry.saude_etapa] = (acc[entry.saude_etapa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const scoreA = a.lead?.lead_score ?? null;
      const scoreB = b.lead?.lead_score ?? null;
      
      // 1️⃣ Se ambos têm score: ordenar por score (decrescente - maior primeiro)
      if (scoreA !== null && scoreB !== null) {
        return scoreB - scoreA;
      }
      
      // 2️⃣ Se apenas A tem score: A vem primeiro
      if (scoreA !== null && scoreB === null) {
        return -1;
      }
      
      // 3️⃣ Se apenas B tem score: B vem primeiro
      if (scoreA === null && scoreB !== null) {
        return 1;
      }
      
      // 4️⃣ Se nenhum tem score: ordenar por data (mais antigos primeiro)
      const dateA = new Date(a.data_entrada_etapa || a.created_at).getTime();
      const dateB = new Date(b.data_entrada_etapa || b.created_at).getTime();
      return dateA - dateB;
    });
  }, [entries]);

  // Handlers para arrastar colunas pelo header
  const handleColumnDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingColumn(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('column/json', JSON.stringify({
      stageId: stage.id,
      stageName: stage.nome,
      ordem: stage.ordem
    }));
    onColumnDragStart?.(stage.id);
  }, [stage.id, stage.nome, stage.ordem, onColumnDragStart]);

  const handleColumnDragEnd = useCallback(() => {
    setIsDraggingColumn(false);
    onColumnDragEnd?.();
  }, [onColumnDragEnd]);

  const handleColumnDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Só aceita se for drop de coluna
    if (e.dataTransfer.types.includes('column/json')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsColumnOver(true);
    }
  }, []);

  const handleColumnDragLeave = useCallback(() => {
    setIsColumnOver(false);
  }, []);

  const handleColumnDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsColumnOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('column/json'));
      const { stageId: fromStageId } = data;

      if (fromStageId === stage.id) {
        return;
      }

      onColumnDrop?.(fromStageId, stage.id);
    } catch {
      // Não é drop de coluna
    }
  }, [stage.id, onColumnDrop]);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col w-56 min-w-56 flex-shrink-0 transition-all duration-200 rounded-lg",
        "bg-[hsl(var(--kanban-column-bg))]",
        isOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]",
        isDraggingColumn && "opacity-50 scale-95",
        isColumnOver && "ring-2 ring-accent/70 bg-accent/10"
      )}
    >
      {/* Header da Coluna */}
      <div 
        className={cn(
          "mb-3 cursor-grab active:cursor-grabbing select-none",
          wipExceeded && "ring-1 ring-warning/50 rounded-lg"
        )}
        draggable={true}
        onDragStart={handleColumnDragStart}
        onDragEnd={handleColumnDragEnd}
        onDragOver={handleColumnDragOver}
        onDragLeave={handleColumnDragLeave}
        onDrop={handleColumnDrop}
      >
        {/* Linha sutil separadora */}
        <div className="h-1 rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/60 mb-2" />
        
        {/* Título e contador */}
        <div className="flex items-start justify-between px-1 py-1">
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 min-h-[2.5rem] leading-5 cursor-default">
                  {stage.nome}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[200px] z-[60]">
                {stage.nome}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
              {entries.length}
            </span>
            {stage.wip_limit && wipExceeded && (
              <Badge variant="outline" className="border-warning text-warning text-[10px] px-1.5 py-0 h-5">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                WIP
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content com scroll nativo */}
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {sortedEntries.length > 0 && (
          <div className="space-y-3">
            {sortedEntries.map((entry) => {
              const stageChecklistItems = checklistItems.filter(
                item => item.etapa_id === stage.id
              );
              const requiredItems = stageChecklistItems.filter(item => item.obrigatorio);
              const checklistComplete = requiredItems.length === 0;
              
              return (
                <KanbanCard
                  key={entry.id}
                  entry={entry}
                  lead={entry.lead}
                  stage={stage}
                  nextStage={nextStage}
                  checklistComplete={checklistComplete}
                  nextAppointment={(entry as any).nextAppointment}
                  responsibles={(entry as any).responsibles || []}
                  tags={tagsMap[entry.lead_id] || []}
                  onViewLead={() => onViewLead?.(entry.lead.id)}
                  onEditLead={() => onEditLead?.(entry.lead.id)}
                  onCreateAppointment={() => onCreateAppointment?.(entry.lead.id)}
                  onAdvanceStage={() => onAdvanceStage?.(entry.id)}
                  onJumpToStage={() => onJumpToStage?.(entry.id)}
                  onRegisterInteraction={() => onRegisterInteraction?.(entry.lead.id)}
                  onOpenChecklist={() => onOpenChecklist?.(entry.id)}
                  onRegressStage={() => onRegressStage?.(entry.id)}
                  onTransferPipeline={() => onTransferPipeline?.(entry.lead.id)}
                  onUnsubscribeFromPipeline={() => onUnsubscribeFromPipeline?.(entry.id, entry.lead.id)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onTagsChange={onTagsChange}
                />
              );
            })}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mais'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});