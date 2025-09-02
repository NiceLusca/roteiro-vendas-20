import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X,
  Settings,
  Filter,
  BellRing
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'sla_warning' | 'sla_violation' | 'stage_completion' | 'automation' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityId?: string;
  entityType?: string;
  actionable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface NotificationSettings {
  slaWarnings: boolean;
  slaViolations: boolean;
  stageCompletions: boolean;
  automationResults: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
  emailNotifications: boolean;
}

interface NotificationSystemProps {
  pipelineId?: string;
  className?: string;
}

export function NotificationSystem({ pipelineId, className }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    slaWarnings: true,
    slaViolations: true,
    stageCompletions: true,
    automationResults: true,
    systemAlerts: true,
    soundEnabled: true,
    emailNotifications: false
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { entries } = useSupabaseLeadPipelineEntries(pipelineId);
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { toast } = useToast();

  // Generate notifications based on pipeline data
  useEffect(() => {
    generateNotifications();
  }, [entries, stages, settings]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];

    if (settings.slaViolations || settings.slaWarnings) {
      entries.forEach(entry => {
        const stage = stages.find(s => s.id === entry.etapa_atual_id);
        if (!stage || entry.status_inscricao !== 'Ativo') return;

        // SLA Violations
        if (entry.dias_em_atraso > 0 && settings.slaViolations) {
          newNotifications.push({
            id: `sla-violation-${entry.id}`,
            type: 'sla_violation',
            title: 'SLA Violado',
            message: `Lead está ${entry.dias_em_atraso} dia(s) atrasado na etapa "${stage.nome}"`,
            timestamp: new Date(),
            read: false,
            priority: 'critical',
            entityId: entry.id,
            entityType: 'lead_pipeline_entry',
            actionable: true,
            actions: [
              {
                label: 'Ver Lead',
                action: () => {
                  // Navigate to lead detail
                  console.log('Navigate to lead:', entry.lead_id);
                }
              },
              {
                label: 'Avançar Etapa',
                action: () => {
                  // Open stage advancement dialog
                  console.log('Advance stage for:', entry.id);
                }
              }
            ]
          });
        }

        // SLA Warnings
        const warningThreshold = Math.floor(stage.prazo_em_dias * 0.8);
        if (entry.tempo_em_etapa_dias >= warningThreshold && 
            entry.dias_em_atraso === 0 && 
            settings.slaWarnings) {
          newNotifications.push({
            id: `sla-warning-${entry.id}`,
            type: 'sla_warning',
            title: 'Atenção: SLA Próximo',
            message: `Lead próximo do prazo na etapa "${stage.nome}" (${entry.tempo_em_etapa_dias}/${stage.prazo_em_dias} dias)`,
            timestamp: new Date(),
            read: false,
            priority: 'high',
            entityId: entry.id,
            entityType: 'lead_pipeline_entry',
            actionable: true,
            actions: [
              {
                label: 'Revisar',
                action: () => {
                  console.log('Review entry:', entry.id);
                }
              }
            ]
          });
        }
      });
    }

    // Merge with existing notifications, avoiding duplicates
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      return [...prev, ...uniqueNew].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'sla_violation': return AlertTriangle;
      case 'sla_warning': return Clock;
      case 'stage_completion': return CheckCircle;
      case 'automation': return Settings;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadgeVariant = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'high': return notification.priority === 'high' || notification.priority === 'critical';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical').length;

  const playNotificationSound = () => {
    if (settings.soundEnabled) {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  // Play sound for new critical notifications
  useEffect(() => {
    const newCritical = notifications.filter(n => 
      n.priority === 'critical' && 
      !n.read && 
      (Date.now() - n.timestamp.getTime()) < 5000 // Within last 5 seconds
    );
    
    if (newCritical.length > 0) {
      playNotificationSound();
    }
  }, [notifications, settings.soundEnabled]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            Notificações
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} crítica(s)
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações de Notificação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sla-violations">Violações de SLA</Label>
                      <Switch
                        id="sla-violations"
                        checked={settings.slaViolations}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, slaViolations: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sla-warnings">Avisos de SLA</Label>
                      <Switch
                        id="sla-warnings"
                        checked={settings.slaWarnings}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, slaWarnings: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Som de Notificação</Label>
                      <Switch
                        id="sound"
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, soundEnabled: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({notifications.length})
          </Button>
          <Button 
            variant={filter === 'unread' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Não lidas ({unreadCount})
          </Button>
          <Button 
            variant={filter === 'high' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setFilter('high')}
          >
            Prioritárias
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellRing className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação correspondente ao filtro'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                
                return (
                  <div key={notification.id}>
                    <div 
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-4 w-4 mt-1 ${getPriorityColor(notification.priority)}`} />
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityBadgeVariant(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleString('pt-BR')}
                            </p>
                            
                            {notification.actionable && notification.actions && (
                              <div className="flex gap-1">
                                {notification.actions.map((action, actionIndex) => (
                                  <Button
                                    key={actionIndex}
                                    variant={action.variant || 'outline'}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.action();
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < filteredNotifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}