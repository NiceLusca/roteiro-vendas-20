import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

export function NotificationPermissionBanner({ onPermissionGranted }: NotificationPermissionBannerProps) {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      
      // Mostrar banner se permissão ainda não foi concedida
      const dismissed = localStorage.getItem('notification-banner-dismissed');
      setShow(currentPermission === 'default' && !dismissed);
    }
  }, []);

  const handleRequest = async () => {
    if (!('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setShow(false);
      onPermissionGranted?.();
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!show || permission !== 'default') return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-md border-primary/20 bg-card/95 backdrop-blur shadow-lg">
      <div className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-foreground">Ativar Notificações</h3>
          <p className="text-sm text-muted-foreground">
            Receba alertas sobre agendamentos próximos e não perca nenhum compromisso importante.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={handleRequest} size="sm" className="flex-1">
              Ativar
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="ghost">
              Agora não
            </Button>
          </div>
        </div>

        <Button
          onClick={handleDismiss}
          size="icon"
          variant="ghost"
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
