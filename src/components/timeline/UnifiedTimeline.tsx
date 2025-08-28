import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { TimelineEvent, Lead, Appointment, Deal, Interaction, PipelineEvent, AuditLog } from '@/types/crm';
import { InteractionDialog } from '@/components/interaction/InteractionDialog';

interface UnifiedTimelineProps {
  leadId: string;
  lead: Lead;
  appointments: Appointment[];
  deals: Deal[];
  interactions: Interaction[];
  pipelineEvents: PipelineEvent[];
  auditLogs: AuditLog[];
  onAddInteraction?: (interaction: Omit<Interaction, 'id' | 'timestamp'>) => void;
}

export function UnifiedTimeline({
  leadId,
  lead,
  appointments,
  deals,
  interactions,
  pipelineEvents,
  auditLogs,
  onAddInteraction
}: UnifiedTimelineProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [interactionDialog, setInteractionDialog] = useState(false);

  // Consolidar todos os eventos em uma timeline unificada
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Appointments
    appointments.forEach(apt => {
      events.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: `Sessão ${apt.status}`,
        description: apt.resultado_obs || `Sessão ${apt.status.toLowerCase()}`,
        timestamp: apt.start_at,
        icon: Calendar,
        entityId: apt.id,
        details: {
          status: apt.status,
          origem: apt.origem,
          resultado_sessao: apt.resultado_sessao
        }
      });
    });

    // Deals
    deals.forEach(deal => {
      events.push({
        id: `deal-${deal.id}`,
        type: 'deal',
        title: `Negociação ${deal.status}`,
        description: `Valor: R$ ${deal.valor_proposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        timestamp: deal.created_at,
        icon: TrendingUp,
        entityId: deal.id,
        details: {
          status: deal.status,
          valor_proposto: deal.valor_proposto,
          fase_negociacao: deal.fase_negociacao
        }
      });
    });

    // Interactions
    interactions.forEach(interaction => {
      events.push({
        id: `interaction-${interaction.id}`,
        type: 'interaction',
        title: `Interação via ${interaction.canal}`,
        description: interaction.conteudo,
        timestamp: interaction.timestamp,
        icon: MessageSquare,
        entityId: interaction.id,
        details: {
          canal: interaction.canal,
          autor: interaction.autor
        }
      });
    });

    // Pipeline Events
    pipelineEvents.forEach(event => {
      events.push({
        id: `pipeline-${event.id}`,
        type: 'pipeline',
        title: `Pipeline ${event.tipo}`,
        description: event.detalhes?.descricao || `Lead ${event.tipo.toLowerCase()}`,
        timestamp: event.timestamp,
        icon: Users,
        entityId: event.id,
        details: {
          tipo: event.tipo,
          ator: event.ator,
          de_etapa_id: event.de_etapa_id,
          para_etapa_id: event.para_etapa_id
        }
      });
    });

    // Audit Logs
    auditLogs.forEach(log => {
      events.push({
        id: `audit-${log.id}`,
        type: 'audit',
        title: `${log.entidade} alterado`,
        description: `${log.alteracao.length} campo(s) modificado(s)`,
        timestamp: log.timestamp,
        icon: FileText,
        entityId: log.id,
        details: {
          entidade: log.entidade,
          alteracao: log.alteracao,
          ator: log.ator
        }
      });
    });

    // Lead creation
    events.push({
      id: 'lead-created',
      type: 'pipeline',
      title: 'Lead criado',
      description: `Origem: ${lead.origem}`,
      timestamp: lead.created_at,
      icon: Users,
      entityId: lead.id,
      details: {
        origem: lead.origem,
        segmento: lead.segmento
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [appointments, deals, interactions, pipelineEvents, auditLogs, lead]);

  // Aplicar filtros
  const filteredEvents = timelineEvents.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) {
      return false;
    }
    
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !event.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'deal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'interaction':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'pipeline':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'audit':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleSaveInteraction = (interaction: Omit<Interaction, 'id' | 'timestamp'>) => {
    onAddInteraction?.(interaction);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-64">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar na timeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            <SelectItem value="appointment">Agendamentos</SelectItem>
            <SelectItem value="deal">Negociações</SelectItem>
            <SelectItem value="interaction">Interações</SelectItem>
            <SelectItem value="pipeline">Pipeline</SelectItem>
            <SelectItem value="audit">Auditoria</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={() => setInteractionDialog(true)}
          className="ml-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Interação
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Timeline de Atividades
            <Badge variant="secondary">{filteredEvents.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {filterType === 'all' 
                  ? 'Nenhuma atividade encontrada'
                  : `Nenhuma atividade do tipo selecionado`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-4 rounded-lg border">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <event.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge className={getEventBadgeColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(event.timestamp)}</span>
                      {event.details?.autor && (
                        <span>Por: {event.details.autor}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interaction Dialog */}
      <InteractionDialog
        open={interactionDialog}
        onOpenChange={setInteractionDialog}
        leadId={leadId}
        leadName={lead.nome}
        onSave={handleSaveInteraction}
      />
    </div>
  );
}