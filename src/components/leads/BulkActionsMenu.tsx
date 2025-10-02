import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckSquare, Tag, Trash2 } from 'lucide-react';

interface BulkActionsMenuProps {
  leadCount: number;
  onTagAction: () => void;
  onDeleteAction: () => void;
  disabled?: boolean;
}

export function BulkActionsMenu({
  leadCount,
  onTagAction,
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
