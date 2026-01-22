import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useNotificationSettings } from './useNotificationSettings';
import { 
  notifySLABreach, 
  notifyStageTimeout, 
  notifyAppointmentReminder 
} from '@/utils/notificationService';
import { 
  calculateUrgency, 
  shouldNotify, 
  showBrowserNotification,
  type AppointmentNotification 
} from '@/utils/appointmentNotifier';
import { differenceInDays, differenceInMinutes } from 'date-fns';
import { logger } from '@/utils/logger';

// Track sent notifications to avoid duplicates (cleared on page refresh)
const sentNotifications = new Set<string>();

// Singleton check interval to prevent multiple instances
let checkIntervalId: NodeJS.Timeout | null = null;
let isEngineRunning = false;

export function useNotificationEngine() {
  const { user } = useAuth();
  const { settings, isQuietHours } = useNotificationSettings();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      logger.warn('Browser não suporta notificações', { feature: 'notification-engine' });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Check SLA breaches for leads in pipelines
  const checkSLABreaches = useCallback(async () => {
    if (!user?.id || !settings.sla_breaches || isQuietHours()) return;

    try {
      const { data: entries, error } = await supabase
        .from('lead_pipeline_entries')
        .select(`
          id,
          lead_id,
          data_entrada_etapa,
          pipeline_stages!fk_lead_pipeline_entries_stage(
            id,
            nome,
            prazo_em_dias
          ),
          leads!fk_lead_pipeline_entries_lead(
            nome
          )
        `)
        .eq('status_inscricao', 'ativo')
        .not('etapa_atual_id', 'is', null)
        .limit(200); // Limit for performance

      if (error || !entries) return;

      for (const entry of entries) {
        const stage = entry.pipeline_stages as any;
        const lead = entry.leads as any;
        
        if (!stage?.prazo_em_dias || !entry.data_entrada_etapa || !lead?.nome) continue;

        const daysInStage = differenceInDays(new Date(), new Date(entry.data_entrada_etapa));
        const daysOverdue = daysInStage - stage.prazo_em_dias;

        // Check for SLA breach (overdue)
        if (daysOverdue > 0) {
          const notificationKey = `sla_breach_${entry.lead_id}_${stage.id}_${daysOverdue}`;
          
          if (!sentNotifications.has(notificationKey)) {
            await notifySLABreach(
              user.id,
              entry.lead_id,
              lead.nome,
              stage.nome,
              daysOverdue
            );
            sentNotifications.add(notificationKey);
          }
        }

        // Check for stage timeout warning (1 day remaining)
        if (settings.stage_timeouts) {
          const daysRemaining = stage.prazo_em_dias - daysInStage;
          
          if (daysRemaining === 1 || daysRemaining === 0) {
            const notificationKey = `stage_timeout_${entry.lead_id}_${stage.id}_${daysRemaining}`;
            
            if (!sentNotifications.has(notificationKey)) {
              await notifyStageTimeout(
                user.id,
                entry.lead_id,
                lead.nome,
                stage.nome,
                daysRemaining
              );
              sentNotifications.add(notificationKey);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Erro ao verificar SLA breaches', error as Error, { feature: 'notification-engine' });
    }
  }, [user?.id, settings.sla_breaches, settings.stage_timeouts, isQuietHours]);

  // Check upcoming appointments and send reminders
  const checkAppointments = useCallback(async () => {
    if (!user?.id || !settings.appointment_reminders || isQuietHours()) return;
    if (permission !== 'granted') return;

    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          titulo,
          start_at,
          lead_id,
          leads!appointments_lead_id_fkey(nome)
        `)
        .eq('status', 'agendado')
        .gte('start_at', now.toISOString())
        .lte('start_at', in24Hours.toISOString())
        .limit(50); // Limit for performance

      if (error || !appointments) return;

      for (const appointment of appointments) {
        const lead = appointment.leads as any;
        if (!appointment.start_at || !lead?.nome) continue;

        const minutesUntil = differenceInMinutes(new Date(appointment.start_at), now);
        const urgency = calculateUrgency(appointment.start_at);

        // Send reminders at 24h, 2h, and 30min
        const reminderPoints = [1440, 120, 30]; // minutes
        
        for (const point of reminderPoints) {
          // Check if we're within 5 minutes of the reminder point
          if (minutesUntil <= point && minutesUntil > point - 5) {
            const notificationKey = `appointment_${appointment.id}_${point}`;
            
            if (!sentNotifications.has(notificationKey) && shouldNotify(appointment.id, urgency)) {
              // Create database notification
              await notifyAppointmentReminder(
                user.id,
                appointment.lead_id,
                lead.nome,
                appointment.titulo,
                minutesUntil
              );

              // Show browser notification
              const browserNotification: AppointmentNotification = {
                id: appointment.id,
                leadId: appointment.lead_id,
                leadName: lead.nome,
                startAt: appointment.start_at,
                title: appointment.titulo,
                urgency,
              };
              await showBrowserNotification(browserNotification);

              sentNotifications.add(notificationKey);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Erro ao verificar agendamentos', error as Error, { feature: 'notification-engine' });
    }
  }, [user?.id, settings.appointment_reminders, permission, isQuietHours]);

  // Combined check function
  const runAllChecks = useCallback(async () => {
    await Promise.all([
      checkSLABreaches(),
      checkAppointments()
    ]);
  }, [checkSLABreaches, checkAppointments]);

  // Run checks periodically (singleton pattern - only one interval)
  useEffect(() => {
    if (!user?.id) return;

    // Prevent multiple instances
    if (isEngineRunning) {
      return;
    }
    isEngineRunning = true;

    // Initial check after a short delay
    const initialTimeout = setTimeout(runAllChecks, 5000);

    // Check every 5 minutes (only one interval globally)
    if (!checkIntervalId) {
      checkIntervalId = setInterval(runAllChecks, 5 * 60 * 1000);
    }

    return () => {
      clearTimeout(initialTimeout);
      isEngineRunning = false;
      // Don't clear the interval here - it's shared
    };
  }, [user?.id, runAllChecks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }
      isEngineRunning = false;
    };
  }, []);

  return {
    permission,
    requestPermission,
    checkSLABreaches,
    checkAppointments,
    runAllChecks,
  };
}
