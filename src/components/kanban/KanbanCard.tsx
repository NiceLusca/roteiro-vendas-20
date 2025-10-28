import { memo, useCallback, useMemo, DragEvent, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead, LeadPipelineEntry, PipelineStage } from '@/types/crm';
import { formatWhatsApp } from '@/utils/formatters';
import { Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanCardMenu } from './KanbanCardMenu';
import { AppointmentBadge } from '@/components/notifications/AppointmentBadge';
import { getCloserColor, getCloserBorderColor } from '@/utils/closerColors';

interface AppointmentInfo {
  id: string;
  start_at: string;
  status: string;
  titulo?: string;
  tipo_sessao?: string;
  closer_responsavel?: string;
}

interface KanbanCardProps {
  entry: LeadPipelineEntry;
  lead: Lead | null | undefined;
  stage: PipelineStage;
  nextStage?: PipelineStage | null;
  checklistComplete?: boolean;
  nextAppointment?: AppointmentInfo | null;
  isDragging?: boolean;
  onViewLead?: () => void;
  onEditLead?: () => void;
  onCreateAppointment?: () => void;
  onAdvanceStage?: () => void;
  onJumpToStage?: () => void;
  onRegisterInteraction?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onTransferPipeline?: () => void;
  onDragStart?: (entryId: string) => void;
  onDragEnd?: () => void;
}

// ✅ SOLUÇÃO 3: Custom comparator para evitar re-renders desnecessários
export const KanbanCard = memo(function KanbanCard({
  entry,
  lead,
  stage,
  nextStage,
  checklistComplete = true,
  nextAppointment,
  isDragging = false,
  onViewLead,
  onEditLead,
  onCreateAppointment,
  onAdvanceStage,
  onJumpToStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline,
  onDragStart,
  onDragEnd
}: KanbanCardProps) {
  const [isLocalDragging, setIsLocalDragging] = useState(false);

  // Early return if lead is not loaded yet
  if (!lead) {
    return (
      <Card className="kanban-card opacity-50">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // HTML5 Native Drag Handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    setIsLocalDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      entryId: entry.id,
      fromStageId: entry.etapa_atual_id,
      leadName: lead?.nome
    }));
    onDragStart?.(entry.id);
  };

  const handleDragEnd = () => {
    setIsLocalDragging(false);
    onDragEnd?.();
  };

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

  const daysInStage = useMemo(() => {
    if (!entry.data_entrada_etapa) return 0;
    return Math.floor((Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24));
  }, [entry.data_entrada_etapa]);


  return (
    <Card 
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "kanban-card kanban-card-stage group cursor-grab active:cursor-grabbing border-l-4",
        stageClass,
        lead.closer && "border-r-4",
        (isLocalDragging || isDragging) && "opacity-50 rotate-1 scale-105 shadow-xl z-50"
      )}
      style={{
        ...(lead.closer && {
          borderRightColor: getCloserBorderColor(lead.closer)
        })
      }}
    >
      <CardContent className="p-3">
        {/* Header compacto com menu */}
        <div className="flex items-start justify-between mb-2">
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onEditLead?.();
            }}
          >
            <h4 className="font-semibold text-base text-foreground truncate mb-0.5">
              {lead.nome}
            </h4>
            <p className="text-xs text-muted-foreground">
              {lead.segmento} • {lead.origem}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-bold text-xs px-2">
              {lead.lead_score}
            </Badge>
            {lead.closer && (
              <Badge className={cn('text-xs px-2 py-0.5 font-semibold', getCloserColor(lead.closer))}>
                {lead.closer}
              </Badge>
            )}
            <div 
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
            >
              <KanbanCardMenu
                hasNextStage={!!nextStage}
                showMessageAction={stage.proximo_passo_tipo === 'Mensagem'}
                onViewLead={onViewLead}
                onOpenChecklist={onOpenChecklist}
                onRegressStage={onRegressStage}
                onAdvanceStage={onAdvanceStage}
                onJumpToStage={onJumpToStage}
                onTransferPipeline={onTransferPipeline}
                onCreateAppointment={onCreateAppointment}
                onRegisterInteraction={onRegisterInteraction}
              />
            </div>
          </div>
        </div>

        {/* Telefone */}
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{formatWhatsApp(lead.whatsapp)}</span>
        </div>

        {/* Próximo Agendamento */}
        {nextAppointment && (
          <div className="mb-2">
            <AppointmentBadge 
              startAt={nextAppointment.start_at}
              title={nextAppointment.titulo}
              compact
            />
          </div>
        )}

        {/* Próximo passo em 1 linha */}
        <div className="flex items-center justify-between text-xs mb-3 py-1.5 px-2 bg-muted/30 rounded">
          <span className="text-muted-foreground truncate">
            {stage.proximo_passo_tipo} • {daysInStage}d
          </span>
        </div>

        {/* Botão de Avançar */}
        {nextStage && (
          <Button
            size="lg"
            className={cn(
              "w-full h-10 text-sm font-semibold gap-2",
              checklistComplete
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            disabled={!checklistComplete}
            onClick={(e) => {
              e.stopPropagation();
              if (checklistComplete) {
                onAdvanceStage?.();
              }
            }}
          >
            {checklistComplete ? (
              <>
                <span className="truncate">▶ {nextStage.nome}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Checklist incompleto</span>
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparator - só re-renderiza se houver mudanças relevantes
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.updated_at === nextProps.entry.updated_at &&
    prevProps.lead?.id === nextProps.lead?.id &&
    prevProps.lead?.nome === nextProps.lead?.nome &&
    prevProps.stage.id === nextProps.stage.id &&
    prevProps.checklistComplete === nextProps.checklistComplete &&
    prevProps.isDragging === nextProps.isDragging &&
    // ✅ SOLUÇÃO 3: Comparação profunda de nextAppointment
    prevProps.nextAppointment?.id === nextProps.nextAppointment?.id &&
    prevProps.nextAppointment?.start_at === nextProps.nextAppointment?.start_at &&
    prevProps.nextAppointment?.status === nextProps.nextAppointment?.status
  );
});