import { Button } from '@/components/ui/button';
import { ActionTooltip } from './ActionTooltip';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckSquare, 
  GitBranch, 
  Calendar, 
  CalendarCheck, 
  MessageCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadPipelineEntry, Lead, PipelineStage } from '@/types/crm';

interface EnhancedKanbanActionsProps {
  entry: LeadPipelineEntry;
  lead: Lead;
  stage: PipelineStage;
  nextAppointment?: any;
  checklistValidation?: {
    canAdvance: boolean;
    blockReason?: string;
  };
  onAdvanceStage?: () => void;
  onRegressStage?: () => void;
  onOpenChecklist?: () => void;
  onTransferPipeline?: () => void;
  onCreateAppointment?: () => void;
  onRegisterInteraction?: () => void;
}

export function EnhancedKanbanActions({
  entry,
  lead,
  stage,
  nextAppointment,
  checklistValidation,
  onAdvanceStage,
  onRegressStage,
  onOpenChecklist,
  onTransferPipeline,
  onCreateAppointment,
  onRegisterInteraction
}: EnhancedKanbanActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Checklist */}
      <ActionTooltip content="Abrir checklist da etapa">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-accent/80 hover:scale-110 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChecklist?.();
          }}
          aria-label="Abrir checklist da etapa"
        >
          <CheckSquare className="h-3 w-3" />
        </Button>
      </ActionTooltip>

      {/* Regredir */}
      <ActionTooltip content="Regredir para etapa anterior">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-orange-100 hover:text-orange-600 hover:scale-110 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onRegressStage?.();
          }}
          aria-label="Regredir para etapa anterior"
        >
          <ArrowLeft className="h-3 w-3" />
        </Button>
      </ActionTooltip>

      {/* Avançar */}
      <ActionTooltip 
        content="Avançar para próxima etapa"
        blocked={checklistValidation && !checklistValidation.canAdvance}
        blockReason={checklistValidation?.blockReason}
      >
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-success/20 hover:text-success hover:scale-110 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onAdvanceStage?.();
          }}
          disabled={checklistValidation && !checklistValidation.canAdvance}
          aria-label="Avançar para próxima etapa"
        >
          <ArrowRight className="h-3 w-3" />
        </Button>
      </ActionTooltip>

      {/* Transferir Pipeline */}
      <ActionTooltip content="Transferir para outro pipeline">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onTransferPipeline?.();
          }}
          aria-label="Transferir para outro pipeline"
        >
          <GitBranch className="h-3 w-3" />
        </Button>
      </ActionTooltip>

      {/* Agendamento */}
      {(stage.gerar_agendamento_auto || stage.tipo_agendamento) && (
        <ActionTooltip 
          content={nextAppointment ? "Ver/Editar agendamento existente" : "Criar novo agendamento"}
        >
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
            aria-label={nextAppointment ? "Ver agendamento existente" : "Criar novo agendamento"}
          >
            {nextAppointment ? (
              <CalendarCheck className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
          </Button>
        </ActionTooltip>
      )}

      {/* Registrar Interação */}
      {stage.proximo_passo_tipo === 'Mensagem' && (
        <ActionTooltip content="Registrar nova interação com o lead">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onRegisterInteraction?.();
            }}
            aria-label="Registrar nova interação"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </ActionTooltip>
      )}
    </div>
  );
}