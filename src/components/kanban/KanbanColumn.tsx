import { memo, useMemo, DragEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageTemplatesButton } from '@/components/pipeline/StageTemplatesButton';
import { StageAnalyticsButton } from '@/components/pipeline/StageAnalyticsButton';
import { Button } from '@/components/ui/button';
import { KanbanCard } from './KanbanCard';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        console.log('⚠️ Mesma etapa, ignorando drop');
        return;
      }

      console.log('📍 Drop recebido:', { entryId, toStageId: stage.id });
      await onDropLead?.(entryId, stage.id);
    } catch (error) {
      console.error('❌ Erro ao processar drop:', error);
    }
  };

  // ✅ FASE 2: Memoizar computações pesadas
  const healthCounts = useMemo(() => {
    return entries.reduce((acc, entry) => {
      acc[entry.saude_etapa] = (acc[entry.saude_etapa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      return (b.lead.lead_score || 0) - (a.lead.lead_score || 0);
    });
  }, [entries]);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col h-full min-w-80 transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]"
      )}
    >
      {/* Header da Coluna */}
      <Card className={cn('mb-4', wipExceeded && 'border-warning')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
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
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">
              {entries.length} leads
            </Badge>
            
            {stage.wip_limit && wipExceeded && (
              <Badge variant="outline" className="border-warning text-warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                WIP excedido
              </Badge>
            )}
          </div>

          {/* WIP Limit */}
          {stage.wip_limit && (
            <div className="text-xs text-muted-foreground">
              WIP Limit: {stage.wip_limit}
            </div>
          )}

          {/* Indicadores de Saúde */}
          {entries.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              {healthCounts.Verde && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">
                    {healthCounts.Verde}
                  </span>
                </div>
              )}
              {healthCounts.Amarelo && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-xs text-muted-foreground">
                    {healthCounts.Amarelo}
                  </span>
                </div>
              )}
              {healthCounts.Vermelho && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-danger" />
                  <span className="text-xs text-muted-foreground">
                    {healthCounts.Vermelho}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Analytics & Templates Integration */}
          <div className="flex items-center gap-1 pt-2">
            <StageTemplatesButton
              stageId={stage.id}
              stageName={stage.nome}
              templateCount={2}
              compact
            />
            <StageAnalyticsButton
              stageId={stage.id}
              stageName={stage.nome}
              pipelineId="pipeline-id"
              compact
            />
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 space-y-3 overflow-y-auto">
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