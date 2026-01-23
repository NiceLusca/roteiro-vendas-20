import { useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { useLeadSearch } from '@/hooks/useLeadSearch';
import { AppointmentForm } from '@/components/forms/AppointmentForm';
import { formatDate } from '@/utils/formatters';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

export default function Agenda() {
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { appointments, saveAppointment, cancelAppointment, refetch: refetchAppointments } = useSupabaseAppointments();
  
  // Usar hook otimizado - busca apenas leads necessários (limite maior para agenda)
  const { data: leads = [] } = useLeadSearch({ limit: 200 });

  // Transform appointments into calendar events
  const events = appointments.map(appointment => {
    const lead = leads.find(l => l.id === appointment.lead_id);
    return {
      id: appointment.id,
      title: `${lead?.nome || 'Lead não encontrado'} - ${appointment.status}`,
      start: new Date(appointment.start_at),
      end: new Date(appointment.end_at),
      resource: {
        ...appointment,
        leadName: lead?.nome || 'Lead não encontrado'
      }
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agendado': return 'bg-blue-500';
      case 'Realizado': return 'bg-green-500';
      case 'Cancelado': return 'bg-red-500';
      case 'Remarcado': return 'bg-yellow-500';
      case 'No-Show': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Agendado': return 'status-badge status-badge-info';
      case 'Realizado': return 'status-badge status-badge-success';
      case 'Cancelado': return 'status-badge status-badge-danger';
      case 'Remarcado': return 'status-badge status-badge-warning';
      case 'No-Show': return 'status-badge status-badge-muted';
      default: return 'status-badge status-badge-muted';
    }
  };

  const eventStyleGetter = (event: any) => {
    const appointment = event.resource;
    const statusColors = {
      'Agendado': '#3b82f6', // blue-500
      'Realizado': '#22c55e', // green-500
      'Cancelado': '#ef4444', // red-500
      'Remarcado': '#eab308', // yellow-500
      'No-Show': '#6b7280' // gray-500
    };
    
    return {
      style: {
        backgroundColor: statusColors[appointment.status as keyof typeof statusColors] || '#3b82f6',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    const upcoming = appointments
      .filter(apt => new Date(apt.start_at) > now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 5);

    return upcoming;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos e sessões</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              onSave={async (appointmentData) => {
                try {
                  const startAt = new Date(appointmentData.start_at).toISOString();
                  const endAt = new Date(new Date(appointmentData.start_at).getTime() + 60 * 60 * 1000).toISOString(); // 1 hour default
                  
                  await saveAppointment({
                    ...appointmentData,
                    start_at: new Date(startAt),
                    end_at: new Date(endAt)
                  });
                  
                  await refetchAppointments();
                  setIsCreateDialogOpen(false);
                } catch (error) {
                  console.error('Erro ao criar agendamento:', error);
                }
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] p-4">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  view={currentView}
                  onView={setCurrentView}
                  date={currentDate}
                  onNavigate={setCurrentDate}
                  messages={messages}
                  culture="pt-BR"
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-interactive relative overflow-hidden">
            <div className="card-header-gradient absolute top-0 left-0 right-0" />
            <CardHeader className="pt-4">
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUpcomingAppointments().map((appointment) => {
                  const lead = leads.find(l => l.id === appointment.lead_id);
                  return (
                    <div key={appointment.id} className="list-item-hover flex items-center justify-between p-3 border">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{lead?.nome || 'Lead não encontrado'}</span>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(new Date(appointment.start_at))}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusBadgeClass(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  );
                })}
                {getUpcomingAppointments().length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum agendamento próximo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="card-interactive relative overflow-hidden">
            <div className="card-header-gradient absolute top-0 left-0 right-0" />
            <CardHeader className="pt-4">
              <CardTitle>Estatísticas do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="list-item-hover flex justify-between p-2">
                  <span className="text-sm text-muted-foreground">Total hoje</span>
                  <span className="text-sm font-medium">
                    {appointments.filter(a => {
                      const today = new Date();
                      const aptDate = new Date(a.start_at);
                      return aptDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="list-item-hover flex justify-between p-2">
                  <span className="text-sm text-muted-foreground">Realizadas</span>
                  <span className="text-sm font-medium text-success">
                    {appointments.filter(a => {
                      const today = new Date();
                      const aptDate = new Date(a.start_at);
                      return aptDate.toDateString() === today.toDateString() && a.status === 'Realizado';
                    }).length}
                  </span>
                </div>
                <div className="list-item-hover flex justify-between p-2">
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                  <span className="text-sm font-medium text-warning">
                    {appointments.filter(a => {
                      const today = new Date();
                      const aptDate = new Date(a.start_at);
                      return aptDate.toDateString() === today.toDateString() && a.status === 'Agendado';
                    }).length}
                  </span>
                </div>
                <div className="list-item-hover flex justify-between p-2">
                  <span className="text-sm text-muted-foreground">No-Show</span>
                  <span className="text-sm font-medium text-destructive">
                    {appointments.filter(a => {
                      const today = new Date();
                      const aptDate = new Date(a.start_at);
                      return aptDate.toDateString() === today.toDateString() && a.status === 'No-Show';
                    }).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lead</p>
                <p className="text-sm">
                  {leads.find(l => l.id === selectedEvent.resource.lead_id)?.nome || 'Lead não encontrado'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data e Hora</p>
                <p className="text-sm">{formatDate(new Date(selectedEvent.resource.start_at))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusBadgeClass(selectedEvent.resource.status)}>
                  {selectedEvent.resource.status}
                </Badge>
              </div>
              {selectedEvent.resource.resultado_obs && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedEvent.resource.resultado_obs}</p>
                </div>
              )}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    setIsEditDialogOpen(true);
                  }}
                  disabled={selectedEvent.resource.status === 'Realizado' || selectedEvent.resource.status === 'Cancelado'}
                >
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(true);
                  }}
                  disabled={selectedEvent.resource.status === 'Realizado' || selectedEvent.resource.status === 'Cancelado'}
                >
                  Remarcar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={async () => {
                    if (cancelAppointment) {
                      await cancelAppointment(selectedEvent.resource.id);
                      await refetchAppointments();
                      setSelectedEvent(null);
                    }
                  }}
                  disabled={selectedEvent.resource.status === 'Cancelado'}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Appointment Dialog */}
      {selectedEvent && isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              initialData={{
                lead_id: selectedEvent.resource.lead_id,
                start_at: selectedEvent.resource.start_at,
                status: selectedEvent.resource.status,
                resultado_sessao: selectedEvent.resource.resultado_sessao
              }}
              onSave={async (appointmentData) => {
                try {
                  const endAt = new Date(new Date(appointmentData.start_at).getTime() + 60 * 60 * 1000);
                  
                  await saveAppointment({
                    ...appointmentData,
                    id: selectedEvent.resource.id,
                    start_at: new Date(appointmentData.start_at),
                    end_at: endAt
                  });
                  
                  await refetchAppointments();
                  setIsEditDialogOpen(false);
                  setSelectedEvent(null);
                } catch (error) {
                  console.error('Erro ao editar agendamento:', error);
                }
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
