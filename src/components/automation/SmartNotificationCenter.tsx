import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Settings, 
  MessageSquare, 
  Mail, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Zap,
  Plus,
  Edit,
  Trash2,
  Filter,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'lead_activity' | 'pipeline_stage' | 'time_based' | 'performance' | 'system';
    conditions: Record<string, any>;
  };
  channels: Array<{
    type: 'email' | 'whatsapp' | 'sms' | 'in_app' | 'webhook';
    config: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;
  recipients: Array<{
    type: 'user' | 'role' | 'team';
    identifier: string;
  }>;
  isActive: boolean;
  frequency: 'immediate' | 'batched' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface NotificationHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  channel: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: Date;
  readAt?: Date;
  error?: string;
}

export function SmartNotificationCenter() {
  const { toast } = useToast();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadNotificationRules();
    loadNotificationHistory();
  }, []);

  const loadNotificationRules = () => {
    // Mock data - in real app, load from API/storage
    const mockRules: NotificationRule[] = [
      {
        id: '1',
        name: 'Lead Quente Detectado',
        description: 'Notifica quando lead tem alta pontuação de engajamento',
        trigger: {
          type: 'lead_activity',
          conditions: { engagement_score: { operator: 'greater_than', value: 80 } }
        },
        channels: [
          {
            type: 'whatsapp',
            config: { template: 'hot_lead_alert' },
            priority: 'high'
          },
          {
            type: 'in_app',
            config: { sound: true, popup: true },
            priority: 'high'
          }
        ],
        recipients: [
          { type: 'role', identifier: 'sales_rep' },
          { type: 'role', identifier: 'manager' }
        ],
        isActive: true,
        frequency: 'immediate',
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
        createdAt: new Date(Date.now() - 86400000 * 7),
        triggerCount: 42,
        lastTriggered: new Date(Date.now() - 3600000)
      },
      {
        id: '2',
        name: 'SLA Próximo do Vencimento',
        description: 'Alerta quando lead está próximo de vencer SLA',
        trigger: {
          type: 'time_based',
          conditions: { sla_hours_remaining: { operator: 'less_than', value: 2 } }
        },
        channels: [
          {
            type: 'email',
            config: { template: 'sla_warning' },
            priority: 'urgent'
          },
          {
            type: 'in_app',
            config: { sound: true, popup: true },
            priority: 'urgent'
          }
        ],
        recipients: [
          { type: 'user', identifier: 'assigned_user' }
        ],
        isActive: true,
        frequency: 'immediate',
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
        createdAt: new Date(Date.now() - 86400000 * 14),
        triggerCount: 23,
        lastTriggered: new Date(Date.now() - 1800000)
      },
      {
        id: '3',
        name: 'Relatório Diário de Performance',
        description: 'Resumo diário das métricas principais',
        trigger: {
          type: 'time_based',
          conditions: { schedule: 'daily', time: '09:00' }
        },
        channels: [
          {
            type: 'email',
            config: { template: 'daily_report' },
            priority: 'medium'
          }
        ],
        recipients: [
          { type: 'role', identifier: 'manager' },
          { type: 'role', identifier: 'director' }
        ],
        isActive: true,
        frequency: 'daily',
        quietHours: { enabled: true, start: '18:00', end: '08:00' },
        createdAt: new Date(Date.now() - 86400000 * 30),
        triggerCount: 30,
        lastTriggered: new Date(Date.now() - 86400000)
      }
    ];

    setRules(mockRules);
  };

  const loadNotificationHistory = () => {
    // Mock data - in real app, load from API
    const mockHistory: NotificationHistory[] = [
      {
        id: '1',
        ruleId: '1',
        ruleName: 'Lead Quente Detectado',
        channel: 'whatsapp',
        recipient: 'vendedor@empresa.com',
        status: 'delivered',
        sentAt: new Date(Date.now() - 1800000),
        readAt: new Date(Date.now() - 1200000)
      },
      {
        id: '2',
        ruleId: '2',
        ruleName: 'SLA Próximo do Vencimento',
        channel: 'email',
        recipient: 'manager@empresa.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        ruleId: '1',
        ruleName: 'Lead Quente Detectado',
        channel: 'in_app',
        recipient: 'vendedor2@empresa.com',
        status: 'failed',
        sentAt: new Date(Date.now() - 7200000),
        error: 'Usuário offline'
      }
    ];

    setHistory(mockHistory);
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));

    toast({
      title: "Status Atualizado",
      description: "Regra de notificação foi ativada/desativada."
    });
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast({
      title: "Regra Removida",
      description: "Regra de notificação foi removida com sucesso."
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'sms': return Phone;
      case 'in_app': return Bell;
      case 'webhook': return Zap;
      default: return Bell;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return CheckCircle;
      case 'sent': return Clock;
      case 'failed': return AlertTriangle;
      case 'pending': return Clock;
      default: return Bell;
    }
  };

  const filteredHistory = history.filter(item => 
    filterStatus === 'all' || item.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Central de Notificações Inteligentes</h2>
          <p className="text-muted-foreground">
            Configure alertas automáticos e monitore comunicações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Regra de Notificação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Nome da Regra</Label>
                    <Input
                      id="rule-name"
                      placeholder="Ex: Lead sem resposta há 24h"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trigger-type">Tipo de Gatilho</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar gatilho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_activity">Atividade do Lead</SelectItem>
                        <SelectItem value="pipeline_stage">Mudança de Etapa</SelectItem>
                        <SelectItem value="time_based">Baseado em Tempo</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva quando esta notificação deve ser enviada..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="channel">Canal</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="in_app">In-App</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="quiet-hours" />
                  <Label htmlFor="quiet-hours">Ativar horário silencioso</Label>
                </div>

                <Button onClick={() => setIsCreatingRule(false)} className="w-full">
                  Criar Regra
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhuma regra configurada</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie regras inteligentes para receber notificações automáticas
                  </p>
                  <Button onClick={() => setIsCreatingRule(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Regra
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                          {rule.quietHours.enabled && (
                            <Badge variant="outline">
                              <VolumeX className="h-3 w-3 mr-1" />
                              Silencioso
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRuleStatus(rule.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Canais</p>
                        <div className="flex flex-wrap gap-1">
                          {rule.channels.map((channel, index) => {
                            const ChannelIcon = getChannelIcon(channel.type);
                            return (
                              <Badge key={index} variant="outline" className="flex items-center gap-1">
                                <ChannelIcon className="h-3 w-3" />
                                {channel.type}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Frequência</p>
                        <Badge variant="outline">{rule.frequency}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Destinatários</p>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {rule.recipients.length}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                      <span>Disparos: {rule.triggerCount}</span>
                      {rule.lastTriggered && (
                        <span>Último: {rule.lastTriggered.toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Filtrar por status:</Label>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
                <SelectItem value="failed">Falharam</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredHistory.map(item => {
                  const StatusIcon = getStatusIcon(item.status);
                  const ChannelIcon = getChannelIcon(item.channel);
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <ChannelIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.ruleName}</p>
                          <p className="text-xs text-muted-foreground">
                            para {item.recipient} • {item.sentAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon 
                          className={`h-4 w-4 ${
                            item.status === 'delivered' ? 'text-green-600' :
                            item.status === 'failed' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}
                        />
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {history.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Enviados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-800/20">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {history.filter(h => h.status === 'delivered').length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Entregues
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 rounded-lg dark:bg-red-800/20">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {history.filter(h => h.status === 'failed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Falharam
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-800/20">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round((history.filter(h => h.status === 'delivered').length / history.length) * 100) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taxa de Entrega
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Globais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Sons de Notificação</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som para notificações in-app
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Horário Silencioso Global</Label>
                  <p className="text-sm text-muted-foreground">
                    Aplicar horário silencioso para todas as regras
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}