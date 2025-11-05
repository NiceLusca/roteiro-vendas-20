import React, { memo, useMemo, useCallback, DragEvent, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface KanbanColumnProps {
  stage: PipelineStage;
  nextStage?: PipelineStage | null;
  entries: Array<LeadPipelineEntry & { lead: Lead }>;
  wipExceeded: boolean;
  
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
  onDropLead?: (entryId: string, toStageId: string) => void;
  onDragStart?: (entryId: string) => void;
  onDragEnd?: () => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  stage,
  nextStage,
  entries,
  wipExceeded,
  
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
  onDropLead,
  onDragStart,
  onDragEnd
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  // HTML5 Native Drop Handlers
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
    } catch (error) {
      logger.error('Erro ao processar drop', error as Error, {
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

  const getStageColorClass = useCallback((stageName: string): string => {
    const normalized = stageName.toLowerCase();
    if (normalized.includes('entrada')) return 'stage-entrada';
    if (normalized.includes('contato 1')) return 'stage-contato-1';
    if (normalized.includes('contato 2')) return 'stage-contato-2';
    if (normalized.includes('agendou')) return 'stage-agendou';
    if (normalized.includes('fechou')) return 'stage-fechou';
    return 'stage-entrada';
  }, []);

  const stageClass = useMemo(() => getStageColorClass(stage.nome), [stage.nome, getStageColorClass]);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col w-56 min-w-56 flex-shrink-0 transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]"
      )}
    >
      {/* Header da Coluna */}
      <Card className={cn('mb-4 kanban-column-header', stageClass, wipExceeded && 'border-warning')}>
        <CardHeader className="pb-2 px-2 md:px-2 lg:px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">
              {stage.nome}
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddLead?.(stage.id)}
              className="h-6 w-6 p-0"
              title="Adicionar lead nesta etapa"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Contadores */}
          <div className="flex items-center gap-2 text-sm mt-1">
            <span className="text-muted-foreground font-medium">
              {entries.length} {entries.length === 1 ? 'lead' : 'leads'}
            </span>
            
            {stage.wip_limit && wipExceeded && (
              <Badge variant="outline" className="border-warning text-warning text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                WIP excedido
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 space-y-3">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Nenhum lead nesta etapa
            </p>
          </div>
        ) : (
           sortedEntries.map((entry) => {
            // Verificar se o checklist está completo
            const stageChecklistItems = checklistItems.filter(
              item => item.etapa_id === stage.id
            );
            const requiredItems = stageChecklistItems.filter(item => item.obrigatorio);
            const checklistComplete = requiredItems.length === 0; // Por enquanto, assumimos completo
            
            return (
              <KanbanCard
                key={entry.id}
                entry={entry}
                lead={entry.lead}
                stage={stage}
                nextStage={nextStage}
                checklistComplete={checklistComplete}
                onViewLead={() => onViewLead?.(entry.lead.id)}
                onEditLead={() => onEditLead?.(entry.lead.id)}
                onCreateAppointment={() => onCreateAppointment?.(entry.lead.id)}
                onAdvanceStage={() => onAdvanceStage?.(entry.id)}
                onJumpToStage={() => onJumpToStage?.(entry.id)}
                onRegisterInteraction={() => onRegisterInteraction?.(entry.lead.id)}
                onOpenChecklist={() => onOpenChecklist?.(entry.id)}
                onRegressStage={() => onRegressStage?.(entry.id)}
                onTransferPipeline={() => onTransferPipeline?.(entry.lead.id)}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            );
          })
        )}
      </div>
    </div>
  );
});