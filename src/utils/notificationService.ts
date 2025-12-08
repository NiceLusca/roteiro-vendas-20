import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'sla_breach' | 'appointment' | 'inactivity' | 'stage_timeout' | 'automation';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  leadId?: string;
  leadName?: string;
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        priority: params.priority,
        title: params.title,
        message: params.message,
        lead_id: params.leadId,
        lead_name: params.leadName,
        action_url: params.actionUrl,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// SLA Breach notification
export async function notifySLABreach(
  userId: string,
  leadId: string,
  leadName: string,
  stageName: string,
  daysOverdue: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'sla_breach',
    priority: daysOverdue > 3 ? 'critical' : 'high',
    title: 'SLA Excedido',
    message: `O lead "${leadName}" está ${daysOverdue} dia(s) atrasado na etapa "${stageName}".`,
    leadId,
    leadName,
    actionUrl: `/pipelines?lead=${leadId}`,
  });
}

// Appointment reminder notification
export async function notifyAppointmentReminder(
  userId: string,
  leadId: string,
  leadName: string,
  appointmentTitle: string,
  minutesUntil: number
): Promise<boolean> {
  let priority: NotificationPriority = 'medium';
  let timeText = '';

  if (minutesUntil <= 30) {
    priority = 'critical';
    timeText = `${minutesUntil} minutos`;
  } else if (minutesUntil <= 120) {
    priority = 'high';
    timeText = `${Math.round(minutesUntil / 60)} hora(s)`;
  } else {
    timeText = `${Math.round(minutesUntil / 60)} horas`;
  }

  return createNotification({
    userId,
    type: 'appointment',
    priority,
    title: 'Lembrete de Agendamento',
    message: `"${appointmentTitle}" com ${leadName} em ${timeText}.`,
    leadId,
    leadName,
    actionUrl: '/agenda',
  });
}

// Stage timeout warning notification
export async function notifyStageTimeout(
  userId: string,
  leadId: string,
  leadName: string,
  stageName: string,
  daysRemaining: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'stage_timeout',
    priority: daysRemaining <= 1 ? 'high' : 'medium',
    title: 'Prazo da Etapa Próximo',
    message: `O lead "${leadName}" tem ${daysRemaining} dia(s) restante(s) na etapa "${stageName}".`,
    leadId,
    leadName,
    actionUrl: `/pipelines?lead=${leadId}`,
  });
}

// Inactivity alert notification
export async function notifyInactivity(
  userId: string,
  leadId: string,
  leadName: string,
  daysSinceInteraction: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'inactivity',
    priority: daysSinceInteraction > 7 ? 'high' : 'medium',
    title: 'Lead sem Interação',
    message: `O lead "${leadName}" está sem interação há ${daysSinceInteraction} dia(s).`,
    leadId,
    leadName,
    actionUrl: `/leads/${leadId}`,
  });
}

// Automation notification
export async function notifyAutomation(
  userId: string,
  title: string,
  message: string,
  leadId?: string,
  leadName?: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'automation',
    priority: 'low',
    title,
    message,
    leadId,
    leadName,
  });
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}
