import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/formatters';
import { AuditLog, Interaction, PipelineEvent, AppointmentEvent } from '@/types/crm';
import { Calendar, MessageSquare, GitCommit, User, Edit } from 'lucide-react';

type TimelineEvent = 
  | (AuditLog & { type: 'audit' })
  | (Interaction & { type: 'interaction' })
  | (PipelineEvent & { type: 'pipeline' })
  | (AppointmentEvent & { type: 'appointment' });

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className = '' }: TimelineProps) {
  const sortedEvents = events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'audit':
        return <Edit className="w-4 h-4" />;
      case 'interaction':
        return <MessageSquare className="w-4 h-4" />;
      case 'pipeline':
        return <GitCommit className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getEventTitle = (event: TimelineEvent) => {
    switch (event.type) {
      case 'audit':
        return `${event.entidade} alterado`;
      case 'interaction':
        return `${event.canal} - ${event.autor}`;
      case 'pipeline':
        return `Pipeline: ${event.tipo}`;
      case 'appointment':
        return `Agendamento: ${event.tipo}`;
      default:
        return 'Evento';
    }
  };

  const getEventDescription = (event: TimelineEvent) => {
    switch (event.type) {
      case 'audit':
        return event.alteracao.map(alt => `${alt.campo}: ${alt.de} → ${alt.para}`).join(', ');
      case 'interaction':
        return event.conteudo;
      case 'pipeline':
        return event.detalhes ? JSON.stringify(event.detalhes) : `De ${event.de_etapa_id || 'início'} para ${event.para_etapa_id || 'fim'}`;
      case 'appointment':
        return event.antes && event.depois ? 
          `Status: ${event.antes.status} → ${event.depois.status}` : 
          'Alteração no agendamento';
      default:
        return '';
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'audit':
        return 'bg-muted';
      case 'interaction':
        return 'bg-primary/10';
      case 'pipeline':
        return 'bg-success/10';
      case 'appointment':
        return 'bg-warning/10';
      default:
        return 'bg-muted';
    }
  };

  if (sortedEvents.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        Nenhum evento registrado ainda
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedEvents.map((event, index) => (
        <Card key={`${event.type}-${event.id}-${index}`} className="border-l-4 border-l-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 p-2 rounded-full ${getEventColor(event)}`}>
                {getEventIcon(event)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    {getEventTitle(event)}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {formatDateTime(new Date(event.timestamp))}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {getEventDescription(event)}
                </p>
                
                {'ator' in event && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Por: {event.ator}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}