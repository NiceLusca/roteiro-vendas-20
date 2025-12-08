import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, AlertTriangle, Calendar, Zap, Volume2 } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { requestNotificationPermission } from '@/utils/notificationService';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettingsCard() {
  const { settings, updateSettings, isUpdating } = useNotificationSettings();
  const { toast } = useToast();

  const handleBrowserNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações no navegador para ativar este recurso.',
          variant: 'destructive',
        });
        return;
      }
    }
    updateSettings({ browser_notifications: enabled });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificações
        </CardTitle>
        <CardDescription>
          Configure quais notificações você deseja receber e como.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Tipos de Notificação</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <Label htmlFor="sla_breaches">SLA Excedido</Label>
                <p className="text-xs text-muted-foreground">
                  Quando um lead ultrapassa o prazo da etapa
                </p>
              </div>
            </div>
            <Switch
              id="sla_breaches"
              checked={settings.sla_breaches}
              onCheckedChange={(checked) => updateSettings({ sla_breaches: checked })}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <Label htmlFor="stage_timeouts">Prazo Próximo</Label>
                <p className="text-xs text-muted-foreground">
                  Aviso quando lead está próximo do limite da etapa
                </p>
              </div>
            </div>
            <Switch
              id="stage_timeouts"
              checked={settings.stage_timeouts}
              onCheckedChange={(checked) => updateSettings({ stage_timeouts: checked })}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <Label htmlFor="appointment_reminders">Lembretes de Agendamento</Label>
                <p className="text-xs text-muted-foreground">
                  Notificação antes de sessões agendadas
                </p>
              </div>
            </div>
            <Switch
              id="appointment_reminders"
              checked={settings.appointment_reminders}
              onCheckedChange={(checked) => updateSettings({ appointment_reminders: checked })}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <Label htmlFor="inactivity_alerts">Alerta de Inatividade</Label>
                <p className="text-xs text-muted-foreground">
                  Leads sem interação por muitos dias
                </p>
              </div>
            </div>
            <Switch
              id="inactivity_alerts"
              checked={settings.inactivity_alerts}
              onCheckedChange={(checked) => updateSettings({ inactivity_alerts: checked })}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <Label htmlFor="automation_updates">Automações</Label>
                <p className="text-xs text-muted-foreground">
                  Notificações de ações automáticas do sistema
                </p>
              </div>
            </div>
            <Switch
              id="automation_updates"
              checked={settings.automation_updates}
              onCheckedChange={(checked) => updateSettings({ automation_updates: checked })}
              disabled={isUpdating}
            />
          </div>
        </div>

        <Separator />

        {/* Delivery Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Entrega</h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4" />
              <div>
                <Label htmlFor="browser_notifications">Notificações do Navegador</Label>
                <p className="text-xs text-muted-foreground">
                  Receber pop-ups mesmo com a aba fechada
                </p>
              </div>
            </div>
            <Switch
              id="browser_notifications"
              checked={settings.browser_notifications}
              onCheckedChange={handleBrowserNotificationToggle}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4" />
              <div>
                <Label htmlFor="sound_enabled">Som</Label>
                <p className="text-xs text-muted-foreground">
                  Tocar som ao receber notificação
                </p>
              </div>
            </div>
            <Switch
              id="sound_enabled"
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => updateSettings({ sound_enabled: checked })}
              disabled={isUpdating}
            />
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Horário Silencioso</h4>
              <p className="text-xs text-muted-foreground">
                Pausar notificações durante determinado período
              </p>
            </div>
            <Switch
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked) => updateSettings({ quiet_hours_enabled: checked })}
              disabled={isUpdating}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="flex items-center gap-4 pl-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="quiet_start" className="text-sm whitespace-nowrap">
                  Das
                </Label>
                <Input
                  id="quiet_start"
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => updateSettings({ quiet_hours_start: e.target.value })}
                  className="w-28"
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="quiet_end" className="text-sm whitespace-nowrap">
                  às
                </Label>
                <Input
                  id="quiet_end"
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => updateSettings({ quiet_hours_end: e.target.value })}
                  className="w-28"
                  disabled={isUpdating}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
