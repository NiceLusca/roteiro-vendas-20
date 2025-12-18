import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DuplicateLead } from '@/hooks/useDuplicateDetection';
import { formatWhatsApp, formatDateTime } from '@/utils/formatters';
import { 
  Phone, 
  Mail, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  X, 
  Merge,
  GitBranch,
  UserMinus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DuplicateReviewCardProps {
  lead1: DuplicateLead;
  lead2: DuplicateLead;
  matchType: 'whatsapp' | 'email' | 'nome_similar';
  confidence: 'alta' | 'media' | 'baixa';
  onMerge: (keepId: string, deleteId: string) => void;
  onKeepBoth: () => void;
  onDelete: (leadId: string) => void;
  onUnsubscribe?: (leadId: string) => void;
  loading?: boolean;
  isAdmin?: boolean;
}

export const DuplicateReviewCard = memo(function DuplicateReviewCard({
  lead1,
  lead2,
  matchType,
  confidence,
  onMerge,
  onKeepBoth,
  onDelete,
  onUnsubscribe,
  loading = false,
  isAdmin = false
}: DuplicateReviewCardProps) {
  const getMatchLabel = () => {
    switch (matchType) {
      case 'whatsapp': return 'WhatsApp igual';
      case 'email': return 'Email igual';
      case 'nome_similar': return 'Nome similar';
    }
  };

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'alta': return 'bg-destructive text-destructive-foreground';
      case 'media': return 'bg-warning text-warning-foreground';
      case 'baixa': return 'bg-muted text-muted-foreground';
    }
  };

  const LeadColumn = ({ lead, isOlder }: { lead: DuplicateLead; isOlder: boolean }) => (
    <div className="flex-1 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{lead.nome}</h4>
        {isOlder && (
          <Badge variant="outline" className="text-xs">
            Mais antigo
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-sm">
        {lead.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.whatsapp && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{formatWhatsApp(lead.whatsapp)}</span>
          </div>
        )}
        {lead.created_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateTime(new Date(lead.created_at))}</span>
          </div>
        )}
      </div>

      {/* Pipelines */}
      {lead.pipelines && lead.pipelines.length > 0 ? (
        <div className="flex items-start gap-2 text-sm">
          <GitBranch className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {lead.pipelines.map((p, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-primary/5">
                {p.pipeline_nome}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <GitBranch className="h-3.5 w-3.5" />
          <span>Sem pipeline</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {lead.origem && (
          <Badge variant="secondary" className="text-xs">
            {lead.origem}
          </Badge>
        )}
        {lead.segmento && (
          <Badge variant="outline" className="text-xs">
            {lead.segmento}
          </Badge>
        )}
        {lead.lead_score !== undefined && lead.lead_score !== null && (
          <Badge className="bg-primary/10 text-primary text-xs">
            Score: {lead.lead_score}
          </Badge>
        )}
      </div>

      {/* Ações individuais */}
      <div className="flex gap-2 pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onMerge(lead.id, lead === lead1 ? lead2.id : lead1.id)}
                  disabled={loading || !isAdmin}
                  className="w-full"
                >
                  <Merge className="h-3.5 w-3.5 mr-1.5" />
                  Manter este
                </Button>
              </div>
            </TooltipTrigger>
            {!isAdmin && (
              <TooltipContent>
                <p>Apenas administradores podem mesclar leads</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Botão de descadastrar */}
          {onUnsubscribe && lead.pipelines && lead.pipelines.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUnsubscribe(lead.id)}
                  disabled={loading}
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descadastrar de todos os pipelines</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(lead.id)}
                disabled={loading || !isAdmin}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            {!isAdmin && (
              <TooltipContent>
                <p>Apenas administradores podem excluir leads</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  const lead1Date = new Date(lead1.created_at || 0);
  const lead2Date = new Date(lead2.created_at || 0);
  const isLead1Older = lead1Date < lead2Date;

  return (
    <Card className="border-l-4 border-l-warning">
      <CardContent className="p-4">
        {/* Header com tipo de match */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', getConfidenceColor())}>
              {confidence === 'alta' ? 'Alta certeza' : confidence === 'media' ? 'Média certeza' : 'Baixa certeza'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getMatchLabel()}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onKeepBoth}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Não é duplicata
          </Button>
        </div>

        {/* Comparação lado a lado */}
        <div className="flex gap-4">
          <LeadColumn lead={lead1} isOlder={isLead1Older} />
          
          <div className="flex items-center justify-center px-2">
            <div className="h-full w-px bg-border" />
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
            <div className="h-full w-px bg-border" />
          </div>
          
          <LeadColumn lead={lead2} isOlder={!isLead1Older} />
        </div>
      </CardContent>
    </Card>
  );
});
