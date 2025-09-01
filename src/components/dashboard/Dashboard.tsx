import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
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

export function Dashboard() {
  const { leads } = useSupabaseLeads();
  const { appointments } = useSupabaseAppointments();
  const { pipelines } = useSupabasePipelines();

  // Calculate metrics from real data
  const metrics = {
    leads_por_status: {
      Ativo: leads.filter(l => l.status_geral === 'Ativo').length,
      Cliente: leads.filter(l => l.status_geral === 'Cliente').length,
      Perdido: leads.filter(l => l.status_geral === 'Perdido').length
    },
    sessoes_hoje: appointments.filter(a => {
      const today = new Date();
      const aptDate = new Date(a.start_at);
      return aptDate.toDateString() === today.toDateString();
    }).length,
    deals_abertas: 0, // TODO: Implement when deals integration is complete
    receita_mes: 0 // TODO: Calculate from orders
  };

  // Próximos agendamentos (próximas 48h)
  const proximosAgendamentos = appointments
    .filter(apt => apt.status === 'Agendado' && new Date(apt.start_at) > new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 5);

  // TODO: Implement pipeline entries integration
  const proximosPassos: any[] = [];

  const totalLeads = Object.values(metrics.leads_por_status).reduce((a, b) => a + b, 0);
  const taxaConversao = totalLeads > 0 ? ((metrics.leads_por_status.Cliente / totalLeads) * 100).toFixed(1) : '0';

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
          value={metrics.leads_por_status.Ativo}
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
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento nos próximos dias</p>
              </div>
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
            {leads.filter(l => l.status_geral === 'Ativo').length > 0 ? (
              <div className="space-y-4">
                {['Ativo', 'Cliente', 'Perdido'].map((status) => {
                  const count = leads.filter(l => l.status_geral === status).length;
                  const color = status === 'Cliente' ? 'bg-green-500' : 
                               status === 'Ativo' ? 'bg-blue-500' : 'bg-red-500';
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span>{status}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lead encontrado</p>
              </div>
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
              {/* TODO: Calculate objections from real data */}
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Dados de objeção serão calculados automaticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}