import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Lead, PipelineStage } from '@/types/crm';

interface EnhancedAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  stage?: PipelineStage;
  onSave: (appointmentData: any) => void;
}

const tiposSessao = [
  { value: 'Descoberta', label: 'Sessão de Descoberta', description: 'Entender necessidades e qualificar o lead' },
  { value: 'Apresentacao', label: 'Apresentação de Proposta', description: 'Apresentar solução e proposta comercial' },
  { value: 'Fechamento', label: 'Sessão de Fechamento', description: 'Negociar e fechar o negócio' },
  { value: 'Follow-up', label: 'Follow-up', description: 'Acompanhamento e relacionamento' }
];

const horariosDisponiveis = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const duracoesPadrao = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' }
];

const closersDisponiveis = [
  'João Silva',
  'Maria Santos',
  'Pedro Costa',
  'Ana Lima',
  'Carlos Oliveira'
];

export function EnhancedAppointmentDialog({
  open,
  onOpenChange,
  lead,
  stage,
  onSave
}: EnhancedAppointmentDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [tipoSessao, setTipoSessao] = useState('');
  const [closerResponsavel, setCloserResponsavel] = useState('');
  const [observacao, setObservacao] = useState('');

  // Auto-populate based on stage configuration
  useEffect(() => {
    if (stage && open) {
      // Set tipo_sessao based on stage
      if (stage.tipo_agendamento) {
        setTipoSessao(stage.tipo_agendamento);
      }
      
      // Set default closer
      if (stage.closer_padrao) {
        setCloserResponsavel(stage.closer_padrao);
      } else if (lead.closer) {
        setCloserResponsavel(lead.closer);
      }

      // Set preferred time if available
      if (stage.horarios_preferenciais) {
        const prefs = stage.horarios_preferenciais as any;
        if (prefs.horarios && prefs.horarios.length > 0) {
          setTime(prefs.horarios[0]);
        }
      }

      // Set template description
      if (stage.template_agendamento) {
        const template = stage.template_agendamento as any;
        if (template.descricao) {
          setObservacao(template.descricao);
        }
      }

      // Set duration based on stage
      if (stage.duracao_minutos) {
        setDuration(stage.duracao_minutos.toString());
      }
    }
  }, [stage, lead, open]);

  const handleSave = () => {
    if (!date || !time) {
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + parseInt(duration));

    const appointmentData = {
      lead_id: lead.id,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      etapa_origem_id: stage?.id,
      tipo_sessao: tipoSessao,
      closer_responsavel: closerResponsavel,
      observacao,
      status: 'Agendado',
      origem: 'Plataforma'
    };

    onSave(appointmentData);
    handleCancel();
  };

  const handleCancel = () => {
    setDate(undefined);
    setTime('');
    setDuration('60');
    setTipoSessao('');
    setCloserResponsavel('');
    setObservacao('');
    onOpenChange(false);
  };

  const selectedTipoSessao = tiposSessao.find(t => t.value === tipoSessao);

  if (!lead) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agendar Sessão - {lead.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{lead.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  {lead.whatsapp} • {lead.origem}
                </p>
              </div>
              {stage && (
                <Badge variant="outline">
                  Etapa: {stage.nome}
                </Badge>
              )}
            </div>
          </div>

          {/* Tipo de Sessão */}
          <div className="space-y-2">
            <Label htmlFor="tipo-sessao">Tipo de Sessão</Label>
            <Select value={tipoSessao} onValueChange={setTipoSessao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de sessão" />
              </SelectTrigger>
              <SelectContent>
                {tiposSessao.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div>
                      <div className="font-medium">{tipo.label}</div>
                      <div className="text-xs text-muted-foreground">{tipo.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTipoSessao && (
              <p className="text-xs text-muted-foreground">
                {selectedTipoSessao.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div className="space-y-2">
              <Label>Data da Sessão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label>Horário</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar horário" />
                </SelectTrigger>
                <SelectContent>
                  {horariosDisponiveis.map((horario) => (
                    <SelectItem key={horario} value={horario}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {horario}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duração */}
            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {duracoesPadrao.map((dur) => (
                    <SelectItem key={dur.value} value={dur.value}>
                      {dur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Closer Responsável */}
            <div className="space-y-2">
              <Label>Closer Responsável</Label>
              <Select value={closerResponsavel} onValueChange={setCloserResponsavel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar closer" />
                </SelectTrigger>
                <SelectContent>
                  {closersDisponiveis.map((closer) => (
                    <SelectItem key={closer} value={closer}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {closer}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observações da Sessão</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva o objetivo da sessão, tópicos a abordar, etc."
              rows={3}
            />
          </div>

          {/* Preview */}
          {date && time && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Resumo do Agendamento</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Data:</strong> {format(date, "dd/MM/yyyy", { locale: ptBR })}</p>
                <p><strong>Horário:</strong> {time} ({duration} minutos)</p>
                <p><strong>Tipo:</strong> {selectedTipoSessao?.label}</p>
                <p><strong>Closer:</strong> {closerResponsavel}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!date || !time || !tipoSessao || !closerResponsavel}
          >
            Agendar Sessão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}