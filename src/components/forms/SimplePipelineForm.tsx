import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ChevronDown } from 'lucide-react';

// Schema de validação completo com campos avançados
const pipelineSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
  objetivo: z.string().max(500, 'Objetivo muito longo').optional(),
  primary_pipeline: z.boolean().default(false),
  ativo: z.boolean().default(true),
  // Campos avançados - transformados para arrays quando necessário
  segmento_alvo: z.string().max(200, 'Segmento muito longo').optional(),
  responsaveis: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  default_para_novos_leads: z.boolean().default(false),
});

type PipelineFormData = z.infer<typeof pipelineSchema>;

interface Pipeline {
  id?: string;
  nome: string;
  descricao?: string;
  objetivo?: string;
  primary_pipeline: boolean;
  ativo: boolean;
  segmento_alvo?: string;
  responsaveis?: string[];
  tags?: string[];
  default_para_novos_leads?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SimplePipelineFormProps {
  pipeline?: Pipeline | null;
  onSave: (data: PipelineFormData) => Promise<void>;
  onCancel: () => void;
}

export function SimplePipelineForm({ pipeline, onSave, onCancel }: SimplePipelineFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  // Helper para converter arrays em strings para edição
  const arrayToString = (arr?: string[] | null) => arr?.join(', ') || '';

  const form = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      nome: pipeline?.nome || '',
      descricao: pipeline?.descricao || '',
      objetivo: pipeline?.objetivo || '',
      primary_pipeline: pipeline?.primary_pipeline || false,
      ativo: pipeline?.ativo ?? true,
      segmento_alvo: pipeline?.segmento_alvo || '',
      responsaveis: pipeline?.responsaveis || [],
      tags: pipeline?.tags || [],
      default_para_novos_leads: pipeline?.default_para_novos_leads || false,
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

        {/* Configurações Avançadas (Colapsável) */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border-t pt-4">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex items-center justify-between w-full p-0 hover:bg-transparent"
            >
              <span className="text-sm font-semibold">Configurações Avançadas</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Segmento Alvo */}
            <FormField
              control={form.control}
              name="segmento_alvo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento Alvo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Pequenas empresas de tecnologia, Infoprodutores..."
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Defina o público-alvo deste pipeline
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Responsáveis */}
            <FormField
              control={form.control}
              name="responsaveis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsáveis</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: João Silva, Maria Santos..."
                      value={arrayToString(field.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
                      }}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Liste os responsáveis por este pipeline (separados por vírgula)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: vendas, consultoria, onboarding..."
                      value={arrayToString(field.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
                      }}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Tags para organizar e filtrar pipelines (separadas por vírgula)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pipeline padrão para novos leads */}
            <FormField
              control={form.control}
              name="default_para_novos_leads"
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
                      Pipeline Padrão para Novos Leads
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Novos leads serão automaticamente atribuídos a este pipeline
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

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
