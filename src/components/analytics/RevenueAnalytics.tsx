import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Award,
  Activity,
  Filter
} from 'lucide-react';
import { useSupabaseOrders } from '@/hooks/useSupabaseOrders';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface RevenueAnalyticsProps {
  className?: string;
  leadId?: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  revenueGrowth: number;
  topProducts: Array<{ name: string; revenue: number; orders: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; orders: number; avgValue: number }>;
}

export function RevenueAnalytics({ className, leadId }: RevenueAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [viewType, setViewType] = useState<'revenue' | 'orders' | 'combined'>('combined');
  
  const { orders, loading } = useSupabaseOrders();

  // Filter orders by leadId if provided
  const filteredOrders = leadId 
    ? orders?.filter(order => order.lead_id === leadId) 
    : orders;

  // Calculate revenue metrics
  const calculateMetrics = (orders: any[]): RevenueMetrics => {
    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        avgOrderValue: 0,
        revenueGrowth: 0,
        topProducts: [],
        monthlyTrend: []
      };
    }

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const avgOrderValue = totalRevenue / orders.length;

    // Monthly revenue calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = orders.filter(order => new Date(order.created_at) >= startOfMonth);
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    // Growth calculation (compare with previous month)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousMonth && orderDate <= previousMonthEnd;
    });
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Generate monthly trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthDate && orderDate <= monthEnd;
      });
      
      const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const monthOrderCount = monthOrders.length;
      const monthAvgValue = monthOrderCount > 0 ? monthRevenue / monthOrderCount : 0;
      
      monthlyTrend.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
        orders: monthOrderCount,
        avgValue: monthAvgValue
      });
    }

    // Top products would require order_items join - placeholder for now
    const topProducts = [
      { name: 'Produto A', revenue: totalRevenue * 0.4, orders: Math.floor(orders.length * 0.3) },
      { name: 'Produto B', revenue: totalRevenue * 0.3, orders: Math.floor(orders.length * 0.25) },
      { name: 'Produto C', revenue: totalRevenue * 0.2, orders: Math.floor(orders.length * 0.25) },
      { name: 'Outros', revenue: totalRevenue * 0.1, orders: Math.floor(orders.length * 0.2) }
    ];

    return {
      totalRevenue,
      monthlyRevenue,
      avgOrderValue,
      revenueGrowth,
      topProducts,
      monthlyTrend
    };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }


  const metrics = calculateMetrics(filteredOrders || []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Receita</h2>
          <p className="text-muted-foreground">
            {leadId ? 'Receita específica do lead' : 'Visão geral da receita'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              {metrics.revenueGrowth > 0 ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={cn(
                'text-sm font-medium',
                metrics.revenueGrowth > 0 ? 'text-success' : 'text-destructive'
              )}>
                {Math.abs(metrics.revenueGrowth).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.avgOrderValue)}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{filteredOrders?.length || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={viewType} onValueChange={(value: any) => setViewType(value)}>
        <TabsList>
          <TabsTrigger value="combined">Visão Combinada</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="combined" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Receita e Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={metrics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue' || name === 'avgValue') {
                        return formatCurrency(Number(value));
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    stroke="hsl(var(--primary))"
                    name="Receita"
                  />
                  <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--secondary))" name="Pedidos" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgValue"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    name="Ticket Médio"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={metrics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Produtos com Maior Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.orders} pedidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(product.revenue)}</p>
                  <Badge variant="outline">
                    {((product.revenue / metrics.totalRevenue) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}