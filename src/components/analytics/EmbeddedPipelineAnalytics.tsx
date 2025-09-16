import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface PipelineAnalyticsData {
  stages: StageAnalytics[];
  overview: OverviewMetrics;
  trends: TrendData[];
  bottlenecks: BottleneckData[];
}

interface StageAnalytics {
  id: string;
  nome: string;
  ordem: number;
  leadsCount: number;
  avgTimeInStage: number;
  conversionRate: number;
  dropOffRate: number;
  slaViolations: number;
  health: 'green' | 'yellow' | 'red';
}

interface OverviewMetrics {
  totalLeads: number;
  totalConverted: number;
  avgCycleTime: number;
  totalRevenue: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
  periodComparison: number;
}

interface TrendData {
  date: string;
  leads: number;
  conversions: number;
  revenue: number;
}

interface BottleneckData {
  stage: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  impact: number;
  suggestion: string;
}

interface EmbeddedPipelineAnalyticsProps {
  pipelineId: string;
  pipelineName: string;
  dateRange?: string;
  showHeader?: boolean;
  compact?: boolean;
}

// Mock data - seria substituído por dados reais do Supabase
const mockAnalyticsData: PipelineAnalyticsData = {
  stages: [
    {
      id: '1',
      nome: 'Qualificação',
      ordem: 1,
      leadsCount: 45,
      avgTimeInStage: 2.3,
      conversionRate: 78,
      dropOffRate: 22,
      slaViolations: 5,
      health: 'green'
    },
    {
      id: '2',
      nome: 'Proposta',
      ordem: 2,
      leadsCount: 35,
      avgTimeInStage: 5.1,
      conversionRate: 65,
      dropOffRate: 35,
      slaViolations: 12,
      health: 'yellow'
    },
    {
      id: '3',
      nome: 'Negociação',
      ordem: 3,
      leadsCount: 23,
      avgTimeInStage: 8.2,
      conversionRate: 52,
      dropOffRate: 48,
      slaViolations: 18,
      health: 'red'
    },
    {
      id: '4',
      nome: 'Fechamento',
      ordem: 4,
      leadsCount: 12,
      avgTimeInStage: 3.8,
      conversionRate: 85,
      dropOffRate: 15,
      slaViolations: 2,
      health: 'green'
    }
  ],
  overview: {
    totalLeads: 115,
    totalConverted: 42,
    avgCycleTime: 19.4,
    totalRevenue: 280000,
    conversionRate: 36.5,
    trend: 'up',
    periodComparison: 12.5
  },
  trends: [
    { date: '2024-01-01', leads: 25, conversions: 8, revenue: 45000 },
    { date: '2024-01-08', leads: 32, conversions: 12, revenue: 68000 },
    { date: '2024-01-15', leads: 28, conversions: 9, revenue: 52000 },
    { date: '2024-01-22', leads: 30, conversions: 13, revenue: 75000 },
    { date: '2024-01-29', leads: 35, conversions: 15, revenue: 85000 }
  ],
  bottlenecks: [
    {
      stage: 'Negociação',
      issue: 'Alto tempo de permanência',
      severity: 'high',
      impact: 48,
      suggestion: 'Revisar critérios de avanço e treinamento da equipe'
    },
    {
      stage: 'Proposta',
      issue: 'Taxa de conversão baixa',
      severity: 'medium',
      impact: 35,
      suggestion: 'Melhorar templates de proposta e follow-up'
    }
  ]
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export function EmbeddedPipelineAnalytics({ 
  pipelineId, 
  pipelineName, 
  dateRange = '30d',
  showHeader = true,
  compact = false
}: EmbeddedPipelineAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);
  const [isLoading, setIsLoading] = useState(false);

  const data = mockAnalyticsData;

  const funnelData = useMemo(() => {
    return data.stages.map(stage => ({
      name: stage.nome,
      value: stage.leadsCount,
      fill: stage.health === 'green' ? COLORS[2] : 
            stage.health === 'yellow' ? COLORS[3] : COLORS[4]
    }));
  }, [data.stages]);

  const stageHealthData = useMemo(() => {
    const healthCounts = data.stages.reduce((acc, stage) => {
      acc[stage.health] = (acc[stage.health] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Saudável', value: healthCounts.green || 0, fill: COLORS[2] },
      { name: 'Atenção', value: healthCounts.yellow || 0, fill: COLORS[3] },
      { name: 'Crítico', value: healthCounts.red || 0, fill: COLORS[4] }
    ];
  }, [data.stages]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    // Mock export functionality - replace with actual implementation
    if (process.env.NODE_ENV === 'development') {
      console.log('Exporting analytics data...');
    }
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-primary">{data.overview.conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-success mr-1" />
              <span className="text-xs text-success">+{data.overview.periodComparison}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads Ativas</p>
                <p className="text-2xl font-bold text-secondary">{data.overview.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-secondary" />
            </div>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">{data.overview.avgCycleTime} dias ciclo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-success">R$ {(data.overview.totalRevenue / 1000).toFixed(0)}k</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <div className="flex items-center mt-2">
              <CheckCircle className="h-4 w-4 text-success mr-1" />
              <span className="text-xs text-success">{data.overview.totalConverted} conversões</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gargalos</p>
                <p className="text-2xl font-bold text-destructive">{data.bottlenecks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="destructive" className="text-xs">
                {data.bottlenecks.filter(b => b.severity === 'high').length} críticos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics do Pipeline
            </h3>
            <p className="text-sm text-muted-foreground">{pipelineName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="h-8"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="bottlenecks">Gargalos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-primary">{data.overview.conversionRate}%</p>
                  </div>
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className="h-4 w-4 text-success mr-2" />
                  <span className="text-sm text-success font-medium">+{data.overview.periodComparison}%</span>
                  <span className="text-sm text-muted-foreground ml-2">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Leads Ativas</p>
                    <p className="text-3xl font-bold text-secondary">{data.overview.totalLeads}</p>
                  </div>
                  <Users className="h-10 w-10 text-secondary" />
                </div>
                <div className="flex items-center mt-4">
                  <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Ciclo médio: {data.overview.avgCycleTime} dias</span>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                    <p className="text-3xl font-bold text-success">R$ {(data.overview.totalRevenue / 1000).toFixed(0)}k</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-success" />
                </div>
                <div className="flex items-center mt-4">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  <span className="text-sm text-success font-medium">{data.overview.totalConverted} conversões</span>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saúde Geral</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-success" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Performance</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stage Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {stage.ordem}
                        </span>
                        <div>
                          <p className="font-medium">{stage.nome}</p>
                          <p className="text-sm text-muted-foreground">{stage.leadsCount} leads</p>
                        </div>
                      </div>
                      
                       <Badge 
                         variant={stage.health === 'green' ? 'secondary' : 
                                stage.health === 'yellow' ? 'outline' : 'destructive'}
                         className="text-xs"
                       >
                        {stage.health === 'green' ? 'Saudável' : 
                         stage.health === 'yellow' ? 'Atenção' : 'Crítico'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{stage.conversionRate}%</p>
                        <p className="text-muted-foreground">Conversão</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{stage.avgTimeInStage}d</p>
                        <p className="text-muted-foreground">Tempo Médio</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{stage.slaViolations}</p>
                        <p className="text-muted-foreground">SLA Quebrados</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Funil de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saúde das Etapas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stageHealthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stageHealthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {stageHealthData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência de Leads e Conversões</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stackId="1"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.3}
                    name="Leads"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conversions" 
                    stackId="1"
                    stroke={COLORS[2]}
                    fill={COLORS[2]}
                    fillOpacity={0.3}
                    name="Conversões"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Receita']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={COLORS[2]}
                    strokeWidth={3}
                    dot={{ fill: COLORS[2], strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Gargalos Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.bottlenecks.map((bottleneck, index) => (
                  <Card key={index} className="border-l-4 border-l-destructive">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{bottleneck.stage}</h4>
                             <Badge 
                               variant={bottleneck.severity === 'high' ? 'destructive' : 
                                      bottleneck.severity === 'medium' ? 'outline' : 'secondary'}
                               className="text-xs"
                             >
                              {bottleneck.severity === 'high' ? 'Alto' :
                               bottleneck.severity === 'medium' ? 'Médio' : 'Baixo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{bottleneck.issue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Impacto</p>
                          <p className="text-lg font-bold text-destructive">{bottleneck.impact}%</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/20 p-3 rounded-md">
                        <p className="text-sm">
                          <strong>Sugestão:</strong> {bottleneck.suggestion}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {data.bottlenecks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                  <h4 className="text-lg font-medium mb-2">Nenhum gargalo crítico identificado</h4>
                  <p className="text-muted-foreground">
                    Seu pipeline está funcionando bem! Continue monitorando o desempenho.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}