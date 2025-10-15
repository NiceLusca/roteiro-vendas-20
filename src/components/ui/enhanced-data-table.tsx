import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdvancedSearch, SearchFilter } from '@/components/ui/advanced-search';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Columns,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date-range' | 'multiselect';
  filterOptions?: Array<{ label: string; value: string }>;
  cell?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline';
  condition?: (row: T) => boolean;
}

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  exportable?: boolean;
  onExport?: (data: T[]) => void;
  className?: string;
  pageSize?: number;
  virtualScrolling?: boolean;
}

export function EnhancedDataTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  selectable = false,
  onSelectionChange,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  searchPlaceholder = 'Pesquisar...',
  onRefresh,
  exportable = false,
  onExport,
  className,
  pageSize = 50,
  virtualScrolling = false
}: EnhancedDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.id))
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Generate filter options from columns
  const availableFilters = useMemo(() => {
    return columns
      .filter(col => col.filterable)
      .map(col => ({
        id: col.id,
        label: col.header,
        type: col.filterType || 'text',
        options: col.filterOptions
      }));
  }, [columns]);

  // Sort options
  const sortOptions = useMemo(() => {
    return columns
      .filter(col => col.sortable)
      .map(col => ({
        label: col.header,
        value: col.id
      }));
  }, [columns]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search query
    if (searchQuery) {
      result = result.filter(row => {
        return columns.some(column => {
          const value = typeof column.accessor === 'function' 
            ? column.accessor(row)
            : row[column.accessor];
          
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    }

    // Apply filters
    activeFilters.forEach(filter => {
      if (!filter.value) return;

      result = result.filter(row => {
        const column = columns.find(col => col.id === filter.id);
        if (!column) return true;

        const value = typeof column.accessor === 'function' 
          ? column.accessor(row)
          : row[column.accessor];

        switch (filter.type) {
          case 'text':
            return value?.toString().toLowerCase().includes(filter.value.toLowerCase());
          
          case 'select':
            return value === filter.value;
          
          case 'multiselect':
            return Array.isArray(filter.value) && filter.value.includes(value);
          
          case 'date-range':
            // Implement date range filtering logic
            return true;
          
          default:
            return true;
        }
      });
    });

    return result;
  }, [data, searchQuery, activeFilters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === sortConfig.key);
      if (!column) return 0;

      const aValue = typeof column.accessor === 'function' 
        ? column.accessor(a)
        : a[column.accessor];
      const bValue = typeof column.accessor === 'function' 
        ? column.accessor(b)
        : b[column.accessor];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sorting
  const handleSort = (columnId: string) => {
    setSortConfig(current => {
      if (!current || current.key !== columnId) {
        return { key: columnId, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: columnId, direction: 'desc' };
      }
      return null;
    });
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  // Update parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = data.filter(row => selectedRows.has(row.id));
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange]);

  const handleSearch = (query: string, filters: SearchFilter[]) => {
    setSearchQuery(query);
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page
  };

  const handleSortFromSearch = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    setSortConfig({ key: sortBy, direction: sortDirection });
  };

  const handleExport = () => {
    if (onExport) {
      onExport(sortedData);
    }
  };

  const getSortIcon = (columnId: string) => {
    if (!sortConfig || sortConfig.key !== columnId) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUpIcon className="h-3 w-3" /> : 
      <ArrowDownIcon className="h-3 w-3" />;
  };

  const visibleColumnsArray = columns.filter(col => visibleColumns.has(col.id));
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id));
  const isPartiallySelected = paginatedData.some(row => selectedRows.has(row.id)) && !isAllSelected;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <AdvancedSearch
            placeholder={searchPlaceholder}
            onSearch={handleSearch}
            availableFilters={availableFilters}
            sortOptions={sortOptions}
            onSort={handleSortFromSearch}
            showResultCount
            resultCount={sortedData.length}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map(column => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => {
                    const newVisible = new Set(visibleColumns);
                    if (visibleColumns.has(column.id)) {
                      newVisible.delete(column.id);
                    } else {
                      newVisible.add(column.id);
                    }
                    setVisibleColumns(newVisible);
                  }}
                >
                  <Checkbox 
                    checked={visibleColumns.has(column.id)}
                    className="mr-2"
                  />
                  {column.header}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          )}

          {/* Export */}
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedRows.size} item(s) selecionado(s)
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedRows(new Set())}
          >
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              
              {visibleColumnsArray.map(column => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-muted/50',
                    column.sticky && 'sticky left-0 bg-background'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && getSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}

              {actions.length > 0 && (
                <TableHead className="w-[100px]">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {selectable && <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>}
                  {visibleColumnsArray.map(column => (
                    <TableCell key={column.id}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnsArray.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) => handleSelectRow(row.id, checked as boolean)}
                      />
                    </TableCell>
                  )}

                  {visibleColumnsArray.map(column => {
                    const value = typeof column.accessor === 'function' 
                      ? column.accessor(row)
                      : row[column.accessor];

                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.sticky && 'sticky left-0 bg-background'
                        )}
                      >
                        {column.cell ? column.cell(value, row) : value}
                      </TableCell>
                    );
                  })}

                  {actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions
                            .filter(action => !action.condition || action.condition(row))
                            .map((action, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={() => action.onClick(row)}
                                className={action.variant === 'destructive' ? 'text-destructive' : ''}
                              >
                                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} resultados
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}