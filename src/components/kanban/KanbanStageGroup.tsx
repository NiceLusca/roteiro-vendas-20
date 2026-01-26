import React, { useState, useCallback, ReactNode, DragEvent } from 'react';
import { ChevronRight, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface KanbanStageGroupProps {
  groupName: string;
  groupColor?: string | null;
  totalLeads: number;
  stageCount: number;
  pipelineId: string;
  children: ReactNode;
}

const COLLAPSED_STORAGE_KEY_PREFIX = 'kanban-collapsed-groups-';

/**
 * KanbanStageGroup - Wrapper para agrupar colunas visualmente
 * 
 * Funcionalidades:
 * - Agrupa múltiplas colunas Kanban sob um header clicável
 * - Permite colapsar/expandir o grupo inteiro lateralmente
 * - Mostra contador total de leads quando colapsado
 * - Persiste estado de collapse no localStorage
 */
export function KanbanStageGroup({
  groupName,
  groupColor,
  totalLeads,
  stageCount,
  pipelineId,
  children
}: KanbanStageGroupProps) {
  // Carregar estado do localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(`${COLLAPSED_STORAGE_KEY_PREFIX}${pipelineId}`);
      if (saved) {
        const collapsed = JSON.parse(saved) as string[];
        return collapsed.includes(groupName);
      }
    } catch {
      // Ignore localStorage errors
    }
    return false;
  });

  // Cor do grupo ou fallback para emerald
  const color = groupColor || '#10b981';

  // Toggle collapse e persistir no localStorage
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      
      try {
        const storageKey = `${COLLAPSED_STORAGE_KEY_PREFIX}${pipelineId}`;
        const saved = localStorage.getItem(storageKey);
        let collapsed: string[] = saved ? JSON.parse(saved) : [];
        
        if (newState) {
          // Adicionar ao array de colapsados
          if (!collapsed.includes(groupName)) {
            collapsed.push(groupName);
          }
        } else {
          // Remover do array de colapsados
          collapsed = collapsed.filter(g => g !== groupName);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(collapsed));
      } catch {
        // Ignore localStorage errors
      }
      
      return newState;
    });
  }, [groupName, pipelineId]);

  // Prevenir propagação de drag events do grupo para os cards
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Não prevenir default aqui - deixar os cards lidarem com isso
  }, []);

  if (isCollapsed) {
    // Estado colapsado - mini card vertical
    return (
      <div
        className="flex flex-col items-center justify-start py-4 px-2 min-w-16 w-16 
                   bg-muted/30 rounded-lg border border-border/50 
                   hover:bg-muted/50 transition-colors cursor-pointer select-none"
        onClick={toggleCollapse}
        role="button"
        aria-expanded={false}
        aria-label={`Expandir grupo ${groupName}`}
      >
        <ChevronRight 
          className="h-4 w-4 text-muted-foreground mb-3 flex-shrink-0"
          style={{ color }}
        />
        
        {/* Título vertical */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="writing-mode-vertical text-xs font-semibold text-foreground 
                         max-h-32 overflow-hidden text-center line-clamp-1"
              style={{ 
                writingMode: 'vertical-rl', 
                textOrientation: 'mixed',
                transform: 'rotate(180deg)'
              }}
            >
              {groupName}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="z-[60]">
            <div className="text-sm">
              <p className="font-medium">{groupName}</p>
              <p className="text-muted-foreground">
                {totalLeads} lead{totalLeads !== 1 ? 's' : ''} • {stageCount} etapa{stageCount !== 1 ? 's' : ''}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Contador de leads */}
        <div className="mt-3 flex flex-col items-center gap-1">
          <Badge 
            variant="secondary" 
            className="text-[10px] px-1.5 py-0.5"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {totalLeads}
          </Badge>
          <span className="text-[9px] text-muted-foreground">
            {stageCount} et.
          </span>
        </div>

        {/* Barra de cor indicativa */}
        <div 
          className="mt-auto w-1 h-8 rounded-full opacity-70"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }

  // Estado expandido - wrapper com header
  return (
    <div 
      className="flex flex-col"
      onDragOver={handleDragOver}
    >
      {/* Header do grupo - sempre visível */}
      <div 
        className="flex items-center gap-2 mb-2 px-2 py-1.5 
                   bg-muted/20 rounded-lg border border-border/30
                   hover:bg-muted/30 transition-colors cursor-pointer select-none"
        onClick={toggleCollapse}
        role="button"
        aria-expanded={true}
        aria-label={`Colapsar grupo ${groupName}`}
      >
        <ChevronDown 
          className="h-4 w-4 flex-shrink-0 transition-transform"
          style={{ color }}
        />
        
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        
        <span className="text-sm font-semibold text-foreground flex-1 truncate">
          {groupName}
        </span>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Users className="h-3 w-3 mr-1" />
            {totalLeads}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({stageCount} {stageCount === 1 ? 'etapa' : 'etapas'})
          </span>
        </div>
      </div>

      {/* Barra colorida do grupo */}
      <div 
        className="h-0.5 rounded-full mb-2 mx-1"
        style={{ 
          background: `linear-gradient(to right, ${color}80, ${color}40)` 
        }}
      />

      {/* Colunas do grupo */}
      <div className="flex gap-2 md:gap-3 lg:gap-4">
        {children}
      </div>
    </div>
  );
}
