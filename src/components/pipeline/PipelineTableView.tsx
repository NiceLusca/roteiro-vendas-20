import { useMemo, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  ArrowRight, 
  ArrowLeft, 
  Shuffle, 
  UserMinus,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { LeadTag } from '@/types/bulkImport';
import { ResponsibleAvatars } from '@/components/leads/ResponsibleAvatars';
import { cn } from '@/lib/utils';

type SortColumn = 'nome' | 'etapa' | 'dias' | 'sla' | 'saude' | 'score' | 'responsavel' | null;
type SortDirection = 'asc' | 'desc';

export type TableSortOption = 'chronological' | 'alphabetical' | 'delay' | 'score';

interface PipelineTableViewProps {
  stageEntries: Array<{
    stage: PipelineStage;
    nextStage?: PipelineStage | null;
    entries: Array<LeadPipelineEntry & { lead: Lead; responsibles?: any[] }>;
    wipExceeded: boolean;
  }>;
  tagsMap?: Record<string, LeadTag[]>;
  sortBy?: TableSortOption;
  onViewLead?: (leadId: string) => void;
  onAdvanceStage?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onJumpToStage?: (entryId: string) => void;
  onUnsubscribeFromPipeline?: (entryId: string, leadId: string) => void;
}

// Component for sortable table header
function SortableHeader({ 
  column, 
  label, 
  currentSort, 
  currentDirection,
  onSort 
}: { 
  column: SortColumn; 
  label: string; 
  currentSort: SortColumn;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}) {
  const isActive = currentSort === column;
  
  return (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {isActive ? (
          currentDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}

export function PipelineTableView({
  stageEntries,
  tagsMap = {},
  sortBy = 'chronological',
  onViewLead,
  onAdvanceStage,
  onRegressStage,
  onJumpToStage,
  onUnsubscribeFromPipeline,
}: PipelineTableViewProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Flatten all entries with stage info
  const baseEntries = useMemo(() => {
    return stageEntries.flatMap(({ stage, entries }) =>
      entries.map(entry => ({
        ...entry,
        stageName: stage.nome,
        stageOrdem: stage.ordem,
        stagePrazo: stage.prazo_em_dias,
        stageColor: stage.ordem <= 3 ? 'bg-blue-500' : 
                    stage.ordem <= 6 ? 'bg-purple-500' : 
                    stage.ordem <= 10 ? 'bg-orange-500' : 'bg-green-500'
      }))
    );
  }, [stageEntries]);

  // Apply sorting
  const allEntries = useMemo(() => {
    const entries = [...baseEntries];
    
    if (!sortColumn) {
      // Use global sortBy as default ordering
      return entries.sort((a, b) => {
        switch (sortBy) {
          case 'alphabetical':
            return (a.lead?.nome || '').localeCompare(b.lead?.nome || '', 'pt-BR');
          
          case 'delay': {
            const aRemaining = a.stagePrazo && a.data_entrada_etapa 
              ? a.stagePrazo - differenceInDays(new Date(), new Date(a.data_entrada_etapa))
              : 999;
            const bRemaining = b.stagePrazo && b.data_entrada_etapa 
              ? b.stagePrazo - differenceInDays(new Date(), new Date(b.data_entrada_etapa))
              : 999;
            if (aRemaining !== bRemaining) return aRemaining - bRemaining; // Most delayed first
            // Fallback to chronological
            const dateA = new Date(a.data_entrada_etapa || a.created_at).getTime();
            const dateB = new Date(b.data_entrada_etapa || b.created_at).getTime();
            return dateA - dateB;
          }
          
          case 'score': {
            const scoreA = a.lead?.lead_score ?? -1;
            const scoreB = b.lead?.lead_score ?? -1;
            if (scoreB !== scoreA) return scoreB - scoreA; // Higher score first
            // Fallback to chronological
            const dateA = new Date(a.data_entrada_etapa || a.created_at).getTime();
            const dateB = new Date(b.data_entrada_etapa || b.created_at).getTime();
            return dateA - dateB;
          }
          
          case 'chronological':
          default:
            // Default: oldest first (chronological priority)
            const dateA = new Date(a.data_entrada_etapa || a.created_at).getTime();
            const dateB = new Date(b.data_entrada_etapa || b.created_at).getTime();
            return dateA - dateB;
        }
      });
    }

    const direction = sortDirection === 'asc' ? 1 : -1;

    return entries.sort((a, b) => {
      switch (sortColumn) {
        case 'nome':
          return direction * (a.lead?.nome || '').localeCompare(b.lead?.nome || '');
        
        case 'etapa':
          return direction * (a.stageOrdem - b.stageOrdem);
        
        case 'dias': {
          const aDays = a.data_entrada_etapa ? differenceInDays(new Date(), new Date(a.data_entrada_etapa)) : 0;
          const bDays = b.data_entrada_etapa ? differenceInDays(new Date(), new Date(b.data_entrada_etapa)) : 0;
          return direction * (aDays - bDays);
        }
        
        case 'sla': {
          // Calculate remaining days (negative = overdue)
          const aRemaining = a.stagePrazo && a.data_entrada_etapa 
            ? a.stagePrazo - differenceInDays(new Date(), new Date(a.data_entrada_etapa))
            : 999;
          const bRemaining = b.stagePrazo && b.data_entrada_etapa 
            ? b.stagePrazo - differenceInDays(new Date(), new Date(b.data_entrada_etapa))
            : 999;
          return direction * (aRemaining - bRemaining);
        }
        
        case 'saude': {
          // Order: Vermelho (1) > Amarelo (2) > Verde (3) > null (4)
          const healthOrder = { 'Vermelho': 1, 'Amarelo': 2, 'Verde': 3 };
          const aOrder = healthOrder[a.saude_etapa as keyof typeof healthOrder] || 4;
          const bOrder = healthOrder[b.saude_etapa as keyof typeof healthOrder] || 4;
          return direction * (aOrder - bOrder);
        }
        
        case 'score': {
          // Order: Alto (1) > Médio (2) > Baixo (3) > null (4)
          const scoreOrder = { 'Alto': 1, 'Médio': 2, 'Baixo': 3 };
          const aOrder = scoreOrder[a.lead?.lead_score_classification as keyof typeof scoreOrder] || 4;
          const bOrder = scoreOrder[b.lead?.lead_score_classification as keyof typeof scoreOrder] || 4;
          return direction * (aOrder - bOrder);
        }
        
        case 'responsavel': {
          const aName = a.responsibles?.[0]?.profile?.full_name || a.responsibles?.[0]?.profile?.nome || '';
          const bName = b.responsibles?.[0]?.profile?.full_name || b.responsibles?.[0]?.profile?.nome || '';
          return direction * aName.localeCompare(bName);
        }
        
        default:
          return 0;
      }
    });
  }, [baseEntries, sortColumn, sortDirection, sortBy]);

  const getHealthBadge = (health: string | null) => {
    switch (health) {
      case 'Verde':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">OK</Badge>;
      case 'Amarelo':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Atenção</Badge>;
      case 'Vermelho':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Atrasado</Badge>;
      default:
        return null;
    }
  };

  const getSLAStatus = (entry: typeof allEntries[0]) => {
    if (!entry.data_entrada_etapa || !entry.stagePrazo) return null;
    
    const daysInStage = differenceInDays(new Date(), new Date(entry.data_entrada_etapa));
    const remaining = entry.stagePrazo - daysInStage;
    
    if (remaining < 0) {
      return (
        <span className="flex items-center gap-1 text-destructive text-xs">
          <AlertTriangle className="h-3 w-3" />
          {Math.abs(remaining)}d atrasado
        </span>
      );
    }
    if (remaining === 0) {
      return (
        <span className="flex items-center gap-1 text-yellow-600 text-xs">
          <Clock className="h-3 w-3" />
          Vence hoje
        </span>
      );
    }
    if (remaining <= 2) {
      return (
        <span className="flex items-center gap-1 text-yellow-600 text-xs">
          <Clock className="h-3 w-3" />
          {remaining}d restantes
        </span>
      );
    }
    return (
      <span className="text-muted-foreground text-xs">
        {remaining}d restantes
      </span>
    );
  };

  if (allEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhum lead encontrado com os filtros atuais
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader 
              column="nome" 
              label="Lead" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <TableHead>Contato</TableHead>
            <SortableHeader 
              column="etapa" 
              label="Etapa" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader 
              column="dias" 
              label="Dias na Etapa" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader 
              column="sla" 
              label="SLA" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader 
              column="saude" 
              label="Saúde" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader 
              column="score" 
              label="Score" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader 
              column="responsavel" 
              label="Responsável" 
              currentSort={sortColumn}
              currentDirection={sortDirection}
              onSort={handleSort}
            />
            <TableHead>Tags</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allEntries.map((entry) => {
            const lead = entry.lead;
            if (!lead) return null;

            const daysInStage = entry.data_entrada_etapa
              ? differenceInDays(new Date(), new Date(entry.data_entrada_etapa)) 
              : 0;
            
            const leadTags = tagsMap[entry.lead_id] || [];
            const isFirstStage = entry.stageOrdem === stageEntries[0]?.stage.ordem;
            const isLastStage = entry.stageOrdem === stageEntries[stageEntries.length - 1]?.stage.ordem;

            return (
              <TableRow 
                key={entry.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewLead?.(entry.lead_id)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[180px]">{lead.nome}</span>
                    {lead.closer && (
                      <span className="text-xs text-muted-foreground">{lead.closer}</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {lead.whatsapp && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.whatsapp}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      entry.stageColor,
                      "text-white border-0"
                    )}
                  >
                    {entry.stageName}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <span className={cn(
                    "text-sm",
                    daysInStage > 7 && "text-destructive font-medium"
                  )}>
                    {daysInStage}d
                  </span>
                </TableCell>
                
                <TableCell>
                  {getSLAStatus(entry)}
                </TableCell>
                
                <TableCell>
                  {getHealthBadge(entry.saude_etapa)}
                </TableCell>
                
                <TableCell>
                  {lead.lead_score_classification && (
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        lead.lead_score_classification === 'Alto' && "bg-green-500/10 text-green-600",
                        lead.lead_score_classification === 'Médio' && "bg-yellow-500/10 text-yellow-600",
                        lead.lead_score_classification === 'Baixo' && "bg-red-500/10 text-red-600"
                      )}
                    >
                      {lead.lead_score_classification}
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell>
                  {entry.responsibles && entry.responsibles.length > 0 && (
                    <ResponsibleAvatars 
                      responsibles={entry.responsibles} 
                      maxDisplay={2}
                      size="sm"
                    />
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex gap-1 flex-wrap max-w-[100px]">
                    {leadTags.slice(0, 2).map(tag => (
                      <Badge 
                        key={tag.id} 
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                        style={{ 
                          backgroundColor: `${tag.cor}20`,
                          borderColor: tag.cor,
                          color: tag.cor
                        }}
                      >
                        {tag.nome}
                      </Badge>
                    ))}
                    {leadTags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{leadTags.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => onViewLead?.(entry.lead_id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {!isFirstStage && (
                        <DropdownMenuItem onClick={() => onRegressStage?.(entry.id)}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Voltar etapa
                        </DropdownMenuItem>
                      )}
                      
                      {!isLastStage && (
                        <DropdownMenuItem onClick={() => onAdvanceStage?.(entry.id)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Avançar etapa
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem onClick={() => onJumpToStage?.(entry.id)}>
                        <Shuffle className="h-4 w-4 mr-2" />
                        Transferir para etapa
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => onUnsubscribeFromPipeline?.(entry.id, entry.lead_id)}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Descadastrar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
