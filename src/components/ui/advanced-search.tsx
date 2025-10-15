import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Tag, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

export interface SearchFilter {
  id: string;
  label: string;
  value: any;
  type: 'text' | 'select' | 'date-range' | 'multiselect';
  options?: Array<{ label: string; value: string }>;
}

export interface AdvancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilter[]) => void;
  availableFilters?: Array<{
    id: string;
    label: string;
    type: 'text' | 'select' | 'date-range' | 'multiselect';
    options?: Array<{ label: string; value: string }>;
  }>;
  sortOptions?: Array<{ label: string; value: string }>;
  onSort?: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  className?: string;
  showResultCount?: boolean;
  resultCount?: number;
}

export function AdvancedSearch({
  placeholder = "Pesquisar...",
  onSearch,
  availableFilters = [],
  sortOptions = [],
  onSort,
  className,
  showResultCount = false,
  resultCount = 0
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query, activeFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeFilters, onSearch]);

  useEffect(() => {
    if (onSort && sortBy) {
      onSort(sortBy, sortDirection);
    }
  }, [sortBy, sortDirection, onSort]);

  const addFilter = (filterId: string) => {
    const filterConfig = availableFilters.find(f => f.id === filterId);
    if (!filterConfig) return;

    const existingFilter = activeFilters.find(f => f.id === filterId);
    if (existingFilter) return;

    const newFilter: SearchFilter = {
      id: filterId,
      label: filterConfig.label,
      type: filterConfig.type,
      value: filterConfig.type === 'multiselect' ? [] : '',
      options: filterConfig.options
    };

    setActiveFilters(prev => [...prev, newFilter]);
    setFilterPopoverOpen(false);
  };

  const updateFilter = (filterId: string, value: any) => {
    setActiveFilters(prev =>
      prev.map(filter =>
        filter.id === filterId ? { ...filter, value } : filter
      )
    );
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setQuery('');
  };

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'date-range': return Calendar;
      case 'select':
      case 'multiselect': return Tag;
      default: return User;
    }
  };

  const renderFilterValue = (filter: SearchFilter) => {
    switch (filter.type) {
      case 'date-range':
        return (
          <Input
            placeholder="Data inicial - Data final"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="w-40"
          />
        );
      
      case 'select':
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => updateFilter(filter.id, value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'text':
        return (
          <Input
            placeholder={`Filtrar por ${filter.label.toLowerCase()}...`}
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="w-40"
          />
        );
      
      case 'multiselect':
        return (
          <Select
            value={filter.value[0] || ''}
            onValueChange={(value) => {
              const currentValues = filter.value || [];
              const newValues = currentValues.includes(value)
                ? currentValues.filter((v: string) => v !== value)
                : [...currentValues, value];
              updateFilter(filter.id, newValues);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecionar múltiplos..." />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  const hasActiveFilters = activeFilters.length > 0 || query.length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4"
            data-search-input
          />
        </div>

        {/* Filter Button */}
        {availableFilters.length > 0 && (
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Adicionar Filtro</h4>
                <Separator />
                {availableFilters
                  .filter(filter => !activeFilters.find(af => af.id === filter.id))
                  .map(filter => {
                    const Icon = getFilterIcon(filter.type);
                    return (
                      <Button
                        key={filter.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => addFilter(filter.id)}
                      >
                        <Icon className="h-4 w-4" />
                        {filter.label}
                      </Button>
                    );
                  })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sort Options */}
        {sortOptions.length > 0 && (
          <div className="flex items-center gap-1">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {sortBy && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <SortDesc className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros Ativos:
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <div key={filter.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Label className="text-xs font-medium">{filter.label}:</Label>
                {renderFilterValue(filter)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                  className="h-auto p-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Count */}
      {showResultCount && (
        <div className="text-sm text-muted-foreground">
          {resultCount === 0 ? 'Nenhum resultado encontrado' : 
           resultCount === 1 ? '1 resultado encontrado' :
           `${resultCount.toLocaleString()} resultados encontrados`}
        </div>
      )}
    </div>
  );
}