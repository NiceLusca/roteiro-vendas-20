import { memo, useCallback, useMemo, DragEvent, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lead, LeadPipelineEntry, PipelineStage } from '@/types/crm';
import { PipelineDisplayConfig, DealDisplayInfo, AppointmentDisplayInfo } from '@/types/pipelineDisplay';
import { ArrowRight, AlertCircle, AlertTriangle, Clock, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanCardMenu } from './KanbanCardMenu';
import { AppointmentBadge } from '@/components/notifications/AppointmentBadge';
import { TagPopover } from './TagPopover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LeadResponsible } from '@/hooks/useLeadResponsibles';
import type { LeadTag } from '@/types/bulkImport';

interface AppointmentInfo {
  id: string;
  start_at: string;
  status: string;
  titulo?: string;
  tipo_sessao?: string;
  closer_responsavel?: string;
}

interface SlaAppointmentData {
  id: string;
  data_hora: string;
  start_at?: string;
}

interface KanbanCardProps {
  entry: LeadPipelineEntry;
  lead: Lead | null | undefined;
  stage: PipelineStage;
  nextStage?: PipelineStage | null;
  checklistComplete?: boolean;
  nextAppointment?: AppointmentInfo | null;
  responsibles?: LeadResponsible[];
  tags?: LeadTag[];
  isDragging?: boolean;
  displayConfig?: PipelineDisplayConfig | null;
  dealInfo?: DealDisplayInfo | null;
  appointmentInfo?: AppointmentDisplayInfo | null;
  slaAppointment?: SlaAppointmentData | null; // Agendamento vinculado ao SLA
  onViewLead?: () => void;
  onEditLead?: () => void;
  onCreateAppointment?: () => void;
  onAdvanceStage?: () => void;
  onJumpToStage?: () => void;
  onRegisterInteraction?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onTransferPipeline?: () => void;
  onUnsubscribeFromPipeline?: () => void;
  onManageDeal?: () => void;
  onDragStart?: (entryId: string) => void;
  onDragEnd?: () => void;
  onTagsChange?: () => void;
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// ✅ Custom comparator para evitar re-renders desnecessários
export const KanbanCard = memo(function KanbanCard({
  entry,
  lead,
  stage,
  nextStage,
  checklistComplete = true,
  nextAppointment,
  responsibles = [],
  tags = [],
  isDragging = false,
  displayConfig,
  dealInfo,
  appointmentInfo,
  slaAppointment,
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
  onManageDeal,
  onDragStart,
  onDragEnd,
  onTagsChange
}: KanbanCardProps) {
  const [isLocalDragging, setIsLocalDragging] = useState(false);

  // All hooks must be called before any conditional returns
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

  const handleCardClick = useCallback(() => {
    if (isLocalDragging) return;
    onEditLead?.();
  }, [isLocalDragging, onEditLead]);

  // Check which fields to show
  const cardFields = displayConfig?.card_fields || ['nome', 'origem', 'tags', 'responsavel', 'sla'];
  const showValorDeal = cardFields.includes('valor_deal') && dealInfo;
  const showValorRecorrente = cardFields.includes('valor_recorrente') && dealInfo?.valor_recorrente;
  const showDataSessao = cardFields.includes('data_sessao') && appointmentInfo;
  const showCloser = cardFields.includes('closer') && lead?.closer;
  const showTags = cardFields.includes('tags');
  const showResponsavel = cardFields.includes('responsavel');
  const showOrigem = cardFields.includes('origem');

  // Calcular data base do SLA (entrada na etapa ou agendamento vinculado)
  // IMPORTANTE: Este useMemo precisa estar antes do early return
  const slaBaseDate = useMemo(() => {
    // Se a etapa usa SLA baseado em agendamento E tem agendamento vinculado
    if (stage.sla_baseado_em === 'agendamento' && entry.agendamento_sla_id && slaAppointment) {
      const appointmentDate = slaAppointment.start_at || slaAppointment.data_hora;
      return new Date(appointmentDate);
    }
    // Padrão: SLA conta a partir da entrada na etapa
    return entry.data_entrada_etapa ? new Date(entry.data_entrada_etapa) : new Date();
  }, [stage.sla_baseado_em, entry.agendamento_sla_id, entry.data_entrada_etapa, slaAppointment]);

  // Cálculo de dias desde a data base do SLA
  const daysFromSlaBase = Math.floor((Date.now() - slaBaseDate.getTime()) / (1000 * 60 * 60 * 24));

  // Verifica se a etapa tem SLA definido e não é etapa final
  const hasSLA = stage.prazo_em_dias != null && stage.prazo_em_dias > 0 && stage.proxima_etapa_id !== 'final';
  
  // Cálculo de urgência baseado no SLA (prazo_em_dias)
  const prazo = stage.prazo_em_dias || 0;
  const diasRestantes = prazo - daysFromSlaBase;
  
  const slaStatus = useMemo(() => {
    // Se não tem SLA, não mostra badge de urgência
    if (!hasSLA) {
      return null;
    }
    
    if (diasRestantes < 0) {
      return {
        status: 'overdue' as const,
        label: `${Math.abs(diasRestantes)}d atrasado`,
        color: 'bg-destructive text-destructive-foreground',
        ringClass: 'ring-2 ring-destructive/70 ring-offset-1 ring-offset-background',
        pulse: true,
        icon: AlertTriangle
      };
    }
    
    if (diasRestantes === 0) {
      return {
        status: 'due-today' as const,
        label: 'Vence hoje!',
        color: 'bg-orange-500 text-white',
        ringClass: 'ring-2 ring-orange-500/70 ring-offset-1 ring-offset-background',
        pulse: true,
        icon: Clock
      };
    }
    
    if (diasRestantes <= Math.ceil(prazo * 0.3)) {
      return {
        status: 'warning' as const,
        label: `${diasRestantes}d restante${diasRestantes > 1 ? 's' : ''}`,
        color: 'bg-yellow-500/90 text-yellow-950',
        ringClass: '',
        pulse: false,
        icon: Clock
      };
    }
    
    return {
      status: 'on-track' as const,
      label: `${diasRestantes}d restante${diasRestantes > 1 ? 's' : ''}`,
      color: 'bg-muted text-muted-foreground',
      ringClass: '',
      pulse: false,
      icon: null
    };
  }, [hasSLA, diasRestantes, prazo]);

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

  return (
    <Card 
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={cn(
        "kanban-card kanban-card-stage group cursor-pointer active:cursor-grabbing",
        "transition-all duration-200 ease-out",
        "hover:shadow-xl hover:-translate-y-0.5 hover:border-l-primary",
        stageClass,
        (isLocalDragging || isDragging) && "opacity-50 rotate-1 scale-105 shadow-xl z-50",
        slaStatus?.ringClass
      )}
    >
      <CardContent className="p-3 pt-4 space-y-2 relative">
        {/* SLA Badge e Menu - Posição absoluta no canto superior direito */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5">
          {slaStatus && (
            <Badge
              variant="outline" 
              className={cn(
                "text-[9px] font-semibold px-1.5 py-0.5 h-5 border-0 rounded-full shadow-sm",
                slaStatus.color,
                slaStatus.pulse && "animate-pulse"
              )}
            >
              {slaStatus.icon && <slaStatus.icon className="w-2.5 h-2.5 mr-0.5" />}
              {slaStatus.label}
            </Badge>
          )}
          <div 
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto"
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
              onUnsubscribeFromPipeline={onUnsubscribeFromPipeline}
              onManageDeal={onManageDeal}
            />
          </div>
        </div>

        {/* Nome do lead */}
        <div className="pr-14">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 cursor-default">
                {lead.nome}
              </h4>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[250px] z-[60]">
              {lead.nome}
            </TooltipContent>
          </Tooltip>
          {showOrigem && (lead.segmento || lead.origem) && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {lead.segmento && lead.origem 
                ? `${lead.segmento} • ${lead.origem}` 
                : lead.segmento || lead.origem}
            </p>
          )}
        </div>

        {/* Dynamic: Valor do Deal (badge verde) */}
        {showValorDeal && (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 gap-1">
              <DollarSign className="w-2.5 h-2.5" />
              {formatCurrency(dealInfo.valor_proposto)}
            </Badge>
            {showValorRecorrente && (
              <Badge variant="outline" className="text-[9px] text-green-600 border-green-600/50">
                +{formatCurrency(dealInfo.valor_recorrente!)} rec
              </Badge>
            )}
          </div>
        )}

        {/* Dynamic: Data da Sessão */}
        {showDataSessao && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(appointmentInfo.data_hora), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Dynamic: Closer */}
        {showCloser && (
          <p className="text-[10px] text-primary/80 font-medium truncate">
            Closer: {lead.closer}
          </p>
        )}

        {/* Tags do Lead - 2 visíveis + botão de adicionar */}
        {showTags && (
          <div className="flex flex-wrap items-center gap-1">
            {tags.slice(0, 2).map(tag => (
              <Badge 
                key={tag.id}
                style={{ 
                  backgroundColor: `${tag.cor || '#3b82f6'}cc`, 
                  color: 'white' 
                }}
                className="text-[9px] px-1.5 py-0 h-4 font-medium"
              >
                {tag.nome}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/30 text-muted-foreground">
                +{tags.length - 2}
              </Badge>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <TagPopover 
                leadId={lead.id} 
                currentTags={tags} 
                onTagsChange={onTagsChange}
              />
            </div>
          </div>
        )}

        {/* Próximo Agendamento */}
        {nextAppointment && (
          <AppointmentBadge 
            startAt={nextAppointment.start_at}
            title={nextAppointment.titulo}
            compact
          />
        )}

        {/* Responsável principal - mais compacto */}
        {showResponsavel && (
          <div className="flex items-center gap-2 text-xs">
            {responsibles.length > 0 ? (() => {
              const primaryResp = responsibles.find(r => r.is_primary) || responsibles[0];
              const respName = primaryResp?.profile?.full_name 
                || primaryResp?.profile?.email?.split('@')[0] 
                || 'Responsável';
              const initial = respName.charAt(0).toUpperCase();
              return (
                <>
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {initial}
                    </span>
                  </div>
                  <span className="truncate text-muted-foreground text-[11px]">
                    {respName}
                  </span>
                </>
              );
            })() : (
              <span className="italic text-muted-foreground/50 text-[11px]">Sem responsável</span>
            )}
          </div>
        )}

        {/* Botão de Avançar */}
        {nextStage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className={cn(
                  "w-full h-7 text-xs font-medium gap-1.5",
                  checklistComplete
                    ? "bg-primary/90 hover:bg-primary text-primary-foreground"
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
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Avançar</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Checklist</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[200px] text-center z-[60]">
                {checklistComplete 
                  ? `Avançar para ${nextStage.nome}` 
                  : 'Complete o checklist para avançar'}
              </TooltipContent>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparator - só re-renderiza se houver mudanças relevantes
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.updated_at === nextProps.entry.updated_at &&
    prevProps.entry.agendamento_sla_id === nextProps.entry.agendamento_sla_id &&
    prevProps.lead?.id === nextProps.lead?.id &&
    prevProps.lead?.nome === nextProps.lead?.nome &&
    prevProps.stage.id === nextProps.stage.id &&
    prevProps.stage.sla_baseado_em === nextProps.stage.sla_baseado_em &&
    prevProps.checklistComplete === nextProps.checklistComplete &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.responsibles?.length === nextProps.responsibles?.length &&
    prevProps.tags?.length === nextProps.tags?.length &&
    prevProps.tags?.[0]?.id === nextProps.tags?.[0]?.id &&
    prevProps.tags?.[1]?.id === nextProps.tags?.[1]?.id &&
    prevProps.nextAppointment?.id === nextProps.nextAppointment?.id &&
    prevProps.nextAppointment?.start_at === nextProps.nextAppointment?.start_at &&
    prevProps.nextAppointment?.status === nextProps.nextAppointment?.status &&
    // New comparisons for dynamic fields
    prevProps.dealInfo?.id === nextProps.dealInfo?.id &&
    prevProps.dealInfo?.valor_proposto === nextProps.dealInfo?.valor_proposto &&
    prevProps.appointmentInfo?.id === nextProps.appointmentInfo?.id &&
    prevProps.slaAppointment?.id === nextProps.slaAppointment?.id &&
    prevProps.slaAppointment?.data_hora === nextProps.slaAppointment?.data_hora &&
    JSON.stringify(prevProps.displayConfig) === JSON.stringify(nextProps.displayConfig)
  );
});
