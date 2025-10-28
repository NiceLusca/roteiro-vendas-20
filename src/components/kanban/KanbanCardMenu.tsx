import { memo, useState, useRef, useEffect } from 'react';
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
  FastForward,
} from 'lucide-react';

interface KanbanCardMenuProps {
  hasNextStage: boolean;
  showMessageAction: boolean;
  onViewLead?: () => void;
  onOpenChecklist?: () => void;
  onRegressStage?: () => void;
  onAdvanceStage?: () => void;
  onJumpToStage?: () => void;
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
  onJumpToStage,
  onTransferPipeline,
  onCreateAppointment,
  onRegisterInteraction,
}: KanbanCardMenuProps) {
  // ✅ SOLUÇÃO 4: Controle manual do estado para evitar fechamento inesperado
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ SOLUÇÃO 2: Prevent close on parent re-render
  useEffect(() => {
    if (isOpen) {
      const handleBeforeUnload = (e: Event) => {
        e.preventDefault();
      };
      
      dropdownRef.current?.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        dropdownRef.current?.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-muted z-10 relative"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover z-[100]">
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
          <>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onAdvanceStage?.();
              }}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Avançar para Próxima
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onJumpToStage?.();
              }}
            >
              <FastForward className="h-4 w-4 mr-2" />
              Pular para Etapa...
            </DropdownMenuItem>
          </>
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
    </div>
  );
});
