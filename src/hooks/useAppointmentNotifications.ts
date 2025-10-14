import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { 
  calculateUrgency, 
  shouldNotify, 
  showBrowserNotification,
  type AppointmentNotification 
} from '@/utils/appointmentNotifier';

interface NotificationSettings {
  enabled: boolean;
  criticalEnabled: boolean;
  alertEnabled: boolean;
  reminderEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  criticalEnabled: true,
  alertEnabled: true,
  reminderEnabled: true,
};

export function useAppointmentNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const { user } = useAuth();

  // Verificar permissão
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser não suporta notificações');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Verificar horário silencioso
  const isQuietHours = useCallback((): boolean => {
    if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
    
    const quietStart = startH * 60 + startM;
    const quietEnd = endH * 60 + endM;

    return currentTime >= quietStart && currentTime <= quietEnd;
  }, [settings]);

  // Verificar agendamentos
  const checkAppointments = useCallback(async () => {
    if (!user || !settings.enabled || permission !== 'granted' || isQuietHours()) return;

    try {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          lead_id,
          start_at,
          titulo,
          status,
          leads (nome)
        `)
        .eq('status', 'agendado')
        .gte('start_at', new Date().toISOString());

      if (!appointments) return;

      for (const apt of appointments) {
        const urgency = calculateUrgency(apt.start_at);
        
        // Verificar se deve notificar baseado nas configurações
        const shouldSend = 
          (urgency === 'critical' && settings.criticalEnabled) ||
          (urgency === 'alert' && settings.alertEnabled) ||
          (urgency === 'reminder' && settings.reminderEnabled);

        if (shouldSend && shouldNotify(apt.id, urgency)) {
          const notification: AppointmentNotification = {
            id: apt.id,
            leadId: apt.lead_id,
            leadName: (apt.leads as any)?.nome,
            startAt: apt.start_at,
            title: apt.titulo,
            urgency,
          };

          await showBrowserNotification(notification);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar agendamentos:', error);
    }
  }, [user, settings, permission, isQuietHours]);

  // Verificação periódica (a cada 5 minutos)
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    checkAppointments(); // Primeira verificação
    const interval = setInterval(checkAppointments, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, permission, checkAppointments]);

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    permission,
    requestPermission,
    settings,
    updateSettings,
    checkAppointments,
  };
}
