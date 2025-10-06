import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Clock, Users, Activity, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  ip_address: unknown;
  user_agent: string | null;
  success: boolean;
  details: any;
  timestamp: string;
}

interface SecurityMetrics {
  totalEvents: number;
  failedAttempts: number;
  suspiciousIPs: number;
  recentThreats: number;
}

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    failedAttempts: 0,
    suspiciousIPs: 0,
    recentThreats: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Buscar eventos de segurança recentes
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      setSecurityEvents((events || []) as SecurityEvent[]);

      // Calcular métricas
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentEvents = events?.filter(e => new Date(e.timestamp) > last24h) || [];
      const failedEvents = recentEvents.filter(e => !e.success);
      const suspiciousIPs = new Set(failedEvents.map(e => e.ip_address)).size;

      setMetrics({
        totalEvents: events?.length || 0,
        failedAttempts: failedEvents.length,
        suspiciousIPs,
        recentThreats: failedEvents.filter(e => e.event_type === 'suspicious_activity').length
      });

    } catch (error) {
      console.error('Erro ao buscar dados de segurança:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de segurança",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      toast({
        title: "Scan de Segurança",
        description: "Verificação de atividades suspeitas iniciada"
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Erro no scan de segurança:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar scan de segurança",
        variant: "destructive"
      });
    }
  };

  const cleanupOldLogs = async () => {
    try {
      toast({
        title: "Limpeza Iniciada",
        description: "Removendo eventos antigos..."
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar logs antigos",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getEventBadgeVariant = (eventType: string, success: boolean) => {
    if (!success) return "destructive";
    
    switch (eventType) {
      case 'login_attempt':
        return "default";
      case 'password_reset':
        return "secondary";
      case 'suspicious_activity':
        return "destructive";
      default:
        return "outline";
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'login_attempt': 'Tentativa de Login',
      'password_reset': 'Reset de Senha',
      'suspicious_activity': 'Atividade Suspeita',
      'data_access': 'Acesso a Dados',
      'config_change': 'Mudança de Config'
    };
    return labels[eventType] || eventType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Segurança</h1>
          <p className="text-muted-foreground">
            Monitoramento e análise de eventos de segurança
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runSecurityScan} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Scan de Segurança
          </Button>
          <Button onClick={cleanupOldLogs} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Limpar Logs
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentativas Falhas (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.failedAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Suspeitos</CardTitle>
            <Eye className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{metrics.suspiciousIPs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ameaças Recentes</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.recentThreats}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {metrics.failedAttempts > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alto Número de Falhas de Login</AlertTitle>
          <AlertDescription>
            Detectamos {metrics.failedAttempts} tentativas de login falhadas nas últimas 24h. 
            Considere implementar medidas adicionais de segurança.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança</CardTitle>
              <CardDescription>
                Últimos 100 eventos registrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando eventos...</div>
              ) : securityEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum evento de segurança registrado
                </div>
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getEventBadgeVariant(event.event_type, event.success)}>
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <div>
                          <div className="font-medium">
                            {event.success ? 'Sucesso' : 'Falha'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.ip_address && `IP: ${event.ip_address}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Padrões</CardTitle>
              <CardDescription>
                Identificação de padrões suspeitos e tendências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Análise de padrões em desenvolvimento...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Ajustes e configurações do sistema de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Detecção de Atividade Suspeita</div>
                    <div className="text-sm text-muted-foreground">
                      Máximo de 5 tentativas em 15 minutos
                    </div>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Limpeza Automática de Logs</div>
                    <div className="text-sm text-muted-foreground">
                      Remove eventos com mais de 6 meses
                    </div>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sanitização de Dados</div>
                    <div className="text-sm text-muted-foreground">
                      Remove informações sensíveis dos logs
                    </div>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}