import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead, LeadPipelineEntry, PipelineStage } from '@/types/crm';
import { formatWhatsApp, formatCurrency } from '@/utils/formatters';
import { 
  User, 
  Phone, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  MessageCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  ArrowLeft,
  GitBranch,
  CalendarCheck,
  CalendarX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AppointmentInfo {
  id: string;
  start_at: string;
  status: string;
  tipo_sessao?: string;
  closer_responsavel?: string;
}

interface KanbanCardProps {
  entry: LeadPipelineEntry;
  lead: Lead | null | undefined;
  stage: PipelineStage;
  nextAppointment?: AppointmentInfo | null;
  isDragging?: boolean;
  onViewLead?: () => void;
  onCreateAppointment?: () => void;
  onAdvanceStage?: () => void;
  onRegisterInteraction?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onTransferPipeline?: () => void;
}

export function KanbanCard({
  entry,
  lead,
  stage,
  nextAppointment,
  isDragging = false,
  onViewLead,
  onCreateAppointment,
  onAdvanceStage,
  onRegisterInteraction,
  onOpenChecklist,
  onRegressStage,
  onTransferPipeline
}: KanbanCardProps) {
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dragActive,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const getScoreBadgeClass = (classification: string) => {
    switch (classification) {
      case 'Alto':
        return 'score-alto';
      case 'Médio':
        return 'score-medio';
      default:
        return 'score-baixo';
    }
  };

  const getHealthBadgeClass = (saude: string) => {
    switch (saude) {
      case 'Verde':
        return 'health-verde';
      case 'Amarelo':
        return 'health-amarelo';
      default:
        return 'health-vermelho';
    }
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "kanban-card cursor-grab active:cursor-grabbing",
        (dragActive || isDragging) && "opacity-50 rotate-2 scale-105 shadow-lg z-50"
      )}
    >
      <CardContent className="p-4">
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {lead.nome}
            </h4>
            <p className="text-xs text-muted-foreground">
              {lead.segmento} • {lead.origem}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Badge className={getScoreBadgeClass(lead.lead_score_classification)}>
              {lead.lead_score}
            </Badge>
          </div>
        </div>

        {/* Informações do Lead */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span className="truncate">{formatWhatsApp(lead.whatsapp)}</span>
          </div>
          
          {lead.closer && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{lead.closer}</span>
            </div>
          )}
        </div>

        {/* Próximo Passo */}
        <div className="mb-3 p-2 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-foreground">
              Próximo Passo
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stage.proximo_passo_label}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {stage.proximo_passo_tipo}
            </Badge>
            {entry.dias_em_atraso > 0 && (
              <Badge variant="destructive" className="text-xs">
                {entry.dias_em_atraso}d atraso
              </Badge>
            )}
          </div>
        </div>

        {/* SLA e Saúde */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={getHealthBadgeClass(entry.saude_etapa)}>
              {entry.saude_etapa}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {entry.tempo_em_etapa_dias}d na etapa
            </span>
          </div>
          
          {entry.dias_em_atraso > 0 && (
            <AlertCircle className="h-4 w-4 text-danger" />
          )}
        </div>

        {/* Informações de Agendamento */}
        {nextAppointment && (
          <div className="mb-3 p-2 bg-success/10 border border-success/20 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-3 w-3 text-success" />
                <span className="text-xs font-medium text-success">
                  Próxima Sessão
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs text-success font-medium">Ativo</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium">
                {new Date(nextAppointment.start_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(nextAppointment.start_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              {nextAppointment.tipo_sessao && (
                <Badge variant="secondary" className="text-xs">
                  {nextAppointment.tipo_sessao}
                </Badge>
              )}
              {nextAppointment.closer_responsavel && (
                <p className="text-xs text-muted-foreground">
                  Com: {nextAppointment.closer_responsavel}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Etapas com agendamento mas sem agendamento ativo */}
        {(stage.gerar_agendamento_auto || stage.tipo_agendamento) && !nextAppointment && (
          <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <CalendarX className="h-3 w-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">
                Agendamento Necessário
              </span>
            </div>
            <p className="text-xs text-orange-600">
              {stage.tipo_agendamento && `Tipo: ${stage.tipo_agendamento}`}
            </p>
          </div>
        )}

        {/* Observações */}
        {entry.nota_etapa && (
          <div className="mb-3 p-2 bg-accent/50 rounded-md">
            <p className="text-xs text-foreground line-clamp-2">
              {entry.nota_etapa}
            </p>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewLead?.();
            }}
          >
            Ver Lead
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChecklist?.();
            }}
            title="Checklist"
          >
            <CheckSquare className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onRegressStage?.();
            }}
            title="Voltar etapa"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage?.();
            }}
            title="Avançar etapa"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onTransferPipeline?.();
            }}
            title="Transferir pipeline"
          >
            <GitBranch className="h-3 w-3" />
          </Button>
          
          {(stage.gerar_agendamento_auto || stage.tipo_agendamento) && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 w-6 p-0",
                !nextAppointment && "text-orange-600 hover:text-orange-700"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onCreateAppointment?.();
              }}
              title={nextAppointment ? "Ver/Editar agendamento" : "Criar agendamento"}
            >
              {nextAppointment ? (
                <CalendarCheck className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {stage.proximo_passo_tipo === 'Mensagem' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onRegisterInteraction?.();
              }}
              title="Registrar interação"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}