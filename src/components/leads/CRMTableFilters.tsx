import { memo, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types/crm';

interface CRMTableFiltersProps {
  leads: Lead[];
  filterOrigem: string;
  onFilterOrigemChange: (v: string) => void;
  filterCloser: string;
  onFilterCloserChange: (v: string) => void;
}

export const CRMTableFilters = memo(function CRMTableFilters({
  leads,
  filterOrigem,
  onFilterOrigemChange,
  filterCloser,
  onFilterCloserChange,
}: CRMTableFiltersProps) {
  const uniqueClosers = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => { if (l.closer?.trim()) set.add(l.closer!.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

  const uniqueOrigens = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => { if (l.origem?.trim()) set.add(l.origem!.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

  const hasFilters = filterOrigem !== 'all' || filterCloser !== 'all';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      <Select value={filterOrigem} onValueChange={onFilterOrigemChange}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas origens</SelectItem>
          {uniqueOrigens.map(o => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterCloser} onValueChange={onFilterCloserChange}>
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="Closer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos closers</SelectItem>
          {uniqueClosers.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={() => {
            onFilterOrigemChange('all');
            onFilterCloserChange('all');
          }}
        >
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
});
