import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, X, GripVertical, Eye, Save, SaveIcon, ChevronLeft, ChevronRight, AlertTriangle, Clock, Minimize2, BarChart3, Target } from 'lucide-react';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabasePipelineAnalytics } from '@/hooks/useSupabasePipelineAnalytics';
import { useToast } from '@/hooks/use-toast';
import { CommunicationTemplatesManager } from '@/components/templates/CommunicationTemplatesManager';
import { EmbeddedPipelineAnalytics } from '@/components/analytics/EmbeddedPipelineAnalytics';
import { AdvancedCriteriaManager } from '@/components/criteria/AdvancedCriteriaManager';

// Validation schemas
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

const pipelineSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  segmento_alvo: z.string().optional(),
  stages: z.array(stageSchema).min(1, 'Adicione pelo menos uma etapa'),
});

// Data types
type ChecklistItemData = z.infer<typeof checklistItemSchema>;
type StageData = z.infer<typeof stageSchema>;
type PipelineFormData = z.infer<typeof pipelineSchema>;

interface ImprovedPipelineFormProps {
  pipeline?: Partial<PipelineFormData>;
  onSave?: (data: PipelineFormData) => void;
  onCancel?: () => void;
  onSaveAndContinue?: (data: PipelineFormData) => void;
}

// Sortable Checklist Item Component
const SortableChecklistItem: React.FC<{
  item: ChecklistItemData;
  index: number;
  onUpdate: (updates: Partial<ChecklistItemData>) => void;
  onDelete: () => void;
}> = ({ item, index, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `checklist-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border group hover:shadow-sm transition-all"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Input
        value={item.titulo}
        onChange={(e) => onUpdate({ titulo: e.target.value })}
        placeholder="Item do checklist"
        className="flex-1 h-9 bg-background"
        onKeyDown={(e) => e.stopPropagation()}
      />
      
      <Checkbox
        checked={item.obrigatorio}
        onCheckedChange={(checked) => onUpdate({ obrigatorio: !!checked })}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />
      <label className="text-xs text-muted-foreground min-w-[60px]">
        Obrigatório
      </label>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Sortable Stage Component
const SortableStage: React.FC<{
  stage: StageData;
  index: number;
  onUpdate: (updates: Partial<StageData>) => void;
  onDelete: () => void;
  onAddChecklistItem: () => void;
  onUpdateChecklistItem: (itemIndex: number, updates: Partial<ChecklistItemData>) => void;
  onDeleteChecklistItem: (itemIndex: number) => void;
  onReorderChecklistItems: (oldIndex: number, newIndex: number) => void;
}> = ({ 
  stage, 
  index, 
  onUpdate, 
  onDelete, 
  onAddChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
  onReorderChecklistItems
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `stage-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = stage.checklist_items.findIndex((_, idx) => `checklist-${idx}` === active.id);
      const newIndex = stage.checklist_items.findIndex((_, idx) => `checklist-${idx}` === over?.id);
      onReorderChecklistItems(oldIndex, newIndex);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-6 space-y-6 shadow-sm hover:shadow-md transition-all"
    >
      {/* Stage Header */}
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-2"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {stage.ordem}
              </span>
              <FormField
                name={`stages.${index}.nome`}
                render={() => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        value={stage.nome}
                        onChange={(e) => onUpdate({ nome: e.target.value })}
                        placeholder="Ex: Qualificação"
                        className={`h-10 ${!stage.nome ? 'border-destructive bg-destructive/5' : 'border-success bg-success/5'}`}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stage Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name={`stages.${index}.prazo_em_dias`}
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Prazo (dias)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={stage.prazo_em_dias}
                      onChange={(e) => onUpdate({ prazo_em_dias: parseInt(e.target.value) || 1 })}
                      placeholder="7"
                      className="h-10"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name={`stages.${index}.proximo_passo_tipo`}
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Próximo Passo</FormLabel>
                  <FormControl>
                    <Select
                      value={stage.proximo_passo_tipo}
                      onValueChange={(value: any) => onUpdate({ proximo_passo_tipo: value })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Humano">Humano</SelectItem>
                        <SelectItem value="Agendamento">Agendamento</SelectItem>
                        <SelectItem value="Mensagem">Mensagem</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            name={`stages.${index}.proximo_passo_label`}
            render={() => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Descrição do Próximo Passo</FormLabel>
                <FormControl>
                  <Input
                    value={stage.proximo_passo_label || ''}
                    onChange={(e) => onUpdate({ proximo_passo_label: e.target.value })}
                    placeholder="Ex: Ligar para o lead"
                    className="h-10"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={stage.gerar_agendamento_auto}
                onCheckedChange={(checked) => onUpdate({ gerar_agendamento_auto: !!checked })}
              />
              <label className="text-sm font-medium">Gerar agendamento automático</label>
            </div>

            {stage.gerar_agendamento_auto && (
              <FormField
                name={`stages.${index}.duracao_minutos`}
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={stage.duracao_minutos || ''}
                        onChange={(e) => onUpdate({ duracao_minutos: parseInt(e.target.value) || undefined })}
                        placeholder="60"
                        className="h-10"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              name={`stages.${index}.wip_limit`}
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Limite WIP (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={stage.wip_limit || ''}
                      onChange={(e) => onUpdate({ wip_limit: parseInt(e.target.value) || undefined })}
                      placeholder="5"
                      className="h-10"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Entry/Exit Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name={`stages.${index}.entrada_criteria`}
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Critérios de Entrada</FormLabel>
                  <FormControl>
                    <Textarea
                      value={stage.entrada_criteria || ''}
                      onChange={(e) => onUpdate({ entrada_criteria: e.target.value })}
                      placeholder="Quando o lead pode entrar nesta etapa?"
                      className="h-24 resize-none"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name={`stages.${index}.saida_criteria`}
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Critérios de Saída</FormLabel>
                  <FormControl>
                    <Textarea
                      value={stage.saida_criteria || ''}
                      onChange={(e) => onUpdate({ saida_criteria: e.target.value })}
                      placeholder="Quando o lead pode sair desta etapa?"
                      className="h-24 resize-none"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Checklist da Etapa</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddChecklistItem}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Item
              </Button>
            </div>

            {stage.checklist_items.length > 0 && (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={stage.checklist_items.map((_, idx) => `checklist-${idx}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {stage.checklist_items.map((item, itemIndex) => (
                      <SortableChecklistItem
                        key={itemIndex}
                        item={item}
                        index={itemIndex}
                        onUpdate={(updates) => onUpdateChecklistItem(itemIndex, updates)}
                        onDelete={() => onDeleteChecklistItem(itemIndex)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Form Component
export function ImprovedPipelineForm({ 
  pipeline, 
  onSave, 
  onCancel, 
  onSaveAndContinue 
}: ImprovedPipelineFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const { saveComplexPipeline } = useSupabasePipelines();

  // Wizard steps
  const wizardSteps = [
    { id: 'general', title: 'Geral', description: 'Informações básicas' },
    { id: 'stages', title: 'Etapas', description: 'Configurar etapas' },
    { id: 'templates', title: 'Templates', description: 'Comunicação' },
    { id: 'analytics', title: 'Analytics', description: 'Critérios avançados' },
    { id: 'preview', title: 'Preview', description: 'Revisar pipeline' },
  ];

  const currentStepIndex = wizardSteps.findIndex(step => step.id === activeTab);

  // Form setup
  const form = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      nome: pipeline?.nome || '',
      descricao: pipeline?.descricao || '',
      ativo: pipeline?.ativo ?? true,
      segmento_alvo: pipeline?.segmento_alvo || '',
      stages: pipeline?.stages || [],
      ...pipeline,
    },
  });

  const watchedFormData = form.watch();
  const watchedStages = form.watch('stages');

  // Validation
  const validateCurrentStep = () => {
    const currentValues = form.getValues();
    
    switch (activeTab) {
      case 'general':
        return !!currentValues.nome?.trim();
      case 'stages':
        return currentValues.stages && currentValues.stages.length > 0 &&
               currentValues.stages.every(stage => stage.nome?.trim());
      default:
        return true;
    }
  };

  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    const values = watchedFormData;
    
    if (!values.nome?.trim()) errors.push('Nome é obrigatório');
    if (!values.stages || values.stages.length === 0) errors.push('Adicione pelo menos uma etapa');
    values.stages?.forEach((stage, index) => {
      if (!stage.nome?.trim()) errors.push(`Etapa ${index + 1} precisa de um nome`);
    });
    
    return errors;
  }, [watchedFormData]);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (hasChanges && watchedFormData.nome) {
        localStorage.setItem('pipeline-draft', JSON.stringify(watchedFormData));
        setLastAutoSave(new Date());
        setHasChanges(false);
        
        toast({
          title: "Rascunho salvo",
          description: "Suas alterações foram salvas automaticamente",
          duration: 2000,
        });
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [hasChanges, watchedFormData, toast]);

  // Watch for changes
  useEffect(() => {
    const subscription = form.watch(() => setHasChanges(true));
    return () => subscription.unsubscribe();
  }, [form]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('pipeline-draft');
    if (draft && !pipeline) {
      try {
        const draftData = JSON.parse(draft);
        form.reset(draftData);
        toast({
          title: "Rascunho recuperado",
          description: "Suas alterações anteriores foram restauradas",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [form, pipeline, toast]);

  // Navigation functions
  const navigateToNextStep = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de continuar",
        variant: "destructive"
      });
      return;
    }
    
    const nextIndex = Math.min(currentStepIndex + 1, wizardSteps.length - 1);
    setActiveTab(wizardSteps[nextIndex].id);
  };

  const navigateToPreviousStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setActiveTab(wizardSteps[prevIndex].id);
  };

  // Stage management functions
  const addStage = useCallback(() => {
    const currentStages = form.getValues('stages');
    const newStage: StageData = {
      nome: '',
      ordem: currentStages.length + 1,
      prazo_em_dias: 7,
      proximo_passo_tipo: 'Humano',
      proximo_passo_label: '',
      entrada_criteria: '',
      saida_criteria: '',
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
    
    updatedStages.forEach((stage, idx) => {
      stage.ordem = idx + 1;
    });
    
    form.setValue('stages', updatedStages);
  }, [form]);

  const reorderStages = useCallback((oldIndex: number, newIndex: number) => {
    const currentStages = form.getValues('stages');
    const reorderedStages = arrayMove(currentStages, oldIndex, newIndex);
    
    reorderedStages.forEach((stage, idx) => {
      stage.ordem = idx + 1;
    });
    
    form.setValue('stages', reorderedStages);
  }, [form]);

  // Checklist management functions
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
    
    updatedStages[stageIndex].checklist_items.forEach((item, idx) => {
      item.ordem = idx + 1;
    });
    
    form.setValue('stages', updatedStages);
  }, [form]);

  const handleSave = async (data: PipelineFormData) => {
    if (!validateCurrentStep()) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros antes de salvar",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const result = await saveComplexPipeline(data);
      if (result) {
        localStorage.removeItem('pipeline-draft');
        toast({
          title: "Pipeline salvo!",
          description: "Pipeline criado com sucesso",
        });
        onSave?.(result);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o pipeline",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async (data: PipelineFormData) => {
    await handleSave(data);
    onSaveAndContinue?.(data);
  };

  const handleModalClose = () => {
    if (hasChanges) {
      setShowExitDialog(true);
    } else {
      handleForceClose();
    }
  };

  const handleForceClose = () => {
    localStorage.removeItem('pipeline-draft');
    onCancel?.();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const stages = form.getValues('stages');
      const oldIndex = stages.findIndex((_, idx) => `stage-${idx}` === active.id);
      const newIndex = stages.findIndex((_, idx) => `stage-${idx}` === over?.id);
      reorderStages(oldIndex, newIndex);
    }
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        e.stopPropagation();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (validationErrors.length === 0) {
              form.handleSubmit(handleSave)();
            }
            break;
          case 'Enter':
            e.preventDefault();
            if (currentStepIndex < wizardSteps.length - 1) {
              navigateToNextStep();
            }
            break;
        }
      }

      switch (e.key) {
        case 'ArrowRight':
          if (e.altKey && currentStepIndex < wizardSteps.length - 1) {
            e.preventDefault();
            navigateToNextStep();
          }
          break;
        case 'ArrowLeft':
          if (e.altKey && currentStepIndex > 0) {
            e.preventDefault();
            navigateToPreviousStep();
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleModalClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, validationErrors.length, hasChanges]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {pipeline ? 'Editar Pipeline' : 'Criar Novo Pipeline'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Etapa {currentStepIndex + 1} de {wizardSteps.length} - {wizardSteps[currentStepIndex]?.description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {validationErrors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {validationErrors.length} erro{validationErrors.length !== 1 ? 's' : ''}
              </Badge>
            )}
            
            {lastAutoSave && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SaveIcon className="h-3 w-3" />
                <span>Salvo {lastAutoSave.toLocaleTimeString()}</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleModalClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 border-b">
          <Progress 
            value={((currentStepIndex + 1) / wizardSteps.length) * 100} 
            className="h-2"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Corrija os seguintes erros:
            </div>
            <ul className="text-sm text-destructive/80 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form 
              ref={formRef}
              onSubmit={form.handleSubmit(handleSave)} 
              className="p-6 space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">Geral</TabsTrigger>
                  <TabsTrigger value="stages">Etapas</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                {/* General Information */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Nome do Pipeline *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: Pipeline de Vendas B2B"
                                className={`h-12 ${fieldState.error ? 'border-destructive bg-destructive/5' : 'border-success bg-success/5'}`}
                              />
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
                              <Textarea
                                {...field}
                                placeholder="Descreva o objetivo e processo deste pipeline..."
                                className="h-24 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="segmento_alvo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segmento Alvo</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: PMEs do setor de tecnologia"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-3">
                        <FormField
                          control={form.control}
                          name="ativo"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Pipeline ativo
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Stages Configuration */}
                <TabsContent value="stages" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Configuração de Etapas</h3>
                    <Button 
                      type="button" 
                      onClick={addStage} 
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  {watchedStages.length > 0 ? (
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={watchedStages.map((_, idx) => `stage-${idx}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-6">
                          {watchedStages.map((stage, index) => (
                            <SortableStage
                              key={index}
                              stage={stage}
                              index={index}
                              onUpdate={(updates) => updateStage(index, updates)}
                              onDelete={() => deleteStage(index)}
                              onAddChecklistItem={() => addChecklistItem(index)}
                              onUpdateChecklistItem={(itemIndex, updates) => updateChecklistItem(index, itemIndex, updates)}
                              onDeleteChecklistItem={(itemIndex) => deleteChecklistItem(index, itemIndex)}
                              onReorderChecklistItems={(oldIndex, newIndex) => reorderChecklistItems(index, oldIndex, newIndex)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-muted/20 rounded-full">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="text-lg font-medium mb-2">Nenhuma etapa adicionada</h4>
                            <p className="text-muted-foreground mb-4">
                              Crie etapas para estruturar seu pipeline de vendas
                            </p>
                            <Button 
                              type="button" 
                              onClick={addStage}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Adicionar Primeira Etapa
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Templates & Automation */}
                <TabsContent value="templates" className="space-y-6">
                  <CommunicationTemplatesManager
                    pipelineId={watchedFormData.id}
                    stageName="Pipeline Geral"
                  />
                </TabsContent>

                {/* Analytics & Insights */}
                <TabsContent value="analytics" className="space-y-6">
                  {watchedFormData.id ? (
                    <EmbeddedPipelineAnalytics
                      pipelineId={watchedFormData.id}
                      pipelineName={watchedFormData.nome || 'Pipeline'}
                      showHeader={false}
                    />
                  ) : (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-8 text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium mb-2">Analytics em Tempo Real</h4>
                        <p className="text-muted-foreground mb-6">
                          Após salvar o pipeline, você terá acesso a analytics detalhados com métricas de conversão, 
                          tempo por etapa, gargalos e tendências em tempo real.
                        </p>
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                          <div className="p-4 bg-muted/20 rounded-lg">
                            <Target className="h-6 w-6 mx-auto text-primary mb-2" />
                            <p className="text-sm font-medium">Taxa de Conversão</p>
                            <p className="text-xs text-muted-foreground">Por etapa e geral</p>
                          </div>
                          <div className="p-4 bg-muted/20 rounded-lg">
                            <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                            <p className="text-sm font-medium">Tempo por Etapa</p>
                            <p className="text-xs text-muted-foreground">Identificar gargalos</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Advanced Criteria Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Critérios Avançados de Avanço</h3>
                    {watchedStages.length > 0 ? (
                      <div className="space-y-6">
                        {watchedStages.map((stage, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                  {stage.ordem}
                                </span>
                                {stage.nome || 'Nova Etapa'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {stage.id ? (
                                <AdvancedCriteriaManager
                                  stageId={stage.id}
                                  stageName={stage.nome || 'Nova Etapa'}
                                />
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <p>Salve o pipeline primeiro para configurar critérios avançados.</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-2 border-dashed">
                        <CardContent className="p-8 text-center">
                          <p className="text-muted-foreground">
                            Configure as etapas primeiro na aba "Etapas" para poder definir critérios de avanço.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Preview */}
                <TabsContent value="preview" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Preview do Pipeline</h3>
                    <p className="text-muted-foreground mb-6">
                      Revise as informações do pipeline antes de salvar.
                    </p>
                    
                    {/* Pipeline Info Preview */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-base">Informações Gerais</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Nome:</p>
                          <p className="text-muted-foreground">{watchedFormData.nome || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="font-medium">Segmento:</p>
                          <p className="text-muted-foreground">{watchedFormData.segmento_alvo || 'Não informado'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-medium">Descrição:</p>
                          <p className="text-muted-foreground">{watchedFormData.descricao || 'Não informada'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Stages Preview */}
                    {watchedStages.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {watchedStages.map((stage, index) => (
                          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                  {stage.ordem}
                                </span>
                                {stage.nome || 'Sem nome'}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {stage.prazo_em_dias} dia{stage.prazo_em_dias !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {stage.proximo_passo_tipo}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                              {stage.checklist_items.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  📋 {stage.checklist_items.length} item{stage.checklist_items.length !== 1 ? 's' : ''} no checklist
                                </div>
                              )}
                              {stage.wip_limit && (
                                <div className="text-xs text-muted-foreground">
                                  🎯 Limite WIP: {stage.wip_limit}
                                </div>
                              )}
                              {stage.proximo_passo_label && (
                                <div className="text-xs text-muted-foreground">
                                  📝 {stage.proximo_passo_label}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-2 border-dashed">
                        <CardContent className="p-8 text-center">
                          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Adicione etapas para visualizar o preview do pipeline
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        {/* Footer with Navigation */}
        <div className="flex items-center justify-between p-6 border-t bg-card/50">
          <Button
            type="button"
            variant="outline"
            onClick={navigateToPreviousStep}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 h-10"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleModalClose}
              disabled={saving}
              className="h-10"
            >
              Cancelar
            </Button>
            
            {currentStepIndex === wizardSteps.length - 1 ? (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving || validationErrors.length > 0}
                  className="flex items-center gap-2 h-10 min-w-[140px]"
                  onClick={form.handleSubmit(handleSave)}
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <Save className="h-4 w-4" />
                  Salvar Pipeline
                </Button>
                {onSaveAndContinue && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={form.handleSubmit(handleSaveAndContinue)}
                    disabled={saving || validationErrors.length > 0}
                    className="h-10"
                  >
                    Salvar e Continuar
                  </Button>
                )}
              </div>
            ) : (
              <Button
                type="button"
                onClick={navigateToNextStep}
                disabled={validationErrors.length > 0}
                className="flex items-center gap-2 h-10 min-w-[120px]"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Descartar alterações?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas que serão perdidas se sair agora.
              {lastAutoSave && (
                <span className="block mt-2 text-sm font-medium">
                  Último rascunho salvo: {lastAutoSave.toLocaleTimeString()}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowExitDialog(false);
                handleForceClose();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}