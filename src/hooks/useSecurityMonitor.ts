import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityEventData {
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  details?: any;
}

export function useSecurityMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Obter informações do cliente de forma segura
  const getClientInfo = useCallback(() => {
    if (typeof window === 'undefined') return {};
    
    return {
      user_agent: navigator.userAgent,
      // Em produção real, você obteria o IP do servidor
      ip_address: null as string | null
    };
  }, []);

  // Log de evento de segurança
  const logSecurityEvent = useCallback(async (eventData: SecurityEventData) => {
    try {
      const clientInfo = getClientInfo();
      
      const { error } = await supabase.rpc('log_security_event', {
        _user_id: user?.id || null,
        _event_type: eventData.event_type,
        _ip_address: eventData.ip_address || clientInfo.ip_address,
        _user_agent: eventData.user_agent || clientInfo.user_agent,
        _success: eventData.success,
        _details: eventData.details || null
      });

      if (error) {
        console.error('Erro ao registrar evento de segurança:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  }, [user?.id, getClientInfo]);

  // Monitorar tentativas de login
  const monitorLoginAttempt = useCallback(async (success: boolean, details?: any) => {
    await logSecurityEvent({
      event_type: 'login_attempt',
      success,
      details
    });

    // Se falhou, verificar se há atividade suspeita
    if (!success) {
      try {
        const clientInfo = getClientInfo();
        if (clientInfo.ip_address) {
          const { data: isSuspicious } = await supabase.rpc('detect_suspicious_activity', {
            _ip_address: clientInfo.ip_address
          });

          if (isSuspicious) {
            await logSecurityEvent({
              event_type: 'suspicious_activity',
              success: false,
              details: { reason: 'Multiple failed login attempts', ...details }
            });

            toast({
              title: "Atividade Suspeita Detectada",
              description: "Múltiplas tentativas de login falharam. Por favor, aguarde antes de tentar novamente.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar atividade suspeita:', error);
      }
    }
  }, [logSecurityEvent, getClientInfo, toast]);

  // Monitorar reset de senha
  const monitorPasswordReset = useCallback(async (email: string, success: boolean) => {
    await logSecurityEvent({
      event_type: 'password_reset',
      success,
      details: { email }
    });
  }, [logSecurityEvent]);

  // Monitorar acesso a dados sensíveis
  const monitorDataAccess = useCallback(async (resource: string, action: string, success: boolean = true) => {
    await logSecurityEvent({
      event_type: 'data_access',
      success,
      details: { resource, action }
    });
  }, [logSecurityEvent]);

  // Monitorar mudanças de configuração
  const monitorConfigChange = useCallback(async (setting: string, oldValue: any, newValue: any) => {
    await logSecurityEvent({
      event_type: 'config_change',
      success: true,
      details: { setting, old_value: oldValue, new_value: newValue }
    });
  }, [logSecurityEvent]);

  // Detectar comportamento anômalo
  const detectAnomalousActivity = useCallback(async () => {
    try {
      const clientInfo = getClientInfo();
      
      // Verificar múltiplas sessões do mesmo usuário
      if (user?.id) {
        const { data: recentSessions, error } = await supabase
          .from('security_events')
          .select('*')
          .eq('user_id', user.id)
          .eq('event_type', 'login_attempt')
          .eq('success', true)
          .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Última hora

        if (!error && recentSessions && recentSessions.length > 3) {
          await logSecurityEvent({
            event_type: 'suspicious_activity',
            success: false,
            details: { reason: 'Multiple concurrent sessions detected' }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao detectar atividade anômala:', error);
    }
  }, [user?.id, logSecurityEvent, getClientInfo]);

  // Configurar monitoramento automático
  useEffect(() => {
    if (!user) return;

    // Detectar atividade anômala periodicamente
    const anomalyInterval = setInterval(detectAnomalousActivity, 5 * 60 * 1000); // A cada 5 minutos

    // Monitorar eventos do navegador
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logSecurityEvent({
          event_type: 'session_activity',
          success: true,
          details: { action: 'tab_focus' }
        });
      }
    };

    const handleBeforeUnload = () => {
      logSecurityEvent({
        event_type: 'session_activity',
        success: true,
        details: { action: 'page_unload' }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(anomalyInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, detectAnomalousActivity, logSecurityEvent]);

  return {
    logSecurityEvent,
    monitorLoginAttempt,
    monitorPasswordReset,
    monitorDataAccess,
    monitorConfigChange,
    detectAnomalousActivity
  };
}