import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, Clock, AlertTriangle, CheckCircle, X, Settings } from 'lucide-react';

interface Notification {
  id: string;
  type: 'sla_breach' | 'stage_timeout' | 'inactivity' | 'automation_success' | 'automation_error';
  title: string;
  message: string;
  leadId?: string;
  leadName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
}

interface NotificationSettings {
  slaBreaches: boolean;
  stageTimeouts: boolean;
  inactivityAlerts: boolean;
  automationUpdates: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    slaBreaches: true,
    stageTimeouts: true,
    inactivityAlerts: true,
    automationUpdates: false,
    emailNotifications: true,
    soundEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Mock notifications - in real app, these would come from API
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'sla_breach',
        title: 'SLA Violado',
        message: 'Lead João Silva está há 10 dias na etapa "Qualificação"',
        leadId: '1',
        leadName: 'João Silva',
        priority: 'critical',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionable: true
      },
      {
        id: '2',
        type: 'stage_timeout',
        title: 'Timeout de Etapa',
        message: '3 leads próximos ao limite de tempo na etapa "Proposta"',
        priority: 'high',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        actionable: true
      },
      {
        id: '3',
        type: 'automation_success',
        title: 'Automação Executada',
        message: 'Agendamento criado automaticamente para Maria Santos',
        leadId: '2',
        leadName: 'Maria Santos',
        priority: 'low',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        actionable: false
      },
      {
        id: '4',
        type: 'inactivity',
        title: 'Lead Inativo',
        message: 'Carlos Oliveira sem interação há 7 dias',
        leadId: '3',
        leadName: 'Carlos Oliveira',
        priority: 'medium',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: false,
        actionable: true
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'sla_breach':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'stage_timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'inactivity':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'automation_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'automation_error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (notification: Notification) => {
    switch (notification.type) {
      case 'sla_breach':
        toast({
          title: "Abrindo Lead",
          description: `Navegando para o lead ${notification.leadName}`,
        });
        break;
      case 'stage_timeout':
        toast({
          title: "Verificando Leads",
          description: "Abrindo lista de leads próximos ao limite",
        });
        break;
      case 'inactivity':
        toast({
          title: "Criando Tarefa",
          description: `Tarefa de follow-up criada para ${notification.leadName}`,
        });
        break;
    }
    markAsRead(notification.id);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`;
    return `${Math.floor(minutes / 1440)}d atrás`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <BellRing className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>
              Notificações
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Marcar Todas como Lidas
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 border rounded-lg bg-accent/50">
              <h3 className="font-medium mb-4">Configurações de Notificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Violações de SLA</label>
                    <Switch 
                      checked={settings.slaBreaches}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, slaBreaches: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Timeouts de Etapa</label>
                    <Switch 
                      checked={settings.stageTimeouts}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, stageTimeouts: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Alertas de Inatividade</label>
                    <Switch 
                      checked={settings.inactivityAlerts}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, inactivityAlerts: checked }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Atualizações de Automação</label>
                    <Switch 
                      checked={settings.automationUpdates}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, automationUpdates: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Notificações por Email</label>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Som Habilitado</label>
                    <Switch 
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, soundEnabled: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Nenhuma notificação
                </p>
                <p className="text-muted-foreground">
                  Você está em dia com tudo!
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                    !notification.read ? 'bg-accent/50 border-primary/20' : 'hover:bg-accent/30'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority === 'critical' ? 'Crítico' :
                             notification.priority === 'high' ? 'Alto' :
                             notification.priority === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {notification.actionable && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleAction(notification)}
                        >
                          Resolver
                        </Button>
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Marcar como Lida
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}