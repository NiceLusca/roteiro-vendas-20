import React, { useState, useCallback, DragEvent } from 'react';
import { ChevronRight, ChevronDown, Users, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface KanbanStageGroupProps {
  groupName: string;
  groupColor?: string | null;
  totalLeads: number;
  stageCount: number;
  pipelineId: string;
  isFragmented?: boolean;
  fragmentRanges?: string;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

/**
 * KanbanStageGroup - Header visual para grupos de colunas
 * 
 * Funcionalidades:
 * - Header clicável para colapsar/expandir grupo
 * - Mostra contador de leads e etapas
 * - Suporta grupos fragmentados (etapas não-consecutivas)
 */
export function KanbanStageGroupHeader({
  groupName,
  groupColor,
  totalLeads,
  stageCount,
  isFragmented,
  fragmentRanges,
  onToggleCollapse,
  isCollapsed
}: KanbanStageGroupProps) {
  const color = groupColor || '#10b981';

  return (
    <div 
      className="flex items-center gap-2 mb-2 px-3 py-2 w-full
                 bg-muted/30 rounded-lg border border-border/30
                 hover:bg-muted/40 transition-colors cursor-pointer select-none"
      onClick={onToggleCollapse}
      role="button"
      aria-expanded={!isCollapsed}
      aria-label={`${isCollapsed ? 'Expandir' : 'Colapsar'} grupo ${groupName}`}
    >
      {isCollapsed ? (
        <ChevronRight 
          className="h-4 w-4 flex-shrink-0 transition-transform"
          style={{ color }}
        />
      ) : (
        <ChevronDown 
          className="h-4 w-4 flex-shrink-0 transition-transform"
          style={{ color }}
        />
      )}
      
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      
      <span className="text-sm font-semibold text-foreground flex-1 truncate">
        {groupName}
      </span>
      
      {isFragmented && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="text-[10px] px-1 py-0"
              style={{ borderColor: `${color}50`, color }}
            >
              <Layers className="h-3 w-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[60]">
            <p className="text-xs">Etapas não consecutivas: {fragmentRanges}</p>
          </TooltipContent>
        </Tooltip>
      )}
      
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
  );
}

/**
 * KanbanCollapsedGroup - Card visual para grupo colapsado
 */
interface KanbanCollapsedGroupProps {
  groupName: string;
  groupColor?: string | null;
  totalLeads: number;
  stageCount: number;
  stageNames: string[];
  onToggleCollapse: () => void;
}

export function KanbanCollapsedGroup({
  groupName,
  groupColor,
  totalLeads,
  stageCount,
  stageNames,
  onToggleCollapse
}: KanbanCollapsedGroupProps) {
  const color = groupColor || '#10b981';

  return (
    <div
      className="flex flex-col items-center justify-start py-4 px-2 min-w-16 w-16 
                 bg-muted/30 rounded-lg border border-border/50 
                 hover:bg-muted/50 transition-colors cursor-pointer select-none"
      onClick={onToggleCollapse}
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
            className="text-xs font-semibold text-foreground 
                       max-h-32 overflow-hidden text-center"
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
            <div className="mt-1 text-xs text-muted-foreground">
              {stageNames.slice(0, 5).join(', ')}
              {stageNames.length > 5 && ` +${stageNames.length - 5}`}
            </div>
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

/**
 * KanbanGroupColorBar - Barra colorida abaixo do header de grupo expandido
 */
interface KanbanGroupColorBarProps {
  color: string;
}

export function KanbanGroupColorBar({ color }: KanbanGroupColorBarProps) {
  return (
    <div 
      className="h-0.5 rounded-full mb-2 mx-1"
      style={{ 
        background: `linear-gradient(to right, ${color}80, ${color}40)` 
      }}
    />
  );
}
