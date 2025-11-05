import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logger } from '@/utils/logger';

// Schema para dados básicos do pipeline
const basicDataSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
  objetivo: z.string().max(500, 'Objetivo muito longo').optional(),
  primary_pipeline: z.boolean().default(false),
  ativo: z.boolean().default(true),
  segmento_alvo: z.string().max(200, 'Segmento muito longo').optional(),
  responsaveis: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  default_para_novos_leads: z.boolean().default(false),
});

type BasicDataFormData = z.infer<typeof basicDataSchema>;

interface PipelineStageData {
  nome: string;
  prazo_em_dias: number;
  ordem: number;
  checklist_items?: string[];
}

interface PipelineWizardFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function PipelineWizardForm({ onSave, onCancel }: PipelineWizardFormProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [basicData, setBasicData] = React.useState<BasicDataFormData | null>(null);
  const [stages, setStages] = React.useState<PipelineStageData[]>([]);
  const [newStageName, setNewStageName] = React.useState('');
  const [newStagePrazo, setNewStagePrazo] = React.useState(7);
  const [editingStageIndex, setEditingStageIndex] = React.useState<number | null>(null);
  const [newChecklistItem, setNewChecklistItem] = React.useState('');
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const form = useForm<BasicDataFormData>({
    resolver: zodResolver(basicDataSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      objetivo: '',
      primary_pipeline: false,
      ativo: true,
      segmento_alvo: '',
      responsaveis: [],
      tags: [],
      default_para_novos_leads: false,
    },
  });

  const arrayToString = (arr?: string[] | null) => arr?.join(', ') || '';

  // Step 1: Salvar dados básicos
  const handleBasicDataSubmit = (data: BasicDataFormData) => {
    setBasicData(data);
    setCurrentStep(2);
  };

  // Step 2: Adicionar etapa
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    
    const newStage: PipelineStageData = {
      nome: newStageName.trim(),
      prazo_em_dias: newStagePrazo,
      ordem: stages.length + 1,
      checklist_items: [],
    };
    
    setStages([...stages, newStage]);
    setNewStageName('');
    setNewStagePrazo(7);
    setEditingStageIndex(stages.length); // Auto-editar checklist da nova etapa
  };

  // Remover etapa
  const handleRemoveStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    // Reordenar
    updatedStages.forEach((stage, i) => {
      stage.ordem = i + 1;
    });
    setStages(updatedStages);
    setEditingStageIndex(null);
  };

  // Adicionar item ao checklist da etapa
  const handleAddChecklistItem = (stageIndex: number) => {
    if (!newChecklistItem.trim()) return;
    
    const updatedStages = [...stages];
    if (!updatedStages[stageIndex].checklist_items) {
      updatedStages[stageIndex].checklist_items = [];
    }
    updatedStages[stageIndex].checklist_items!.push(newChecklistItem.trim());
    setStages(updatedStages);
    setNewChecklistItem('');
  };

  // Remover item do checklist
  const handleRemoveChecklistItem = (stageIndex: number, itemIndex: number) => {
    const updatedStages = [...stages];
    updatedStages[stageIndex].checklist_items = 
      updatedStages[stageIndex].checklist_items?.filter((_, i) => i !== itemIndex);
    setStages(updatedStages);
  };

  // Step 3: Finalizar e salvar
  const handleFinalSubmit = async () => {
    if (!basicData) return;
    
    setIsSaving(true);
    try {
      // Preparar dados para saveComplexPipeline
      const complexData = {
        ...basicData,
        stages: stages.map(stage => ({
          nome: stage.nome,
          prazo_em_dias: stage.prazo_em_dias,
          ordem: stage.ordem,
          checklist_items: (stage.checklist_items || []).map((item, idx) => ({
            titulo: item,
            obrigatorio: false,
            ordem: idx + 1,
          })),
        })),
      };
      
      await onSave(complexData);
    } catch (error) {
      logger.error('Erro ao criar pipeline', error as Error, { feature: 'pipeline-wizard' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
          </div>
          <span className="text-sm font-medium">Dados Básicos</span>
        </div>
        
        <Separator className="flex-1 mx-4" />
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
          </div>
          <span className="text-sm font-medium">Etapas</span>
        </div>
        
        <Separator className="flex-1 mx-4" />
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="text-sm font-medium">Confirmação</span>
        </div>
      </div>

      <Separator />

      {/* Step 1: Dados Básicos */}
      {currentStep === 1 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBasicDataSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Pipeline <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Vendas Consultoria..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o propósito..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Qual é o objetivo..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_pipeline"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">Pipeline Primário</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">Pipeline Ativo</FormLabel>
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
                          placeholder="Ex: Pequenas empresas de tecnologia..."
                          {...field}
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
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Liste os responsáveis (separados por vírgula)
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
                          placeholder="Ex: vendas, consultoria..."
                          value={arrayToString(field.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Tags para organizar (separadas por vírgula)
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
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          Pipeline Padrão para Novos Leads
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Novos leads serão automaticamente atribuídos
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Step 2: Etapas */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Adicionar Etapas ao Pipeline</h3>
            <Badge variant="secondary">{stages.length} etapa(s)</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Adicione as etapas do seu pipeline. Você pode pular esta etapa e configurar depois.
          </p>

          {/* Formulário de nova etapa */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  placeholder="Nome da etapa..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStage();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="Dias"
                  value={newStagePrazo}
                  onChange={(e) => setNewStagePrazo(Number(e.target.value))}
                />
                <Button type="button" onClick={handleAddStage} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de etapas adicionadas */}
          {stages.length > 0 && (
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{stage.nome}</h4>
                      <p className="text-xs text-muted-foreground">
                        Prazo: {stage.prazo_em_dias} dias | Ordem: {stage.ordem}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStageIndex(editingStageIndex === index ? null : index)}
                      >
                        {editingStageIndex === index ? 'Fechar' : 'Checklist'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStage(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Checklist inline */}
                  {editingStageIndex === index && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium">Itens do Checklist (opcional)</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Novo item do checklist..."
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistItem(index);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddChecklistItem(index)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {stage.checklist_items && stage.checklist_items.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {stage.checklist_items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                              <span>{item}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveChecklistItem(index, itemIdx)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                Pular Etapas
              </Button>
              <Button type="button" onClick={() => setCurrentStep(3)} disabled={stages.length === 0}>
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmação */}
      {currentStep === 3 && basicData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Confirmar Criação do Pipeline</h3>
          
          {/* Preview dos dados */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div>
              <p className="text-sm font-semibold">Nome:</p>
              <p className="text-sm">{basicData.nome}</p>
            </div>
            
            {basicData.descricao && (
              <div>
                <p className="text-sm font-semibold">Descrição:</p>
                <p className="text-sm">{basicData.descricao}</p>
              </div>
            )}
            
            <div className="flex gap-4">
              {basicData.primary_pipeline && <Badge>Pipeline Primário</Badge>}
              {basicData.ativo && <Badge variant="secondary">Ativo</Badge>}
            </div>

            {stages.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Etapas ({stages.length}):</p>
                <div className="space-y-1">
                  {stages.map((stage, idx) => (
                    <div key={idx} className="text-sm pl-4">
                      • {stage.nome} ({stage.prazo_em_dias} dias)
                      {stage.checklist_items && stage.checklist_items.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          - {stage.checklist_items.length} item(s) no checklist
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <Button onClick={handleFinalSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Pipeline...
                </>
              ) : (
                'Criar Pipeline Completo'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
