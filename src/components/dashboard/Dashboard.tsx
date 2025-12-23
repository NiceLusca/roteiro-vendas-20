import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
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

export const Dashboard = memo(function Dashboard() {
  const { leads, loading: leadsLoading } = useSupabaseLeads();
  const { appointments, loading: appointmentsLoading } = useSupabaseAppointments();
  const { pipelines, loading: pipelinesLoading } = useSupabasePipelines();
  const { deals, loading: dealsLoading } = useSupabaseDeals();
  const { orders, loading: ordersLoading } = useSupabaseOrders();
  const { entries, loading: entriesLoading } = useSupabaseLeadPipelineEntries();

  const isLoading = leadsLoading || appointmentsLoading || pipelinesLoading || dealsLoading || ordersLoading || entriesLoading;

  // Calculate metrics from real data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const metrics = {
    leads_por_status: {
      lead: leads.filter(l => l.status_geral === 'lead').length,
      cliente: leads.filter(l => l.status_geral === 'cliente').length,
      perdido: leads.filter(l => l.status_geral === 'perdido').length
    },
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
      const lead = leads.find(l => l.id === entry.lead_id);
      const pipeline = pipelines.find(p => p.id === entry.pipeline_id);
      
      // Buscar stages via API se necessário ou usar dados já carregados
      const stage = {
        id: entry.etapa_atual_id,
        nome: 'Etapa Atual', // Placeholder - idealmente buscar do banco
        proximo_passo_label: 'Próximo passo'
      };
      
      return {
        ...entry,
        lead,
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
          trend={{ value: 8, positive: true, label: "+8%" }}
        />
        <MetricCard
          title="Sessões Hoje"
          value={metrics.sessoes_hoje}
          icon={Calendar}
          trend={{ value: 2, positive: true, label: "+2" }}
        />
        <MetricCard
          title="Deals Abertas"
          value={metrics.deals_abertas}
          icon={TrendingUp}
          trend={{ value: 5, positive: true, label: "+5" }}
        />
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(metrics.receita_mes)}
          icon={DollarSign}
          trend={{ value: 12, positive: true, label: "+12%" }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Passos */}
        <Card>
          <CardHeader>
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
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {item.lead?.nome}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          item.saude_etapa === 'Verde' ? 'health-verde' :
                          item.saude_etapa === 'Amarelo' ? 'health-amarelo' :
                          'health-vermelho'
                        }
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
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximos Agendamentos */}
        <Card>
          <CardHeader>
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
                const lead = leads.find(l => l.id === appointment.lead_id);
                return (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{lead?.nome || 'Lead não encontrado'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(new Date(appointment.start_at))}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
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
        <Card>
          <CardHeader>
            <CardTitle>Status dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leads.filter(l => l.status_geral === 'lead').length > 0 ? (
              <div className="space-y-4">
                {['lead', 'cliente', 'perdido'].map((status) => {
                  const count = leads.filter(l => l.status_geral === status).length;
                  const label = status === 'lead' ? 'Leads' : status === 'cliente' ? 'Clientes' : 'Perdidos';
                  const color = status === 'cliente' ? 'bg-green-500' : 
                               status === 'lead' ? 'bg-blue-500' : 'bg-red-500';
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span>{label}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Principais Objeções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const objections = leads
                  .filter(l => l.objecao_principal)
                  .reduce((acc, lead) => {
                    const objecao = lead.objecao_principal;
                    acc[objecao] = (acc[objecao] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                
                const topObjections = Object.entries(objections)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5);
                
                if (topObjections.length === 0) {
                  return (
                    <EmptyState
                      title="Nenhuma objeção registrada"
                      description="As objeções aparecerão aqui conforme você registra leads"
                      icon={<AlertTriangle className="w-12 h-12" />}
                    />
                  );
                }
                
                return topObjections.map(([objecao, count]) => (
                  <div key={objecao} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{objecao}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});