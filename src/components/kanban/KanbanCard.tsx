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
  nextStage?: PipelineStage | null;
  checklistComplete?: boolean;
  nextAppointment?: AppointmentInfo | null;
  isDragging?: boolean;
  onViewLead?: () => void;
  onEditLead?: () => void;
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
  nextStage,
  checklistComplete = true,
  nextAppointment,
  isDragging = false,
  onViewLead,
  onEditLead,
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

  // Função para determinar as cores do cartão baseado no closer
  const getCloserCardColors = (closer?: string) => {
    if (!closer) return { bg: 'bg-card', border: 'border-border' };
    
    switch (closer) {
      case 'Gabriel':
        return { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-300 dark:border-yellow-700' };
      case 'Uilma':
        return { bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-300 dark:border-pink-700' };
      case 'Lucas':
        return { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-300 dark:border-purple-700' };
      case 'Vagner':
        return { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-300 dark:border-blue-700' };
      default:
        return { bg: 'bg-card', border: 'border-border' };
    }
  };

  const closerColors = getCloserCardColors(lead?.closer);


  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "kanban-card group cursor-grab active:cursor-grabbing transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-2",
        closerColors.bg,
        closerColors.border,
        (dragActive || isDragging) && "opacity-60 rotate-2 scale-105 shadow-2xl z-50 ring-2 ring-primary/50"
      )}
    >
      <CardContent className="p-4" onClick={(e) => {
        // Não abrir o dialog se clicar em um botão
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        onEditLead?.();
      }}>
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
            {entry.data_entrada_etapa && (
              <Badge variant="outline" className="text-xs">
                {Math.floor((Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24))}d
              </Badge>
            )}
          </div>
        </div>

        {/* SLA e Saúde */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {entry.saude_etapa && (
              <Badge className={getHealthBadgeClass(entry.saude_etapa)}>
                {entry.saude_etapa}
              </Badge>
            )}
            {entry.data_entrada_etapa && (
              <span className="text-xs text-muted-foreground">
                {Math.floor((Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24))}d na etapa
              </span>
            )}
          </div>
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

        {/* Botão Grande de Avançar Etapa */}
        {nextStage && (
          <div className="mb-3">
            <Button
              size="lg"
              className={cn(
                "w-full h-12 text-sm font-semibold transition-all duration-200 gap-2",
                checklistComplete
                  ? "bg-success hover:bg-success/90 text-white shadow-md hover:shadow-lg"
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
                  Avançar para {nextStage.nome}
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  Complete o checklist para avançar
                </>
              )}
            </Button>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-6 px-2 hover:bg-primary/10 hover:text-primary transition-all duration-200"
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
            className="h-6 w-6 p-0 hover:bg-accent/80 hover:scale-110 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChecklist?.();
            }}
            title="Abrir checklist da etapa"
          >
            <CheckSquare className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-orange-100 hover:text-orange-600 hover:scale-110 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onRegressStage?.();
            }}
            title="Regredir para etapa anterior"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-success/20 hover:text-success hover:scale-110 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage?.();
            }}
            title="Avançar para próxima etapa"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onTransferPipeline?.();
            }}
            title="Transferir para outro pipeline"
          >
            <GitBranch className="h-3 w-3" />
          </Button>
          
          <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 w-6 p-0 hover:scale-110 transition-all duration-200",
                nextAppointment 
                  ? "hover:bg-success/20 hover:text-success" 
                  : "text-orange-600 hover:bg-orange-100 hover:text-orange-700"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onCreateAppointment?.();
              }}
              title={nextAppointment ? "Ver/Editar agendamento existente" : "Criar novo agendamento"}
            >
              {nextAppointment ? (
                <CalendarCheck className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
            </Button>
          
          {stage.proximo_passo_tipo === 'Mensagem' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onRegisterInteraction?.();
              }}
              title="Registrar nova interação com o lead"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}