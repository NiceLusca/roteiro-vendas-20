import { useState, useMemo } from 'react';

/**
 * Hook centralizado para gerenciar filtros comuns em páginas (Deals, Orders, Pipelines, Leads)
 */
export function useCommonFilters<T extends Record<string, any>>(
  items: T[],
  config: {
    searchFields?: (keyof T)[];
    closerField?: keyof T;
    statusField?: keyof T;
    customFilters?: Record<string, (item: T, value: string) => boolean>;
  } = {}
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>({});

  const {
    searchFields = [],
    closerField,
    statusField,
    customFilters = {}
  } = config;

  // Extrair closers únicos
  const uniqueClosers = useMemo(() => {
    if (!closerField) return [];
    return Array.from(new Set(
      items.map(item => item[closerField]).filter(Boolean)
    )) as string[];
  }, [items, closerField]);

  // Extrair status únicos
  const uniqueStatuses = useMemo(() => {
    if (!statusField) return [];
    return Array.from(new Set(
      items.map(item => item[statusField]).filter(Boolean)
    )) as string[];
  }, [items, statusField]);

  // Aplicar filtros
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtro de busca
      if (searchTerm && searchFields.length > 0) {
        const matchesSearch = searchFields.some(field => {
          const value = item[field];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
        if (!matchesSearch) return false;
      }

      // Filtro de closer
      if (closerFilter !== 'all' && closerField) {
        if (item[closerField] !== closerFilter) return false;
      }

      // Filtro de status
      if (statusFilter !== 'all' && statusField) {
        if (item[statusField] !== statusFilter) return false;
      }

      // Filtros customizados
      for (const [filterKey, filterFn] of Object.entries(customFilters)) {
        const filterValue = customFilterValues[filterKey];
        if (filterValue && filterValue !== 'all') {
          if (!filterFn(item, filterValue)) return false;
        }
      }

      return true;
    });
  }, [items, searchTerm, closerFilter, statusFilter, searchFields, closerField, statusField, customFilters, customFilterValues]);

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setCloserFilter('all');
    setStatusFilter('all');
    setCustomFilterValues({});
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || 
           closerFilter !== 'all' || 
           statusFilter !== 'all' ||
           Object.values(customFilterValues).some(v => v && v !== 'all');
  }, [searchTerm, closerFilter, statusFilter, customFilterValues]);

  return {
    // Estado dos filtros
    searchTerm,
    setSearchTerm,
    closerFilter,
    setCloserFilter,
    statusFilter,
    setStatusFilter,
    customFilterValues,
    setCustomFilterValue: (key: string, value: string) => 
      setCustomFilterValues(prev => ({ ...prev, [key]: value })),
    
    // Dados processados
    filteredItems,
    uniqueClosers,
    uniqueStatuses,
    
    // Ações
    clearFilters,
    hasActiveFilters,
  };
}
