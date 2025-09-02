import { usePWA } from '@/hooks/usePWA';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Alert className="w-auto border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          Você está offline
          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
            Modo offline ativo
          </Badge>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = usePWA();

  // Show brief online indicator when coming back online
  if (!isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    </div>
  );
}