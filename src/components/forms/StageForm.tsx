import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const stageSchema = z.object({
  pipeline_id: z.string().uuid(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ordem: z.number().min(1),
  prazo_em_dias: z.number().min(1),
  proximo_passo_label: z.string().optional(),
  proximo_passo_tipo: z.enum(['Humano', 'Agendamento', 'Mensagem', 'Outro']),
  entrada_criteria: z.string().optional(),
  saida_criteria: z.string().optional(),
  wip_limit: z.number().optional(),
  gerar_agendamento_auto: z.boolean().default(false),
  duracao_minutos: z.number().optional(),
});

type StageFormData = z.infer<typeof stageSchema>;

interface StageFormProps {
  stage?: Partial<StageFormData> & { id?: string } | null;
  onSave: (data: StageFormData) => void;
  onCancel: () => void;
}

export function StageForm({ stage, onSave, onCancel }: StageFormProps) {

  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      pipeline_id: stage?.pipeline_id || '',
      nome: stage?.nome || '',
      ordem: stage?.ordem || 1,
      prazo_em_dias: stage?.prazo_em_dias || 3,
      proximo_passo_label: stage?.proximo_passo_label || '',
      proximo_passo_tipo: stage?.proximo_passo_tipo || 'Humano',
      entrada_criteria: stage?.entrada_criteria || '',
      saida_criteria: stage?.saida_criteria || '',
      wip_limit: stage?.wip_limit || undefined,
      gerar_agendamento_auto: stage?.gerar_agendamento_auto || false,
      duracao_minutos: stage?.duracao_minutos || undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <FormField
          control={form.control}
          name="pipeline_id"
          render={({ field }) => (
            <input type="hidden" {...field} />
          )}
        />
        
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prazo_em_dias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo (dias) *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="proximo_passo_tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo do Próximo Passo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Humano">Humano</SelectItem>
                  <SelectItem value="Agendamento">Agendamento</SelectItem>
                  <SelectItem value="Mensagem">Mensagem</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proximo_passo_label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Próximo Passo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Agendar apresentação comercial" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="entrada_criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critérios de Entrada</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descreva os critérios para entrar nesta etapa" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="saida_criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critérios de Saída</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descreva os critérios para sair desta etapa" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="wip_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite WIP</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0"
                    placeholder="Ex: 5"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duracao_minutos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0"
                    placeholder="Ex: 60"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="gerar_agendamento_auto"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Gerar agendamento automático
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Cria automaticamente um agendamento quando o lead entra nesta etapa
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}