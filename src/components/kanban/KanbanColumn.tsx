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
  entries: Array<LeadPipelineEntry & { lead: Lead }>;
  wipExceeded: boolean;
  isDragAndDrop?: boolean;
  onAddLead?: (stageId: string) => void;
  onViewLead?: (leadId: string) => void;
  onCreateAppointment?: (leadId: string) => void;
  onAdvanceStage?: (entryId: string) => void;
  onRegisterInteraction?: (leadId: string) => void;
  onOpenChecklist?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onTransferPipeline?: (leadId: string) => void;
}

export function KanbanColumn({
  stage,
  entries,
  wipExceeded,
  isDragAndDrop = false,
  onAddLead,
  onViewLead,
  onCreateAppointment,
  onAdvanceStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline
}: KanbanColumnProps) {
  // Contar leads por saúde
  const healthCounts = entries.reduce((acc, entry) => {
    acc[entry.saude_etapa] = (acc[entry.saude_etapa] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const atrasados = entries.filter(e => e.dias_em_atraso > 0).length;

  // Ordenar por prioridade: atrasados primeiro, depois por score
  const sortedEntries = [...entries].sort((a, b) => {
    // Primeiro critério: dias em atraso (descendente)
    if (a.dias_em_atraso !== b.dias_em_atraso) {
      return b.dias_em_atraso - a.dias_em_atraso;
    }
    
    // Segundo critério: lead score (descendente)
    return b.lead.lead_score - a.lead.lead_score;
  });

  return (
    <div className="flex flex-col h-full min-w-80">
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
            
            {atrasados > 0 && (
              <Badge variant="destructive">
                {atrasados} atrasados
              </Badge>
            )}
            
            {stage.wip_limit && wipExceeded && (
              <Badge variant="outline" className="border-warning text-warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                WIP excedido
              </Badge>
            )}
          </div>

          {/* SLA da Etapa */}
          <div className="text-xs text-muted-foreground">
            SLA: {stage.prazo_em_dias} dias
            {stage.wip_limit && (
              <span className="ml-2">• WIP: {stage.wip_limit}</span>
            )}
          </div>

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
           sortedEntries.map((entry) => (
            <KanbanCard
              key={entry.id}
              entry={entry}
              lead={entry.lead}
              stage={stage}
              onViewLead={() => onViewLead?.(entry.lead.id)}
              onCreateAppointment={() => onCreateAppointment?.(entry.lead.id)}
              onAdvanceStage={() => onAdvanceStage?.(entry.id)}
              onRegisterInteraction={() => onRegisterInteraction?.(entry.lead.id)}
              onOpenChecklist={() => onOpenChecklist?.(entry.id)}
              onRegressStage={() => onRegressStage?.(entry.id)}
              onTransferPipeline={() => onTransferPipeline?.(entry.lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}