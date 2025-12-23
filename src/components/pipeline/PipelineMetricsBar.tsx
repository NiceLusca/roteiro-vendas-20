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
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className={cn("p-1.5 rounded-md bg-muted/40", colorClass)}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-sm font-semibold", colorClass)}>{value}</span>
          {subValue && (
            <span className="text-[10px] text-muted-foreground">{subValue}</span>
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

    // Taxa de saúde = leads dentro do prazo (não atrasados)
    const healthyLeads = totalLeads - overdueLeads;
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
    <div className="flex items-center divide-x divide-border/50 bg-muted/30 rounded-lg border border-border/50">
      <MetricItem
        icon={<Users className="h-3.5 w-3.5 text-primary" />}
        label="Total"
        value={metrics.totalLeads}
        colorClass="text-foreground"
      />
      
      <MetricItem
        icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        label="Atrasados"
        value={metrics.overdueLeads}
        subValue={metrics.totalLeads > 0 ? `(${Math.round((metrics.overdueLeads / metrics.totalLeads) * 100)}%)` : ''}
        colorClass={metrics.overdueLeads > 0 ? "text-destructive" : "text-muted-foreground"}
      />
      
      <MetricItem
        icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
        label="Tempo médio"
        value={metrics.avgDaysInStage}
        subValue="dias"
        colorClass="text-foreground"
      />
      
      <MetricItem
        icon={<TrendingUp className="h-3.5 w-3.5 text-success" />}
        label="Novos (7d)"
        value={`+${metrics.recentLeads}`}
        colorClass="text-success"
      />
      
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-medium leading-tight">Saúde</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
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
              "text-sm font-semibold",
              metrics.healthRate >= 70 ? "text-success" :
              metrics.healthRate >= 40 ? "text-warning" : "text-destructive"
            )}>
              {metrics.healthRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
