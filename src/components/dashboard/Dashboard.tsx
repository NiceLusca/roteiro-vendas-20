import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabaseDeals } from '@/hooks/useSupabaseDeals';
import { useSupabaseOrders } from '@/hooks/useSupabaseOrders';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { EmptyState } from '@/components/ui/enhanced-loading';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dashboard = memo(function Dashboard() {
  const { data: dashboardMetrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { appointments, loading: appointmentsLoading } = useSupabaseAppointments();
  const { pipelines, loading: pipelinesLoading } = useSupabasePipelines();
  const { deals, loading: dealsLoading } = useSupabaseDeals();
  const { orders, loading: ordersLoading } = useSupabaseOrders();
  const { entries, loading: entriesLoading } = useSupabaseLeadPipelineEntries();

  const isLoading = metricsLoading || appointmentsLoading || pipelinesLoading || dealsLoading || ordersLoading || entriesLoading;

  // Calculate metrics from real data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const metrics = {
    leads_por_status: dashboardMetrics?.leads_por_status || { lead: 0, cliente: 0, perdido: 0 },
    sessoes_hoje: appointments.filter(a => {
      const today = new Date();
      const aptDate = new Date(a.start_at);
      return aptDate.toDateString() === today.toDateString();
    }).length,
    deals_abertas: deals.filter(d => d.status === 'Aberta').length,
    receita_mes: orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear &&
               o.status_pagamento === 'pago';
      })
      .reduce((total, order) => total + order.valor_total, 0)
  };

  // Próximos agendamentos (próximas 48h)
  const proximosAgendamentos = appointments
    .filter(apt => apt.status === 'Agendado' && new Date(apt.start_at) > new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 5);

  // Próximos passos urgentes - leads em atraso ou próximos ao vencimento  
  const proximosPassos = entries
    .filter(entry => {
      return entry.dias_em_atraso > 0 || 
             (entry.data_prevista_proxima_etapa && 
              new Date(entry.data_prevista_proxima_etapa) <= new Date(Date.now() + 24 * 60 * 60 * 1000));
    })
    .sort((a, b) => (b.dias_em_atraso || 0) - (a.dias_em_atraso || 0))
    .slice(0, 5)
    .map(entry => {
      const pipeline = pipelines.find(p => p.id === entry.pipeline_id);
      
      // Usar dados do JOIN (entry.leads)
      const stage = {
        id: entry.etapa_atual_id,
        nome: 'Etapa Atual',
        proximo_passo_label: 'Próximo passo'
      };
      
      return {
        ...entry,
        lead: entry.leads, // Usar dados do JOIN
        stage
      };
    });

  const totalLeads = Object.values(metrics.leads_por_status).reduce((a, b) => a + b, 0);
  const taxaConversao = totalLeads > 0 ? ((metrics.leads_por_status.cliente / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas vendas e pipeline
          </p>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Leads Ativos"
          value={metrics.leads_por_status.lead}
          icon={Users}
          description="em prospecção"
        />
        <MetricCard
          title="Sessões Hoje"
          value={metrics.sessoes_hoje}
          icon={Calendar}
          description="agendadas para hoje"
        />
        <MetricCard
          title="Deals Abertas"
          value={metrics.deals_abertas}
          icon={TrendingUp}
          description="em negociação"
        />
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(metrics.receita_mes)}
          icon={DollarSign}
          description="pedidos pagos"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Passos */}
        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Próximos Passos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximosPassos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum passo urgente no momento 👍
              </p>
            ) : (
              proximosPassos.map((item) => (
                <div
                  key={item.id}
                  className="list-item-hover flex items-center justify-between p-3 border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {item.lead?.nome}
                      </span>
                      <Badge
                        className={cn(
                          'status-badge',
                          item.saude_etapa === 'Verde' ? 'status-badge-success' :
                          item.saude_etapa === 'Amarelo' ? 'status-badge-warning' :
                          'status-badge-danger'
                        )}
                      >
                        {item.saude_etapa}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.stage?.nome} • {item.stage?.proximo_passo_label}
                    </p>
                    {item.dias_em_atraso > 0 && (
                      <p className="text-xs text-danger">
                        {item.dias_em_atraso} dias em atraso
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="hover:bg-primary/10">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximos Agendamentos */}
        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximosAgendamentos.length === 0 ? (
              <EmptyState
                title="Nenhum agendamento próximo"
                description="Não há agendamentos programados para os próximos dias"
                icon={<Calendar className="w-12 h-12" />}
              />
            ) : (
              proximosAgendamentos.map((appointment) => {
                // Find lead name from entries (using JOIN data)
                const entry = entries.find(e => e.lead_id === appointment.lead_id);
                const leadName = entry?.leads?.nome || 'Lead não encontrado';
                return (
                  <div key={appointment.id} className="list-item-hover flex items-center justify-between p-3 border">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{leadName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(new Date(appointment.start_at))}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="hover:bg-primary/10">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status dos Leads e Top Objeções */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle>Status dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {totalLeads > 0 ? (
              <div className="space-y-4">
                {(['lead', 'cliente', 'perdido'] as const).map((status) => {
                  const count = metrics.leads_por_status[status];
                  const label = status === 'lead' ? 'Leads' : status === 'cliente' ? 'Clientes' : 'Perdidos';
                  const badgeClass = status === 'cliente' ? 'status-badge-success' : 
                               status === 'lead' ? 'status-badge-info' : 'status-badge-danger';
                  
                  return (
                    <div key={status} className="list-item-hover flex items-center justify-between p-2">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          status === 'cliente' ? 'bg-success' : 
                          status === 'lead' ? 'bg-secondary' : 'bg-danger'
                        )} />
                        <span className="font-medium">{label}</span>
                      </div>
                      <Badge className={cn('status-badge', badgeClass)}>{count}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Nenhum lead encontrado"
                description="Comece criando seus primeiros leads"
                icon={<Users className="w-12 h-12" />}
              />
            )}
          </CardContent>
        </Card>

        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pipeline Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leads em pipeline</span>
                    <Badge>{entries.filter(e => e.status_inscricao === 'Ativo').length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Em atraso</span>
                    <Badge variant="destructive">{entries.filter(e => e.dias_em_atraso > 0).length}</Badge>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Nenhum lead em pipeline"
                  description="Inscreva leads em pipelines para acompanhar"
                  icon={<TrendingUp className="w-12 h-12" />}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});