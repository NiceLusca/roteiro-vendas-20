import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AppointmentOption {
  id: string;
  lead_id: string;
  data_hora: string;
  start_at?: string;
  titulo?: string;
  status?: string;
}

interface AppointmentSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: AppointmentOption[];
  stageName: string;
  leadName: string;
  onConfirm: (appointmentId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AppointmentSelectorDialog({
  open,
  onOpenChange,
  appointments,
  stageName,
  leadName,
  onConfirm,
  onCancel,
  isLoading = false
}: AppointmentSelectorDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(appointments[0]?.id || '');

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(selectedId);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const formatAppointmentDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const isPast = (dateStr: string) => {
    try {
      return new Date(dateStr) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {appointments.length === 1 ? 'Confirme o agendamento' : 'Selecione o agendamento para o prazo'}
          </DialogTitle>
          <DialogDescription>
            A etapa <strong>"{stageName}"</strong> calcula o SLA baseado na data do agendamento.
            <br />
            {appointments.length === 1 
              ? <>Confirme se este é o agendamento correto para <strong>{leadName}</strong>:</>
              : <>Selecione qual agendamento de <strong>{leadName}</strong> usar:</>
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup 
            value={selectedId} 
            onValueChange={setSelectedId}
            className="space-y-3"
          >
            {appointments.map((apt) => {
              const dateStr = apt.start_at || apt.data_hora;
              const past = isPast(dateStr);
              
              return (
                <div 
                  key={apt.id}
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                    selectedId === apt.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  } ${past ? 'opacity-70' : ''}`}
                >
                  <RadioGroupItem value={apt.id} id={apt.id} />
                  <Label 
                    htmlFor={apt.id} 
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatAppointmentDate(dateStr)}
                        </span>
                        {past && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Passado
                          </Badge>
                        )}
                      </div>
                      {apt.titulo && (
                        <p className="text-sm text-muted-foreground pl-6">
                          {apt.titulo}
                        </p>
                      )}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Movendo...
              </>
            ) : (
              'Confirmar e Mover'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
