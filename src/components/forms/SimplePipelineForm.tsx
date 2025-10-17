import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils';

// Schema de validação - apenas campos que existem na tabela pipelines
const pipelineSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
  objetivo: z.string().max(500, 'Objetivo muito longo').optional(),
  primary_pipeline: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

type PipelineFormData = z.infer<typeof pipelineSchema>;

interface Pipeline {
  id?: string;
  nome: string;
  descricao?: string;
  objetivo?: string;
  primary_pipeline: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SimplePipelineFormProps {
  pipeline?: Pipeline | null;
  onSave: (data: PipelineFormData) => Promise<void>;
  onCancel: () => void;
}

export function SimplePipelineForm({ pipeline, onSave, onCancel }: SimplePipelineFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      nome: pipeline?.nome || '',
      descricao: pipeline?.descricao || '',
      objetivo: pipeline?.objetivo || '',
      primary_pipeline: pipeline?.primary_pipeline || false,
      ativo: pipeline?.ativo ?? true,
    },
  });

  const handleSubmit = async (data: PipelineFormData) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        {/* Nome do Pipeline */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Nome do Pipeline <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Vendas Consultoria, Onboarding Clientes..." 
                  {...field} 
                  disabled={isSaving}
                />
              </FormControl>
              <FormDescription>
                URL: /pipelines/{generateSlug(field.value || 'novo-pipeline')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva brevemente o propósito deste pipeline..."
                  rows={3}
                  {...field}
                  disabled={isSaving}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Uma breve descrição para identificar o pipeline
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Objetivo */}
        <FormField
          control={form.control}
          name="objetivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Objetivo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ex: Converter leads qualificados em clientes pagantes..."
                  rows={3}
                  {...field}
                  disabled={isSaving}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Qual é o objetivo principal deste pipeline?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Checkboxes básicas */}
        <div className="space-y-4 border-t pt-4">
          <FormField
            control={form.control}
            name="primary_pipeline"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium">
                    Pipeline Primário
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Este será o pipeline padrão para novos leads
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium">
                    Pipeline Ativo
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Apenas pipelines ativos podem receber novos leads
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Pipeline'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
