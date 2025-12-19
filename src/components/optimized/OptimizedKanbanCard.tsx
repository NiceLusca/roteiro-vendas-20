import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  Clock,
  User
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface OptimizedKanbanCardProps {
  entry: {
    id: string;
    lead_id: string;
    lead?: {
      id: string;
      nome: string;
      lead_score: number;
      closer?: string;
    };
    dias_em_atraso: number;
    saude_etapa: 'Verde' | 'Amarelo' | 'Vermelho';
    data_entrada_etapa: Date;
  };
  onViewLead: (leadId: string) => void;
  onCreateAppointment: (leadId: string, leadName: string) => void;
  onAdvanceStage: (entryId: string, leadId: string, leadName: string) => void;
  onRegisterInteraction: (leadId: string, leadName: string) => void;
}

export const OptimizedKanbanCard = memo(function OptimizedKanbanCard({
  entry,
  onViewLead,
  onCreateAppointment,
  onAdvanceStage,
  onRegisterInteraction
}: OptimizedKanbanCardProps) {

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Verde': return 'bg-success text-success-foreground';
      case 'Amarelo': return 'bg-warning text-warning-foreground';
      case 'Vermelho': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  if (!entry.lead) {
    return null;
  }

  return (
    <div className="mb-3">
      <Card className="hover:shadow-md transition-all duration-200 hover-scale">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {entry.lead.nome}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getHealthColor(entry.saude_etapa)}`}
                  >
                    {entry.saude_etapa}
                  </Badge>
                  <span className={`text-xs font-medium ${getScoreColor(entry.lead.lead_score)}`}>
                    {entry.lead.lead_score}pts
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1 text-xs text-muted-foreground">
              {entry.lead.closer && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{entry.lead.closer}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(entry.data_entrada_etapa)}</span>
              </div>
              {entry.dias_em_atraso > 0 && (
                <div className="text-destructive font-medium">
                  {entry.dias_em_atraso} dias em atraso
                </div>
              )}
            </div>


            {/* Actions */}
            <div className="flex gap-1 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLead(entry.lead_id);
                }}
                className="h-7 px-2"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateAppointment(entry.lead_id, entry.lead!.nome);
                }}
                className="h-7 px-2"
              >
                <Calendar className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegisterInteraction(entry.lead_id, entry.lead!.nome);
                }}
                className="h-7 px-2"
              >
                <MessageSquare className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvanceStage(entry.id, entry.lead_id, entry.lead!.nome);
                }}
                className="h-7 px-2"
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});