import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { Appointment, StatusAppointment, ResultadoSessao } from '@/types/crm';

const appointmentSchema = z.object({
  lead_id: z.string().min(1, 'Lead é obrigatório'),
  start_at: z.string().min(1, 'Data e hora são obrigatórias'),
  status: z.enum(['agendado', 'realizado', 'cancelado', 'remarcado', 'confirmado'] as const),
  resultado_sessao: z.enum(['Avançar', 'Não Avançar', 'Recuperação', 'Cliente', 'Outro'] as const).optional(),
  resultado_obs: z.string().optional(),
  observacao: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  initialData?: Partial<Appointment>;
  onSave: (data: AppointmentFormData) => void;
  onCancel: () => void;
}

export function AppointmentForm({ initialData, onSave, onCancel }: AppointmentFormProps) {
  const { leads } = useSupabaseLeads();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      lead_id: initialData?.lead_id || '',
      start_at: initialData?.start_at ? new Date(initialData.start_at).toISOString().slice(0, 16) : '',
      status: initialData?.status || 'agendado',
      resultado_sessao: initialData?.resultado_sessao || undefined,
      resultado_obs: initialData?.resultado_obs || '',
      observacao: initialData?.observacao || '',
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    onSave(data);
  };

  const statusOptions: { value: StatusAppointment; label: string }[] = [
    { value: 'agendado', label: 'Agendado' },
    { value: 'realizado', label: 'Realizado' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'remarcado', label: 'Remarcado' },
    { value: 'confirmado', label: 'Confirmado' },
  ];

  const resultadoOptions: { value: ResultadoSessao; label: string }[] = [
    { value: 'Avançar', label: 'Avançar' },
    { value: 'Não Avançar', label: 'Não Avançar' },
    { value: 'Recuperação', label: 'Recuperação' },
    { value: 'Cliente', label: 'Cliente' },
    { value: 'Outro', label: 'Outro' },
  ];

  const watchedStatus = form.watch('status');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="lead_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.nome} - {lead.whatsapp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e Hora *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedStatus === 'realizado' && (
          <FormField
            control={form.control}
            name="resultado_sessao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resultado da Sessão</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o resultado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {resultadoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="resultado_obs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações do Resultado</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o resultado da sessão..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações Gerais</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o agendamento..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}