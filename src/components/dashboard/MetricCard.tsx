import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'border-border',
  success: 'border-success/20 bg-success/5',
  warning: 'border-warning/20 bg-warning/5', 
  danger: 'border-danger/20 bg-danger/5'
};

const iconStyles = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger'
};

const gradientStyles = {
  default: 'from-primary/80 to-secondary/60',
  success: 'from-success/80 to-success/50',
  warning: 'from-warning/80 to-warning/50',
  danger: 'from-danger/80 to-danger/50'
};

export const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  variant = 'default',
  className 
}: MetricCardProps) {
  return (
    <Card className={cn(
      'metric-card-enhanced relative overflow-hidden',
      variantStyles[variant],
      className
    )}>
      {/* Gradient line at top */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
        gradientStyles[variant]
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'p-2 rounded-lg bg-muted/50',
          variant !== 'default' && `bg-${variant}/10`
        )}>
          <Icon className={cn('h-4 w-4', iconStyles[variant])} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-2 mt-3">
            <Badge 
              className={cn(
                'text-xs gap-1',
                trend.positive 
                  ? 'status-badge-success' 
                  : 'status-badge-danger'
              )}
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.positive ? '+' : ''}{trend.value}%
            </Badge>
            <span className="text-xs text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
