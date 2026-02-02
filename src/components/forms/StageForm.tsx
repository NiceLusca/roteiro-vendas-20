import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCcw, Loader2, Calendar, Info } from 'lucide-react';

// Cores pré-definidas para grupos
const GROUP_COLOR_PRESETS = [
  { label: 'Azul', value: '#3B82F6' },
  { label: 'Violeta', value: '#8B5CF6' },
  { label: 'Púrpura', value: '#A855F7' },
  { label: 'Laranja', value: '#F97316' },
  { label: 'Verde', value: '#10B981' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Amarelo', value: '#EAB308' },
  { label: 'Ciano', value: '#06B6D4' },
];

const stageSchema = z.object({
  pipeline_id: z.string().uuid(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ordem: z.number().min(1),
  prazo_em_dias: z.number().min(1).nullable().optional(),
  proximo_passo_label: z.string().optional(),
  proximo_passo_tipo: z.enum(['Humano', 'Agendamento', 'Mensagem', 'Outro']),
  entrada_criteria: z.string().optional(),
  saida_criteria: z.string().optional(),
  wip_limit: z.number().optional(),
  gerar_agendamento_auto: z.boolean().default(false),
  duracao_minutos: z.number().optional(),
  proxima_etapa_id: z.string().nullable().optional(), // 'final' ou UUID
  is_final_stage: z.boolean().default(false),
  grupo: z.string().optional().nullable(),
  cor_grupo: z.string().optional().nullable(),
  // Novos campos para SLA baseado em agendamento
  sla_baseado_em: z.enum(['entrada', 'agendamento']).default('entrada'),
  requer_agendamento: z.boolean().default(false),
});

type StageFormData = z.infer<typeof stageSchema>;

interface PipelineStageOption {
  id: string;
  nome: string;
  ordem: number;
}

interface StageFormProps {
  stage?: Partial<StageFormData> & { id?: string } | null;
  pipelineStages?: PipelineStageOption[];
  onSave: (data: StageFormData) => Promise<void> | void;
  onCancel: () => void;
}

export function StageForm({ stage, pipelineStages = [], onSave, onCancel }: StageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detect if this is a final stage (proxima_etapa_id === 'final' marker)
  const isFinalStage = stage?.proxima_etapa_id === 'final';
  
  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      pipeline_id: stage?.pipeline_id || '',
      nome: stage?.nome || '',
      ordem: stage?.ordem || 1,
      prazo_em_dias: stage?.prazo_em_dias ?? null,
      proximo_passo_label: stage?.proximo_passo_label || '',
      proximo_passo_tipo: stage?.proximo_passo_tipo || 'Humano',
      entrada_criteria: stage?.entrada_criteria || '',
      saida_criteria: stage?.saida_criteria || '',
      wip_limit: stage?.wip_limit || undefined,
      gerar_agendamento_auto: stage?.gerar_agendamento_auto || false,
      duracao_minutos: stage?.duracao_minutos || undefined,
      proxima_etapa_id: isFinalStage ? 'final' : (stage?.proxima_etapa_id || null),
      is_final_stage: isFinalStage,
      grupo: stage?.grupo || null,
      cor_grupo: stage?.cor_grupo || null,
      sla_baseado_em: (stage as any)?.sla_baseado_em || 'entrada',
      requer_agendamento: (stage as any)?.requer_agendamento || false,
    },
  });

  // Filter out current stage from options
  const availableNextStages = pipelineStages.filter(s => s.id !== stage?.id);

  const handleSubmit = useCallback(async (data: StageFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      await onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, isSubmitting]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                <FormLabel>Prazo SLA (dias)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="1"
                    placeholder="Sem prazo"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormDescription>
                  Deixe vazio para etapas sem SLA (ex: finais)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Configuração de SLA baseado em Agendamento */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Configuração de SLA</span>
          </div>
          
          <FormField
            control={form.control}
            name="sla_baseado_em"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base do cálculo SLA</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Se baseado em agendamento, habilitar requer_agendamento por padrão
                    if (value === 'agendamento') {
                      form.setValue('requer_agendamento', true);
                    }
                  }} 
                  value={field.value || 'entrada'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entrada">
                      📅 Data de entrada na etapa (padrão)
                    </SelectItem>
                    <SelectItem value="agendamento">
                      🗓️ Data do agendamento vinculado
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {field.value === 'agendamento' 
                    ? 'O prazo SLA será contado a partir da data do agendamento selecionado'
                    : 'O prazo SLA será contado a partir do momento que o lead entra na etapa'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch('sla_baseado_em') === 'agendamento' && (
            <FormField
              control={form.control}
              name="requer_agendamento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-background">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-1.5">
                      Bloquear movimentação sem agendamento
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-xs">
                          Se ativado, o lead só poderá ser movido para esta etapa se tiver um agendamento definido. 
                          Caso tenha múltiplos agendamentos, será solicitado escolher qual usar para o SLA.
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Exige que o lead tenha um agendamento ao entrar nesta etapa
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Campos de Agrupamento Visual */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="grupo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo Visual</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="Ex: Pré-Sessão, Recuperação..."
                  />
                </FormControl>
                <FormDescription>
                  Opcional - agrupa etapas visualmente no Kanban
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cor_grupo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor do Grupo</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Padrão (verde)</span>
                    </SelectItem>
                    {GROUP_COLOR_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preset.value }}
                          />
                          {preset.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Cor da barra superior das colunas do grupo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="proxima_etapa_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" />
                Próxima Etapa
              </FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value === 'auto' ? null : value);
                  // If marking as final, also clear SLA
                  if (value === 'final') {
                    form.setValue('is_final_stage', true);
                    form.setValue('prazo_em_dias', null);
                  } else {
                    form.setValue('is_final_stage', false);
                  }
                }} 
                value={field.value || 'auto'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a próxima etapa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="auto">
                    <span className="text-muted-foreground">Automático (próxima na ordem)</span>
                  </SelectItem>
                  <SelectItem value="final">
                    <span className="text-warning font-medium">🏁 Etapa Final (sem próximo passo)</span>
                  </SelectItem>
                  {availableNextStages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.ordem}. {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Use "Etapa Final" para etapas de conclusão (ganho, perdido, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
