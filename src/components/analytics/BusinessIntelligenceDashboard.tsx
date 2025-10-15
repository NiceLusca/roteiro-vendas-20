import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface BusinessIntelligenceDashboardProps {
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function BusinessIntelligenceDashboard({ className }: BusinessIntelligenceDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeView, setActiveView] = useState<'overview' | 'performance' | 'forecast'>('overview');

  // Calculate date range
  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start, end };
  };

  const { metrics, forecast, loading, error, refetch } = useAdvancedAnalytics(getDateRange(dateRange));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Erro ao carregar dados: {error}</span>
        </div>
        <Button onClick={refetch} className="mt-4">
          Tentar Novamente
        </Button>
      </Card>
    );
  }

  if (!metrics) return null;

  const getPipelineHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getPipelineHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return CheckCircle;
      case 'good': return Target;
      case 'warning': return Clock;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const HealthIcon = getPipelineHealthIcon(metrics.pipelineHealth);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <p className="text-muted-foreground">Análise avançada e insights de negócio</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-3xl font-bold">{metrics.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              {metrics.monthlyGrowth > 0 ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={cn(
                'text-sm font-medium',
                metrics.monthlyGrowth > 0 ? 'text-success' : 'text-destructive'
              )}>
                {Math.abs(metrics.monthlyGrowth).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                Ticket médio: {formatCurrency(metrics.avgDealSize)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-3xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={metrics.conversionRate > 15 ? 'default' : 'secondary'}>
                {metrics.conversionRate > 15 ? 'Excelente' : 'Bom'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saúde do Pipeline</p>
                <p className={cn('text-3xl font-bold capitalize', getPipelineHealthColor(metrics.pipelineHealth))}>
                  {metrics.pipelineHealth}
                </p>
              </div>
              <HealthIcon className={cn('h-8 w-8', getPipelineHealthColor(metrics.pipelineHealth))} />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline">
                Pipeline Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Fontes de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.leadSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percentage }) => `${source} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.leadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topPerformers.map((performer, index) => (
                  <div key={performer.closer} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{performer.closer}</p>
                        <p className="text-sm text-muted-foreground">{performer.deals} negócios fechados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(performer.revenue)}</p>
                      <p className="text-sm text-muted-foreground">em vendas</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Stage Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.stagePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgTime" fill="hsl(var(--primary))" name="Tempo Médio (dias)" />
                  <Bar yAxisId="right" dataKey="conversionRate" fill="hsl(var(--secondary))" name="Taxa Conversão (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {forecast && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Previsão de Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(forecast.predictedRevenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">Próximos 30 dias</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant={forecast.confidence > 80 ? 'default' : 'secondary'}>
                        {forecast.confidence.toFixed(0)}% de confiança
                      </Badge>
                      <Badge variant="outline">
                        Tendência {forecast.trend === 'up' ? '↗️' : forecast.trend === 'down' ? '↘️' : '→'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium">Fatores considerados:</p>
                      <ul className="space-y-1">
                        {forecast.factors.map((factor, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Forecast Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Projeção de Crescimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                      <p>Gráfico de projeção em desenvolvimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}