import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Zap, Shield, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface EnhancedInstallPromptProps {
  onInstall?: (success: boolean) => void;
  onDismiss?: () => void;
  className?: string;
}

export function EnhancedInstallPrompt({ 
  onInstall, 
  onDismiss, 
  className 
}: EnhancedInstallPromptProps) {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Show prompt after delay if installable and not dismissed
  useEffect(() => {
    if (isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Wait 3 seconds before showing

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isDismissed]);

  const handleInstall = async () => {
    try {
      const success = await installApp();
      
      if (success) {
        toast.success('App instalado com sucesso!');
        onInstall?.(true);
        setShowPrompt(false);
      } else {
        toast.error('Instalação cancelada pelo usuário');
        onInstall?.(false);
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Erro ao instalar o app');
      onInstall?.(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    onDismiss?.();
    
    // Remember dismissal for session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Check if previously dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!isInstallable || isInstalled || !showPrompt || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Instalar Lúmen CRM</CardTitle>
                <CardDescription>
                  Acesso rápido e offline ao seu CRM
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>Acesso instantâneo</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Wifi className="h-4 w-4 text-primary" />
              <span>Funciona offline</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Dados seguros</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Monitor className="h-4 w-4 text-primary" />
              <span>Experiência nativa</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Smartphone className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Como instalar:</p>
                <p className="text-muted-foreground">
                  Clique em "Instalar" e o app será adicionado à sua tela inicial 
                  para acesso rápido.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Mais tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact install banner for less intrusive promotion
export function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled && !isDismissed) {
      // Show banner after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isDismissed]);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
      toast.success('App instalado!');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!isVisible || !isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-40">
      <Card className="border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Instalar Lúmen CRM</p>
                <p className="text-xs text-muted-foreground">
                  Acesso rápido e offline
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleInstall} className="h-8 px-3 text-xs">
                Instalar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}