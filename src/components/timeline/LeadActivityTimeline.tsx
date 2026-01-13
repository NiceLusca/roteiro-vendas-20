import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  FileText, 
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
  History
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LeadActivity, ActivityType, useLeadActivityLog } from '@/hooks/useLeadActivityLog';

interface LeadActivityTimelineProps {
  leadId: string;
  pipelineEntryId?: string;
  maxHeight?: string;
}

const activityConfig: Record<ActivityType, {
  icon: typeof ArrowRight;
  label: string;
  color: string;
}> = {
  stage_change: {
    icon: ArrowRight,
    label: 'Movimentação',
    color: 'bg-primary/10 text-primary'
  },
  note_added: {
    icon: MessageSquare,
    label: 'Comentário',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  },
  attachment_added: {
    icon: Paperclip,
    label: 'Anexo',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  attachment_deleted: {
    icon: Trash2,
    label: 'Anexo removido',
    color: 'bg-destructive/10 text-destructive'
  },
  responsible_added: {
    icon: UserPlus,
    label: 'Responsável',
    color: 'bg-success/10 text-success'
  },
  responsible_removed: {
    icon: UserMinus,
    label: 'Responsável',
    color: 'bg-warning/10 text-warning'
  },
  inscription: {
    icon: PlusCircle,
    label: 'Inscrição',
    color: 'bg-success/10 text-success'
  },
  archive: {
    icon: Archive,
    label: 'Arquivado',
    color: 'bg-muted/50 text-muted-foreground'
  },
  transfer: {
    icon: GitBranch,
    label: 'Transferência',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
  },
  lead_created: {
    icon: PlusCircle,
    label: 'Criação',
    color: 'bg-success/10 text-success'
  },
  lead_updated: {
    icon: Pencil,
    label: 'Atualização',
    color: 'bg-muted/50 text-muted-foreground'
  }
};

function formatActivityDescription(activity: LeadActivity): string {
  const details = activity.details || {};
  
  switch (activity.activity_type) {
    case 'stage_change':
      return `Moveu de "${details.from_stage || '?'}" para "${details.to_stage || '?'}"`;
    
    case 'note_added':
      const notePreview = details.note_preview || details.note_text || '';
      return notePreview.length > 80 ? `${notePreview.substring(0, 80)}...` : notePreview || 'Adicionou um comentário';
    
    case 'attachment_added':
      return `Anexou "${details.file_name || 'arquivo'}"`;
    
    case 'attachment_deleted':
      return `Removeu anexo "${details.file_name || 'arquivo'}"`;
    
    case 'responsible_added':
      return `Adicionou ${details.responsible_name || 'responsável'}`;
    
    case 'responsible_removed':
      return `Removeu ${details.responsible_name || 'responsável'}`;
    
    case 'inscription':
      return `Inscreveu no pipeline "${details.pipeline_name || '?'}" na etapa "${details.stage_name || '?'}"`;
    
    case 'archive':
      return `Arquivou do pipeline "${details.pipeline_name || '?'}"${details.reason ? `: ${details.reason}` : ''}`;
    
    case 'transfer':
      return `Transferiu de "${details.from_pipeline || '?'}" para "${details.to_pipeline || '?'}"`;
    
    case 'lead_created':
      return `Lead criado${details.origem ? ` (origem: ${details.origem})` : ''}`;
    
    case 'lead_updated':
      const fields = details.fields_changed || [];
      return fields.length > 0 
        ? `Atualizou: ${fields.slice(0, 3).join(', ')}${fields.length > 3 ? ` +${fields.length - 3}` : ''}`
        : 'Atualizou dados do lead';
    
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

  const fullDate = useMemo(() => {
    return format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  }, [activity.created_at]);

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="secondary" className={`text-xs ${config.color}`}>
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground" title={fullDate}>
            {timeAgo}
          </span>
        </div>
        
        <p className="text-sm text-foreground">
          {formatActivityDescription(activity)}
        </p>
        
        {activity.performed_by_name && (
          <p className="text-xs text-muted-foreground mt-1">
            Por: {activity.performed_by_name}
          </p>
        )}
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
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-2 pr-4">
              {activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
