import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, GripVertical, Eye, Save, SaveIcon } from 'lucide-react';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useToast } from '@/hooks/use-toast';

// Esquemas de validação expandidos
const checklistItemSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  ordem: z.number().min(1),
  obrigatorio: z.boolean().default(false),
});

const stageSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ordem: z.number().min(1),
  prazo_em_dias: z.number().min(1),
  proximo_passo_label: z.string().optional(),
  proximo_passo_tipo: z.enum(['Humano', 'Agendamento', 'Mensagem', 'Outro']).default('Humano'),
  entrada_criteria: z.string().optional(),
  saida_criteria: z.string().optional(),
  wip_limit: z.number().optional(),
  gerar_agendamento_auto: z.boolean().default(false),
  duracao_minutos: z.number().optional(),
  checklist_items: z.array(checklistItemSchema).default([]),
});

const advancedPipelineSchema = z.object({
  // Informações Gerais
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  objetivo: z.string().optional(),
  primary_pipeline: z.boolean().default(false),
  ativo: z.boolean().default(true),
  
  // Novos metadados
  segmento_alvo: z.enum(['Captação', 'Upsell', 'Pós-Venda', 'Retenção', 'Outro']).optional(),
  responsaveis: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  
  // Configurações Avançadas
  duplicar_de_pipeline: z.string().optional(),
  default_para_novos_leads: z.boolean().default(false),
  
  // Etapas
  stages: z.array(stageSchema).default([]),
});

type AdvancedPipelineFormData = z.infer<typeof advancedPipelineSchema>;
type StageData = z.infer<typeof stageSchema>;
type ChecklistItemData = z.infer<typeof checklistItemSchema>;

interface AdvancedPipelineFormProps {
  pipeline?: Partial<AdvancedPipelineFormData> | null;
  onSave: (data: AdvancedPipelineFormData) => Promise<void>;
  onCancel: () => void;
  onSaveAndContinue?: (data: AdvancedPipelineFormData) => Promise<void>;
}

// Componente para item de checklist ordenável
function SortableChecklistItem({ 
  item, 
  onUpdate, 
  onDelete,
  stageIndex,
  itemIndex 
}: {
  item: ChecklistItemData;
  onUpdate: (updates: Partial<ChecklistItemData>) => void;
  onDelete: () => void;
  stageIndex: number;
  itemIndex: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `${stageIndex}-${itemIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded border"
    >
      <div
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <Input
        value={item.titulo}
        onChange={(e) => onUpdate({ titulo: e.target.value })}
        placeholder="Item do checklist"
        className="flex-1 h-8"
      />
      
      <Checkbox
        checked={item.obrigatorio}
        onCheckedChange={(checked) => onUpdate({ obrigatorio: !!checked })}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente para etapa ordenável
function SortableStage({
  stage,
  stageIndex,
  onUpdate,
  onDelete,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
  onReorderChecklistItems,
}: {
  stage: StageData;
  stageIndex: number;
  onUpdate: (updates: Partial<StageData>) => void;
  onDelete: () => void;
  onAddChecklistItem: () => void;
  onUpdateChecklistItem: (itemIndex: number, updates: Partial<ChecklistItemData>) => void;
  onDeleteChecklistItem: (itemIndex: number) => void;
  onReorderChecklistItems: (oldIndex: number, newIndex: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `stage-${stageIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.toString().split('-')[1]);
      const overIndex = parseInt(over.id.toString().split('-')[1]);
      onReorderChecklistItems(activeIndex, overIndex);
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="cursor-grab text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <CardTitle className="text-base flex-1">
            Etapa {stage.ordem}: {stage.nome || 'Nova Etapa'}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            value={stage.nome}
            onChange={(e) => onUpdate({ nome: e.target.value })}
            placeholder="Nome da etapa"
          />
          <Input
            type="number"
            value={stage.prazo_em_dias}
            onChange={(e) => onUpdate({ prazo_em_dias: parseInt(e.target.value) || 1 })}
            placeholder="Prazo (dias)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            value={stage.proximo_passo_tipo} 
            onValueChange={(value: any) => onUpdate({ proximo_passo_tipo: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Humano">Humano</SelectItem>
              <SelectItem value="Agendamento">Agendamento</SelectItem>
              <SelectItem value="Mensagem">Mensagem</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            value={stage.proximo_passo_label || ''}
            onChange={(e) => onUpdate({ proximo_passo_label: e.target.value })}
            placeholder="Próximo passo"
          />
        </div>

        {stage.proximo_passo_tipo === 'Agendamento' && (
          <div className="flex items-center gap-4">
            <Checkbox
              checked={stage.gerar_agendamento_auto}
              onCheckedChange={(checked) => onUpdate({ gerar_agendamento_auto: !!checked })}
            />
            <span className="text-sm">Gerar agendamento automático</span>
            <Input
              type="number"
              value={stage.duracao_minutos || ''}
              onChange={(e) => onUpdate({ duracao_minutos: parseInt(e.target.value) || undefined })}
              placeholder="Duração (min)"
              className="w-32"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Textarea
            value={stage.entrada_criteria || ''}
            onChange={(e) => onUpdate({ entrada_criteria: e.target.value })}
            placeholder="Critérios de entrada"
            className="h-20"
          />
          <Textarea
            value={stage.saida_criteria || ''}
            onChange={(e) => onUpdate({ saida_criteria: e.target.value })}
            placeholder="Critérios de saída"
            className="h-20"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Checklist Items</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddChecklistItem}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {stage.checklist_items.length > 0 ? (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stage.checklist_items.map((_, idx) => `${stageIndex}-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {stage.checklist_items.map((item, itemIndex) => (
                    <SortableChecklistItem
                      key={`${stageIndex}-${itemIndex}`}
                      item={item}
                      stageIndex={stageIndex}
                      itemIndex={itemIndex}
                      onUpdate={(updates) => onUpdateChecklistItem(itemIndex, updates)}
                      onDelete={() => onDeleteChecklistItem(itemIndex)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-sm text-muted-foreground p-2 text-center">
                Nenhum item no checklist
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdvancedPipelineForm({ 
  pipeline, 
  onSave, 
  onCancel, 
  onSaveAndContinue 
}: AdvancedPipelineFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const { pipelines } = useSupabasePipelines();
  const { toast } = useToast();

  const form = useForm<AdvancedPipelineFormData>({
    resolver: zodResolver(advancedPipelineSchema),
    defaultValues: {
      nome: pipeline?.nome || '',
      descricao: pipeline?.descricao || '',
      objetivo: pipeline?.objetivo || '',
      primary_pipeline: pipeline?.primary_pipeline || false,
      ativo: pipeline?.ativo ?? true,
      segmento_alvo: pipeline?.segmento_alvo || undefined,
      responsaveis: pipeline?.responsaveis || [],
      tags: pipeline?.tags || [],
      duplicar_de_pipeline: pipeline?.duplicar_de_pipeline || undefined,
      default_para_novos_leads: pipeline?.default_para_novos_leads || false,
      stages: pipeline?.stages || [],
    },
  });

  const watchedStages = form.watch('stages');

  // Funções para gerenciar etapas
  const addStage = useCallback(() => {
    const currentStages = form.getValues('stages');
    const newOrder = currentStages.length + 1;
    
    const newStage: StageData = {
      nome: '',
      ordem: newOrder,
      prazo_em_dias: 3,
      proximo_passo_tipo: 'Humano',
      gerar_agendamento_auto: false,
      checklist_items: [],
    };

    form.setValue('stages', [...currentStages, newStage]);
  }, [form]);

  const updateStage = useCallback((stageIndex: number, updates: Partial<StageData>) => {
    const currentStages = form.getValues('stages');
    const updatedStages = [...currentStages];
    updatedStages[stageIndex] = { ...updatedStages[stageIndex], ...updates };
    form.setValue('stages', updatedStages);
  }, [form]);

  const deleteStage = useCallback((stageIndex: number) => {
    const currentStages = form.getValues('stages');
    const updatedStages = currentStages.filter((_, idx) => idx !== stageIndex);
    
    // Reordenar
    updatedStages.forEach((stage, idx) => {
      stage.ordem = idx + 1;
    });
    
    form.setValue('stages', updatedStages);
  }, [form]);

  const reorderStages = useCallback((oldIndex: number, newIndex: number) => {
    const currentStages = form.getValues('stages');
    const reorderedStages = arrayMove(currentStages, oldIndex, newIndex);
    
    // Atualizar ordem
    reorderedStages.forEach((stage, idx) => {
      stage.ordem = idx + 1;
    });
    
    form.setValue('stages', reorderedStages);
  }, [form]);

  // Funções para gerenciar checklist items
  const addChecklistItem = useCallback((stageIndex: number) => {
    const currentStages = form.getValues('stages');
    const updatedStages = [...currentStages];
    const currentItems = updatedStages[stageIndex].checklist_items;
    
    const newItem: ChecklistItemData = {
      titulo: '',
      ordem: currentItems.length + 1,
      obrigatorio: false,
    };

    updatedStages[stageIndex].checklist_items = [...currentItems, newItem];
    form.setValue('stages', updatedStages);
  }, [form]);

  const updateChecklistItem = useCallback((stageIndex: number, itemIndex: number, updates: Partial<ChecklistItemData>) => {
    const currentStages = form.getValues('stages');
    const updatedStages = [...currentStages];
    updatedStages[stageIndex].checklist_items[itemIndex] = {
      ...updatedStages[stageIndex].checklist_items[itemIndex],
      ...updates
    };
    form.setValue('stages', updatedStages);
  }, [form]);

  const deleteChecklistItem = useCallback((stageIndex: number, itemIndex: number) => {
    const currentStages = form.getValues('stages');
    const updatedStages = [...currentStages];
    updatedStages[stageIndex].checklist_items = updatedStages[stageIndex].checklist_items.filter((_, idx) => idx !== itemIndex);
    
    // Reordenar
    updatedStages[stageIndex].checklist_items.forEach((item, idx) => {
      item.ordem = idx + 1;
    });
    
    form.setValue('stages', updatedStages);
  }, [form]);

  const reorderChecklistItems = useCallback((stageIndex: number, oldIndex: number, newIndex: number) => {
    const currentStages = form.getValues('stages');
    const updatedStages = [...currentStages];
    const items = updatedStages[stageIndex].checklist_items;
    
    updatedStages[stageIndex].checklist_items = arrayMove(items, oldIndex, newIndex);
    
    // Atualizar ordem
    updatedStages[stageIndex].checklist_items.forEach((item, idx) => {
      item.ordem = idx + 1;
    });
    
    form.setValue('stages', updatedStages);
  }, [form]);

  const handleSave = async (data: AdvancedPipelineFormData) => {
    setSaving(true);
    try {
      await onSave(data);
      toast({
        title: "Pipeline salvo",
        description: "Pipeline criado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o pipeline",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async (data: AdvancedPipelineFormData) => {
    if (!onSaveAndContinue) return;
    
    setSaving(true);
    try {
      await onSaveAndContinue(data);
      toast({
        title: "Pipeline salvo",
        description: "Pipeline salvo. Continue editando..."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o pipeline",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.toString().replace('stage-', ''));
      const overIndex = parseInt(over.id.toString().replace('stage-', ''));
      reorderStages(activeIndex, overIndex);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Informações</TabsTrigger>
            <TabsTrigger value="stages">Etapas</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Tab: Informações Gerais */}
          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Pipeline *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Vendas B2B" />
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
                      <Textarea {...field} placeholder="Descreva o propósito deste pipeline" />
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
                      <Input {...field} placeholder="Ex: Converter leads B2B em clientes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Metadados</h3>
              
              <FormField
                control={form.control}
                name="segmento_alvo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento Alvo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o segmento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Captação">Captação</SelectItem>
                        <SelectItem value="Upsell">Upsell</SelectItem>
                        <SelectItem value="Pós-Venda">Pós-Venda</SelectItem>
                        <SelectItem value="Retenção">Retenção</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-6">
                <FormField
                  control={form.control}
                  name="primary_pipeline"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Pipeline Primário</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Define como pipeline principal
                        </p>
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
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Pipeline disponível para uso
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Configuração de Etapas */}
          <TabsContent value="stages" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Configuração de Etapas</h3>
              <Button type="button" onClick={addStage} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-4">
              {watchedStages.length > 0 ? (
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleStageDragEnd}
                >
                  <SortableContext
                    items={watchedStages.map((_, idx) => `stage-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {watchedStages.map((stage, stageIndex) => (
                      <SortableStage
                        key={`stage-${stageIndex}`}
                        stage={stage}
                        stageIndex={stageIndex}
                        onUpdate={(updates) => updateStage(stageIndex, updates)}
                        onDelete={() => deleteStage(stageIndex)}
                        onAddChecklistItem={() => addChecklistItem(stageIndex)}
                        onUpdateChecklistItem={(itemIndex, updates) => 
                          updateChecklistItem(stageIndex, itemIndex, updates)
                        }
                        onDeleteChecklistItem={(itemIndex) => 
                          deleteChecklistItem(stageIndex, itemIndex)
                        }
                        onReorderChecklistItems={(oldIndex, newIndex) => 
                          reorderChecklistItems(stageIndex, oldIndex, newIndex)
                        }
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Nenhuma etapa configurada. Adicione etapas para definir o fluxo do pipeline.
                    </p>
                    <Button type="button" onClick={addStage}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Etapa
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Configurações Avançadas */}
          <TabsContent value="advanced" className="space-y-6">
            <FormField
              control={form.control}
              name="duplicar_de_pipeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duplicar de Pipeline Existente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pipeline para duplicar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.nome}
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
                    <FormLabel>Default para Novos Leads</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Novos leads serão automaticamente inscritos neste pipeline
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Tab: Preview Visual */}
          <TabsContent value="preview" className="space-y-6">
            <h3 className="text-lg font-medium">Preview do Pipeline</h3>
            
            {watchedStages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {watchedStages.map((stage, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {stage.ordem}. {stage.nome || 'Sem nome'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {stage.prazo_em_dias} dias
                        </Badge>
                        <Badge variant="outline">
                          {stage.proximo_passo_tipo}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {stage.checklist_items.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {stage.checklist_items.length} item(s) no checklist
                        </div>
                      )}
                      {stage.wip_limit && (
                        <div className="text-xs text-muted-foreground">
                          Limite WIP: {stage.wip_limit}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Adicione etapas para visualizar o preview do pipeline
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          
          {onSaveAndContinue && (
            <Button 
              type="button" 
              variant="secondary"
              onClick={form.handleSubmit(handleSaveAndContinue)}
              disabled={saving}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Salvar e Continuar
            </Button>
          )}
          
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar e Fechar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}