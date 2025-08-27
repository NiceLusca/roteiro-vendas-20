import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { mockDashboardMetrics, mockLeads, mockAppointments, mockLeadPipelineEntries, mockPipelineStages } from '@/data/mockData';
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
  const metrics = mockDashboardMetrics;
  
  // Próximos agendamentos (próximas 48h)
  const proximosAgendamentos = mockAppointments
    .filter(apt => apt.status === 'Agendado' && apt.start_at > new Date())
    .sort((a, b) => a.start_at.getTime() - b.start_at.getTime())
    .slice(0, 5);

  // Próximos passos urgentes
  const proximosPassos = mockLeadPipelineEntries
    .filter(entry => entry.status_inscricao === 'Ativo')
    .map(entry => {
      const lead = mockLeads.find(l => l.id === entry.lead_id);
      const stage = mockPipelineStages.find(s => s.id === entry.etapa_atual_id);
      return {
        ...entry,
        lead,
        stage
      };
    })
    .filter(item => item.lead && item.stage)
    .sort((a, b) => b.dias_em_atraso - a.dias_em_atraso)
    .slice(0, 6);

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
          description={`${totalLeads} leads no total`}
          icon={Users}
          variant="default"
        />
        
        <MetricCard
          title="Sessões Hoje"
          value={metrics.sessoes_hoje}
          description={`${metrics.sessoes_semana} esta semana`}
          icon={Calendar}
          variant="default"
        />
        
        <MetricCard
          title="Deals Abertas"
          value={metrics.deals_abertas}
          description={`${metrics.deals_ganhas_mes} ganhas este mês`}
          icon={TrendingUp}
          variant="warning"
        />
        
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(metrics.receita_mes)}
          description={`Taxa conversão: ${taxaConversao}%`}
          icon={DollarSign}
          variant="success"
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
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento próximo
              </p>
            ) : (
              proximosAgendamentos.map((appointment) => {
                const lead = mockLeads.find(l => l.id === appointment.lead_id);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {lead?.nome}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(appointment.start_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Phone className="h-4 w-4" />
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
            <div className="space-y-3">
              {Object.entries(metrics.leads_por_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === 'Ativo' ? 'bg-primary' :
                        status === 'Cliente' ? 'bg-success' :
                        status === 'Perdido' ? 'bg-danger' :
                        'bg-muted-foreground'
                      }`}
                    />
                    <span className="text-sm">{status}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
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
              {metrics.top_objecoes.map((objecao, index) => (
                <div key={objecao.objecao} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{objecao.objecao}</span>
                  </div>
                  <Badge variant="outline">{objecao.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}