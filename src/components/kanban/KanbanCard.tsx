import { memo, useCallback, useMemo, DragEvent, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead, LeadPipelineEntry, PipelineStage } from '@/types/crm';
import { formatWhatsApp } from '@/utils/formatters';
import { Phone, ArrowRight, AlertCircle, Copy, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanCardMenu } from './KanbanCardMenu';
import { AppointmentBadge } from '@/components/notifications/AppointmentBadge';
import { ResponsibleAvatars } from '@/components/leads/ResponsibleAvatars';
import type { LeadResponsible } from '@/hooks/useLeadResponsibles';

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
  responsibles?: LeadResponsible[];
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
  responsibles = [],
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
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

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

  const handleCopyWhatsApp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Copia o número limpo (apenas dígitos)
    const cleanNumber = lead.whatsapp?.replace(/\D/g, '') || '';
    navigator.clipboard.writeText(cleanNumber);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  }, [lead.whatsapp]);

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

  // Cálculo direto sem memoização para garantir atualização diária
  const daysInStage = entry.data_entrada_etapa 
    ? Math.floor((Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Cálculo de urgência baseado no SLA (prazo_em_dias)
  const prazo = stage.prazo_em_dias || 7;
  const diasRestantes = prazo - daysInStage;
  
  const slaStatus = (() => {
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
  })();


  const handleCardClick = useCallback(() => {
    // Não abre se estava arrastando
    if (isLocalDragging) return;
    onEditLead?.();
  }, [isLocalDragging, onEditLead]);

  return (
    <Card 
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={cn(
        "kanban-card kanban-card-stage group cursor-pointer active:cursor-grabbing border-l-4",
        stageClass,
        (isLocalDragging || isDragging) && "opacity-50 rotate-1 scale-105 shadow-xl z-50",
        // Ring de urgência para atrasados e vencendo hoje
        slaStatus.ringClass
      )}
    >
      <CardContent className="p-3">
        {/* Header compacto com menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
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

        {/* Responsáveis */}
        <div className="flex items-center justify-between mb-2">
          <ResponsibleAvatars responsibles={responsibles} maxDisplay={3} size="sm" />
        </div>

        {/* Telefone com copiar */}
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 flex-shrink-0" />
          <span className="truncate flex-1">{formatWhatsApp(lead.whatsapp)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-primary/10 flex-shrink-0"
            onClick={handleCopyWhatsApp}
            title={copiedWhatsApp ? "Copiado!" : "Copiar WhatsApp"}
          >
            <Copy className={cn(
              "h-3 w-3 transition-colors",
              copiedWhatsApp ? "text-success" : "text-muted-foreground hover:text-primary"
            )} />
          </Button>
          {copiedWhatsApp && (
            <span className="text-[10px] text-success font-medium animate-in fade-in slide-in-from-left-1 flex-shrink-0">
              Copiado!
            </span>
          )}
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

        {/* SLA Badge com alertas visuais */}
        <div className="flex items-center justify-between text-xs mb-3 py-1.5 px-2 bg-muted/30 rounded">
          <span className="text-muted-foreground truncate">
            {stage.proximo_passo_tipo}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0 h-5 border-0",
              slaStatus.color,
              slaStatus.pulse && "animate-pulse"
            )}
          >
            {slaStatus.icon && <slaStatus.icon className="w-3 h-3 mr-1" />}
            {slaStatus.label}
          </Badge>
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
    // Comparação de responsáveis
    prevProps.responsibles?.length === nextProps.responsibles?.length &&
    // ✅ SOLUÇÃO 3: Comparação profunda de nextAppointment
    prevProps.nextAppointment?.id === nextProps.nextAppointment?.id &&
    prevProps.nextAppointment?.start_at === nextProps.nextAppointment?.start_at &&
    prevProps.nextAppointment?.status === nextProps.nextAppointment?.status
  );
});