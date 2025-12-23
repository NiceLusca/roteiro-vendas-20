import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

const MetricItem = memo(function MetricItem({ 
  icon, 
  label, 
  value, 
  subValue, 
  colorClass = 'text-foreground' 
}: MetricItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className={cn("p-2 rounded-lg bg-muted/50", colorClass)}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-lg font-bold", colorClass)}>{value}</span>
          {subValue && (
            <span className="text-xs text-muted-foreground">{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
});

interface PipelineMetricsBarProps {
  entries: Array<{
    id: string;
    data_entrada_etapa?: string | null;
    saude_etapa?: string | null;
    etapa_atual_id?: string | null;
    created_at?: string | null;
  }>;
  stages: Array<{
    id: string;
    prazo_em_dias?: number | null;
  }>;
}

export const PipelineMetricsBar = memo(function PipelineMetricsBar({
  entries,
  stages
}: PipelineMetricsBarProps) {
  const metrics = useMemo(() => {
    const totalLeads = entries.length;
    
    // Leads atrasados (SLA vencido)
    const overdueLeads = entries.filter(entry => {
      if (!entry.data_entrada_etapa || !entry.etapa_atual_id) return false;
      const stage = stages.find(s => s.id === entry.etapa_atual_id);
      const prazo = stage?.prazo_em_dias || 7;
      const daysInStage = Math.floor(
        (Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysInStage > prazo;
    }).length;

    // Tempo médio na etapa (dias)
    const avgDaysInStage = entries.length > 0
      ? entries.reduce((sum, entry) => {
          if (!entry.data_entrada_etapa) return sum;
          const days = Math.floor(
            (Date.now() - new Date(entry.data_entrada_etapa).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / entries.length
      : 0;

    // Leads adicionados nos últimos 7 dias
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLeads = entries.filter(entry => {
      const createdAt = entry.created_at ? new Date(entry.created_at).getTime() : 0;
      return createdAt > sevenDaysAgo;
    }).length;

    // Taxa de saúde (leads verdes / total)
    const healthyLeads = entries.filter(e => e.saude_etapa === 'Verde').length;
    const healthRate = totalLeads > 0 ? Math.round((healthyLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      overdueLeads,
      avgDaysInStage: avgDaysInStage.toFixed(1),
      recentLeads,
      healthRate
    };
  }, [entries, stages]);

  return (
    <Card className="flex items-center divide-x divide-border bg-card/80 backdrop-blur-sm border shadow-sm">
      <MetricItem
        icon={<Users className="h-4 w-4 text-primary" />}
        label="Total de leads"
        value={metrics.totalLeads}
        colorClass="text-foreground"
      />
      
      <MetricItem
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        label="Atrasados"
        value={metrics.overdueLeads}
        subValue={metrics.totalLeads > 0 ? `(${Math.round((metrics.overdueLeads / metrics.totalLeads) * 100)}%)` : ''}
        colorClass={metrics.overdueLeads > 0 ? "text-destructive" : "text-muted-foreground"}
      />
      
      <MetricItem
        icon={<Clock className="h-4 w-4 text-secondary" />}
        label="Tempo médio"
        value={metrics.avgDaysInStage}
        subValue="dias"
        colorClass="text-foreground"
      />
      
      <MetricItem
        icon={<TrendingUp className="h-4 w-4 text-success" />}
        label="Últimos 7 dias"
        value={`+${metrics.recentLeads}`}
        subValue="leads"
        colorClass="text-success"
      />
      
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Saúde do pipeline</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  metrics.healthRate >= 70 ? "bg-success" :
                  metrics.healthRate >= 40 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${metrics.healthRate}%` }}
              />
            </div>
            <span className={cn(
              "text-sm font-bold",
              metrics.healthRate >= 70 ? "text-success" :
              metrics.healthRate >= 40 ? "text-warning" : "text-destructive"
            )}>
              {metrics.healthRate}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
});
