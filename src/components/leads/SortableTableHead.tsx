import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeadProps {
  label: string;
  column: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (column: string) => void;
  className?: string;
}

export function SortableTableHead({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort === column;

  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none hover:bg-accent/40 transition-colors',
        isActive && 'text-foreground',
        className
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && currentDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3 shrink-0" />
        ) : isActive && currentDirection === 'desc' ? (
          <ArrowDown className="h-3 w-3 shrink-0" />
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}
