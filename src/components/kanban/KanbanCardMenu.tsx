import { memo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Eye,
  CheckSquare,
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Calendar,
  MessageCircle,
} from 'lucide-react';

interface KanbanCardMenuProps {
  hasNextStage: boolean;
  showMessageAction: boolean;
  onViewLead?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onAdvanceStage?: () => void;
  onTransferPipeline?: () => void;
  onCreateAppointment?: () => void;
  onRegisterInteraction?: () => void;
}

export const KanbanCardMenu = memo(function KanbanCardMenu({
  hasNextStage,
  showMessageAction,
  onViewLead,
  onOpenChecklist,
  onRegressStage,
  onAdvanceStage,
  onTransferPipeline,
  onCreateAppointment,
  onRegisterInteraction,
}: KanbanCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onViewLead?.();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Lead
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenChecklist?.();
          }}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Abrir Checklist
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onRegressStage?.();
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Regredir Etapa
        </DropdownMenuItem>
        
        {hasNextStage && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage?.();
            }}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Avançar Etapa
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onTransferPipeline?.();
          }}
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Transferir Pipeline
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onCreateAppointment?.();
          }}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Gerenciar Agendamento
        </DropdownMenuItem>
        
        {showMessageAction && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRegisterInteraction?.();
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Registrar Interação
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
