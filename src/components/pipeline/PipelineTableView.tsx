import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  AlertTriangle
} from 'lucide-react';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';
import { LeadTag } from '@/types/bulkImport';
import { ResponsibleAvatars } from '@/components/leads/ResponsibleAvatars';
import { cn } from '@/lib/utils';

interface PipelineTableViewProps {
  stageEntries: Array<{
    stage: PipelineStage;
    nextStage?: PipelineStage | null;
    entries: Array<LeadPipelineEntry & { lead: Lead; responsibles?: any[] }>;
    wipExceeded: boolean;
  }>;
  tagsMap?: Record<string, LeadTag[]>;
  onViewLead?: (leadId: string) => void;
  onAdvanceStage?: (entryId: string) => void;
  onRegressStage?: (entryId: string) => void;
  onJumpToStage?: (entryId: string) => void;
  onUnsubscribeFromPipeline?: (entryId: string, leadId: string) => void;
}

export function PipelineTableView({
  stageEntries,
  tagsMap = {},
  onViewLead,
  onAdvanceStage,
  onRegressStage,
  onJumpToStage,
  onUnsubscribeFromPipeline,
}: PipelineTableViewProps) {
  // Flatten all entries with stage info
  const allEntries = useMemo(() => {
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
    ).sort((a, b) => {
      // Sort by stage order, then by days in stage (descending)
      if (a.stageOrdem !== b.stageOrdem) return a.stageOrdem - b.stageOrdem;
      const aDays = a.data_entrada_etapa ? differenceInDays(new Date(), new Date(a.data_entrada_etapa)) : 0;
      const bDays = b.data_entrada_etapa ? differenceInDays(new Date(), new Date(b.data_entrada_etapa)) : 0;
      return bDays - aDays;
    });
  }, [stageEntries]);

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
            <TableHead className="w-[200px]">Lead</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Dias na Etapa</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Saúde</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Responsáveis</TableHead>
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
