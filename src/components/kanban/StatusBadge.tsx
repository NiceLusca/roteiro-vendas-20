import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Verde' | 'Amarelo' | 'Vermelho';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function StatusBadge({ status, size = 'md', animated = false }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Verde':
        return {
          className: 'bg-success/20 text-success border-success/30 hover:bg-success/30',
          indicator: 'bg-success',
          label: 'Saudável'
        };
      case 'Amarelo':
        return {
          className: 'bg-warning/20 text-warning border-warning/30 hover:bg-warning/30',
          indicator: 'bg-warning',
          label: 'Atenção'
        };
      case 'Vermelho':
        return {
          className: 'bg-danger/20 text-danger border-danger/30 hover:bg-danger/30',
          indicator: 'bg-danger',
          label: 'Crítico'
        };
      default:
        return {
          className: 'bg-muted/20 text-muted-foreground',
          indicator: 'bg-muted-foreground',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClass = {
    sm: 'text-xs h-5',
    md: 'text-sm h-6',
    lg: 'text-base h-7'
  }[size];

  return (
    <Badge 
      variant="outline"
      className={cn(
        config.className,
        sizeClass,
        "flex items-center gap-1 font-medium transition-all duration-200",
        animated && "animate-pulse"
      )}
    >
      <div 
        className={cn(
          "w-2 h-2 rounded-full",
          config.indicator,
          animated && "animate-pulse"
        )} 
      />
      {status}
    </Badge>
  );
}