import { toast } from "@/hooks/use-toast";

export interface AppointmentNotification {
  id: string;
  leadId: string;
  leadName?: string;
  startAt: string;
  title: string;
  urgency: 'critical' | 'alert' | 'reminder' | 'normal';
}

const NOTIFICATION_DELAYS = {
  critical: 30 * 60 * 1000, // 30 minutos
  alert: 2 * 60 * 60 * 1000, // 2 horas
  reminder: 24 * 60 * 60 * 1000, // 24 horas
};

const notifiedAppointments = new Set<string>();

export function calculateUrgency(startAt: string): 'critical' | 'alert' | 'reminder' | 'normal' {
  const now = new Date();
  const start = new Date(startAt);
  const diff = start.getTime() - now.getTime();

  if (diff < 0) return 'normal'; // Passou
  if (diff <= NOTIFICATION_DELAYS.critical) return 'critical';
  if (diff <= NOTIFICATION_DELAYS.alert) return 'alert';
  if (diff <= NOTIFICATION_DELAYS.reminder) return 'reminder';
  return 'normal';
}

export function getUrgencyColor(urgency: 'critical' | 'alert' | 'reminder' | 'normal'): string {
  switch (urgency) {
    case 'critical': return 'hsl(var(--destructive))';
    case 'alert': return 'hsl(var(--warning))';
    case 'reminder': return 'hsl(var(--primary))';
    default: return 'hsl(var(--muted-foreground))';
  }
}

export function getUrgencyLabel(urgency: 'critical' | 'alert' | 'reminder' | 'normal'): string {
  switch (urgency) {
    case 'critical': return 'Agora!';
    case 'alert': return 'Em breve';
    case 'reminder': return 'Hoje';
    default: return '';
  }
}

export function shouldNotify(appointmentId: string, urgency: 'critical' | 'alert' | 'reminder' | 'normal'): boolean {
  const key = `${appointmentId}-${urgency}`;
  if (notifiedAppointments.has(key)) return false;
  if (urgency === 'normal') return false;
  
  notifiedAppointments.add(key);
  return true;
}

export async function showBrowserNotification(appointment: AppointmentNotification): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const urgencyEmoji = {
    critical: '🚨',
    alert: '⚠️',
    reminder: '📅',
    normal: '📌',
  };

  const title = `${urgencyEmoji[appointment.urgency]} ${appointment.title}`;
  const options: NotificationOptions = {
    body: appointment.leadName ? `Lead: ${appointment.leadName}` : 'Agendamento próximo',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: appointment.id,
    requireInteraction: appointment.urgency === 'critical',
    data: {
      url: `/leads/${appointment.leadId}`,
    },
  };

  const notification = new Notification(title, options);
  
  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    if (appointment.leadId) {
      window.location.href = `/leads/${appointment.leadId}`;
    }
    notification.close();
  };

  // Toast como fallback
  toast({
    title,
    description: options.body,
    variant: appointment.urgency === 'critical' ? 'destructive' : 'default',
  });
}

export function clearNotificationHistory(): void {
  notifiedAppointments.clear();
}
