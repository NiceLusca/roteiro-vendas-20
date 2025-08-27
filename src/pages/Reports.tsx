import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Clock, AlertTriangle } from 'lucide-react';
import { mockLeads, mockDeals, mockAppointments, mockDashboardMetrics, mockLeadPipelineEntries, mockPipelineStages } from '@/data/mockData';
import { formatCurrency } from '@/utils/formatters';

export default function Reports() {
  const [period, setPeriod] = useState('30days');

  // Calculate conversion funnel
  const calculateFunnel = () => {
    const stages = mockPipelineStages.sort((a, b) => a.ordem - b.ordem);
    return stages.map(stage => {
      const entriesInStage = mockLeadPipelineEntries.filter(e => e.etapa_atual_id === stage.id);
      return {
        name: stage.nome,
        count: entriesInStage.length,
        averageDays: entriesInStage.length > 0 
          ? Math.round(entriesInStage.reduce((sum, e) => sum + e.tempo_em_etapa_dias, 0) / entriesInStage.length)
          : 0
      };
    });
  };

  // Calculate closer performance
  const calculateCloserPerformance = () => {
    const closers = [...new Set(mockLeads.map(l => l.closer).filter(Boolean))];
    return closers.map(closer => {
      const closerLeads = mockLeads.filter(l => l.closer === closer);
      const closerDeals = mockDeals.filter(d => d.closer === closer);
      const wonDeals = closerDeals.filter(d => d.status === 'Ganha');
      const revenue = wonDeals.reduce((sum, d) => sum + d.valor_proposto, 0);
      
      return {
        name: closer!,
        leads: closerLeads.length,
        deals: closerDeals.length,
        won: wonDeals.length,
        revenue,
        conversion: closerDeals.length > 0 ? (wonDeals.length / closerDeals.length) * 100 : 0
      };
    });
  };

  // Calculate lead sources performance
  const calculateSourcePerformance = () => {
    const sources = [...new Set(mockLeads.map(l => l.origem))];
    return sources.map(source => {
      const sourceLeads = mockLeads.filter(l => l.origem === source);
      const sourceDeals = mockDeals.filter(d => {
        const lead = mockLeads.find(l => l.id === d.lead_id);
        return lead?.origem === source;
      });
      const wonDeals = sourceDeals.filter(d => d.status === 'Ganha');
      
      return {
        name: source,
        leads: sourceLeads.length,
        deals: sourceDeals.length,
        won: wonDeals.length,
        conversion: sourceDeals.length > 0 ? (wonDeals.length / sourceDeals.length) * 100 : 0
      };
    });
  };

  // No-show analysis
  const calculateNoShowRate = () => {
    const totalAppointments = mockAppointments.length;
    const noShows = mockAppointments.filter(a => a.status === 'No-Show').length;
    const realized = mockAppointments.filter(a => a.status === 'Realizado').length;
    
    return {
      total: totalAppointments,
      noShows,
      realized,
      rate: totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0
    };
  };

  const funnelData = calculateFunnel();
  const closerData = calculateCloserPerformance();
  const sourceData = calculateSourcePerformance();
  const noShowData = calculateNoShowRate();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-muted-foreground">Análises e métricas de performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">
                  {((mockDashboardMetrics.deals_ganhas_mes / (mockDashboardMetrics.deals_ganhas_mes + mockDashboardMetrics.deals_perdidas_mes)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold">{formatCurrency(mockDashboardMetrics.receita_mes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-warning" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(mockDashboardMetrics.receita_mes / mockDashboardMetrics.deals_ganhas_mes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Taxa No-Show</p>
                <p className="text-2xl font-bold">{noShowData.rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, leads }) => `${name}: ${leads}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="leads"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Closer Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Closer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {closerData.map((closer, index) => (
                <div key={closer.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{closer.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{closer.leads} leads</span>
                      <span>{closer.deals} deals</span>
                      <span>{closer.won} ganhas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatCurrency(closer.revenue)}</p>
                    <Badge variant={closer.conversion >= 50 ? 'default' : 'secondary'}>
                      {closer.conversion.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="averageDays" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Objections */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Objeções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockDashboardMetrics.top_objecoes.map((objection, index) => (
              <div key={objection.objecao} className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{objection.count}</p>
                <p className="text-sm text-muted-foreground">{objection.objecao}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}