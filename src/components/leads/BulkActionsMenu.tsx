import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckSquare, Tag, Trash2, GitBranch, TrendingUp } from 'lucide-react';

interface BulkActionsMenuProps {
  leadCount: number;
  onTagAction: () => void;
  onPipelineAction: () => void;
  onScoreAction: () => void;
  onDeleteAction: () => void;
  disabled?: boolean;
}

export function BulkActionsMenu({
  leadCount,
  onTagAction,
  onPipelineAction,
  onScoreAction,
  onDeleteAction,
  disabled = false
}: BulkActionsMenuProps) {
  if (leadCount === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <CheckSquare className="h-4 w-4" />
          Ações em Massa ({leadCount} leads)
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onTagAction}>
          <Tag className="h-4 w-4 mr-2" />
          Gerenciar Tags
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPipelineAction}>
          <GitBranch className="h-4 w-4 mr-2" />
          Inscrever em Pipeline
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onScoreAction}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Ajustar Score
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onDeleteAction}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Leads
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
