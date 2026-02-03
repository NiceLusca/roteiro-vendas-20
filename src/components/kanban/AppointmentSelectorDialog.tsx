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
import { Calendar, Clock, Loader2, Plus } from 'lucide-react';
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
  onCreateNew?: () => void;
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
  onCreateNew,
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

  const handleCreateNew = () => {
    onOpenChange(false);
    onCreateNew?.();
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
      <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <span className="truncate">
              {appointments.length === 1 ? 'Confirme o agendamento' : 'Selecione o agendamento'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-left">
            A etapa <strong className="break-words">"{stageName}"</strong> calcula o SLA baseado na data do agendamento.
            <br />
            {appointments.length === 1 
              ? <>Confirme se este é o agendamento correto para <strong className="break-words">{leadName}</strong>:</>
              : <>Selecione qual agendamento de <strong className="break-words">{leadName}</strong> usar:</>
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[40vh] overflow-y-auto">
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
                  className={`flex items-start space-x-3 rounded-lg border p-3 transition-colors ${
                    selectedId === apt.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  } ${past ? 'opacity-70' : ''}`}
                >
                  <RadioGroupItem value={apt.id} id={apt.id} className="mt-1 shrink-0" />
                  <Label 
                    htmlFor={apt.id} 
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium whitespace-nowrap">
                          {formatAppointmentDate(dateStr)}
                        </span>
                        {past && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 shrink-0">
                            Passado
                          </Badge>
                        )}
                      </div>
                      {apt.titulo && (
                        <p className="text-sm text-muted-foreground pl-6 break-words line-clamp-2">
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            {onCreateNew && (
              <Button variant="ghost" onClick={handleCreateNew} disabled={isLoading} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Criar novo prazo
              </Button>
            )}
          </div>
          <Button onClick={handleConfirm} disabled={!selectedId || isLoading} className="w-full sm:w-auto">
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
