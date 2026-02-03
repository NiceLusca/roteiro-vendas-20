import { useMemo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  MessageSquare, 
  UserPlus, 
  UserMinus, 
  Paperclip,
  Trash2,
  GitBranch,
  Archive,
  PlusCircle,
  Pencil,
  Clock,
  History,
  CalendarX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LeadActivity, ActivityType, useLeadActivityLog } from '@/hooks/useLeadActivityLog';

interface LeadActivityTimelineProps {
  leadId: string;
  pipelineEntryId?: string;
  maxHeight?: string;
}

const activityConfig: Record<ActivityType, {
  icon: typeof ArrowRight;
  color: string;
}> = {
  stage_change: {
    icon: ArrowRight,
    color: 'bg-primary/10 text-primary'
  },
  note_added: {
    icon: MessageSquare,
    color: 'bg-purple-500/10 text-purple-600'
  },
  attachment_added: {
    icon: Paperclip,
    color: 'bg-blue-500/10 text-blue-600'
  },
  attachment_deleted: {
    icon: Trash2,
    color: 'bg-destructive/10 text-destructive'
  },
  responsible_added: {
    icon: UserPlus,
    color: 'bg-success/10 text-success'
  },
  responsible_removed: {
    icon: UserMinus,
    color: 'bg-warning/10 text-warning'
  },
  inscription: {
    icon: PlusCircle,
    color: 'bg-success/10 text-success'
  },
  archive: {
    icon: Archive,
    color: 'bg-muted/50 text-muted-foreground'
  },
  transfer: {
    icon: GitBranch,
    color: 'bg-orange-500/10 text-orange-600'
  },
  lead_created: {
    icon: PlusCircle,
    color: 'bg-success/10 text-success'
  },
  lead_updated: {
    icon: Pencil,
    color: 'bg-muted/50 text-muted-foreground'
  },
  appointment_deleted: {
    icon: CalendarX,
    color: 'bg-destructive/10 text-destructive'
  }
};

function formatActivityDescription(activity: LeadActivity): ReactNode {
  const details = activity.details || {};
  const performer = activity.performed_by_name;
  
  const PerformerName = () => performer 
    ? <span className="font-semibold text-foreground">{performer}</span> 
    : <span className="text-muted-foreground">Sistema</span>;

  switch (activity.activity_type) {
    case 'stage_change':
      return <><PerformerName /> moveu para "{details.to_stage || '?'}"</>;
    
    case 'note_added':
      const notePreview = details.note_preview || details.note_text || '';
      const truncated = notePreview.length > 50 
        ? `${notePreview.substring(0, 50)}...` 
        : notePreview;
      return <><PerformerName /> comentou{truncated ? `: "${truncated}"` : ''}</>;
    
    case 'attachment_added':
      return <><PerformerName /> anexou "{details.file_name || 'arquivo'}"</>;
    
    case 'attachment_deleted':
      return <><PerformerName /> removeu anexo "{details.file_name || 'arquivo'}"</>;
    
    case 'responsible_added':
      return <><PerformerName /> adicionou <span className="font-medium">{details.responsible_name || 'responsável'}</span></>;
    
    case 'responsible_removed':
      return <><PerformerName /> removeu <span className="font-medium">{details.responsible_name || 'responsável'}</span></>;
    
    case 'inscription':
      return <><PerformerName /> inscreveu em "{details.stage_name || details.pipeline_name || '?'}"</>;
    
    case 'archive':
      return <><PerformerName /> arquivou{details.reason ? `: ${details.reason}` : ''}</>;
    
    case 'transfer':
      return <><PerformerName /> transferiu para "{details.to_pipeline || '?'}"</>;
    
    case 'lead_created':
      return <>Lead criado{details.origem ? ` via ${details.origem}` : ''}</>;
    
    case 'lead_updated':
      const fields = details.fields_changed || [];
      return <><PerformerName /> atualizou {fields.length > 0 ? fields.slice(0, 2).join(', ') : 'dados'}</>;
    
    case 'appointment_deleted':
      const aptDate = details.data_hora ? new Date(details.data_hora).toLocaleDateString('pt-BR') : '';
      return <><PerformerName /> deletou agendamento{aptDate ? ` de ${aptDate}` : ''}{details.titulo ? `: "${details.titulo}"` : ''}</>;
    
    default:
      return 'Ação registrada';
  }
}

function ActivityItem({ activity }: { activity: LeadActivity }) {
  const config = activityConfig[activity.activity_type] || activityConfig.lead_updated;
  const Icon = config.icon;
  
  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(activity.created_at), { 
      addSuffix: true, 
      locale: ptBR 
    });
  }, [activity.created_at]);

  return (
    <div className="flex gap-3 py-2">
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">
          {formatActivityDescription(activity)}
        </p>
        <span className="text-xs text-muted-foreground/70">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

export function LeadActivityTimeline({ leadId, pipelineEntryId, maxHeight = '500px' }: LeadActivityTimelineProps) {
  const { activities, loading } = useLeadActivityLog(leadId, pipelineEntryId);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Histórico de Atividades
          <Badge variant="secondary" className="ml-auto">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda
            </p>
          </div>
        ) : (
          <div 
            className="overflow-y-auto pr-2" 
            style={{ maxHeight }}
          >
            <div className="space-y-2">
              {activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
