import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateUrgency, getUrgencyLabel } from '@/utils/appointmentNotifier';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentBadgeProps {
  startAt: string;
  title?: string;
  compact?: boolean;
}

export function AppointmentBadge({ startAt, title, compact = false }: AppointmentBadgeProps) {
  const urgency = calculateUrgency(startAt);
  const label = getUrgencyLabel(urgency);
  
  const variantMap = {
    critical: 'destructive' as const,
    alert: 'default' as const,
    reminder: 'secondary' as const,
    normal: 'outline' as const,
  };

  const formattedDate = format(new Date(startAt), "dd/MM 'às' HH:mm", { locale: ptBR });

  if (compact) {
    return (
      <Badge variant={variantMap[urgency]} className="text-xs gap-1">
        <Clock className="h-3 w-3" />
        {label || formattedDate}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={variantMap[urgency]} className="gap-1">
        <Calendar className="h-3 w-3" />
        {formattedDate}
      </Badge>
      {label && urgency !== 'normal' && (
        <span className="font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
