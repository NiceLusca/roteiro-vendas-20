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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, X, GripVertical, Eye, Save, SaveIcon, ChevronLeft, ChevronRight, AlertTriangle, Clock, Minimize2 } from 'lucide-react';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useToast } from '@/hooks/use-toast';
import { CommunicationTemplatesManager } from '@/components/templates/CommunicationTemplatesManager';
import { EmbeddedPipelineAnalytics } from '@/components/analytics/EmbeddedPipelineAnalytics';

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
  objetivo: z.string().optional(),
  primary_pipeline: z.boolean().default(false),
  ativo: z.boolean().default(true),
  segmento_alvo: z.enum(['Captação', 'Upsell', 'Pós-Venda', 'Retenção', 'Outro']).optional(),
  responsaveis: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  stages: z.array(stageSchema).default([]),
});

type PipelineFormData = z.infer<typeof pipelineSchema>;
type StageData = z.infer<typeof stageSchema>;
type ChecklistItemData = z.infer<typeof checklistItemSchema>;

interface ImprovedPipelineFormProps {
  pipeline?: Partial<PipelineFormData> | null;
  onSave: (data: PipelineFormData) => Promise<void>;
  onCancel: () => void;
  onSaveAndContinue?: (data: PipelineFormData) => Promise<void>;
}

// Sortable Checklist Item Component
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
      className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
    >
      <div
        className="cursor-grab text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <Input
        value={item.titulo}
        onChange={(e) => onUpdate({ titulo: e.target.value })}
        placeholder="Item do checklist"
        className="flex-1 h-9 bg-background"
        onKeyDown={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
      />
      
      <div className="flex items-center gap-2">
        <Checkbox
          checked={item.obrigatorio}
          onCheckedChange={(checked) => onUpdate({ obrigatorio: !!checked })}
        />
        <span className="text-xs text-muted-foreground">Obrigatório</span>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Sortable Stage Component
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
    <Card ref={setNodeRef} style={style} className="mb-4 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-3 bg-muted/20">
        <div className="flex items-center gap-3">
          <div
            className="cursor-grab text-muted-foreground hover:text-primary transition-colors p-1 rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg flex-1 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              {stage.ordem}
            </span>
            {stage.nome || 'Nova Etapa'}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic stage info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name={`stages.${stageIndex}.nome`}
            render={() => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Nome da Etapa
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    value={stage.nome}
                    onChange={(e) => onUpdate({ nome: e.target.value })}
                    placeholder="Ex: Qualificação"
                    className={`h-10 ${!stage.nome ? 'border-destructive bg-destructive/5' : 'border-success bg-success/5'}`}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            name={`stages.${stageIndex}.prazo_em_dias`}
            render={() => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Prazo (dias)
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    value={stage.prazo_em_dias}
                    onChange={(e) => onUpdate({ prazo_em_dias: parseInt(e.target.value) || 1 })}
                    placeholder="7"
                    className="h-10"
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name={`stages.${stageIndex}.proximo_passo_tipo`}
            render={() => (
              <FormItem>
                <FormLabel>Tipo do Próximo Passo</FormLabel>
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
              </FormItem>
            )}
          />
          
          <FormField
            name={`stages.${stageIndex}.proximo_passo_label`}
            render={() => (
              <FormItem>
                <FormLabel>Descrição do Próximo Passo</FormLabel>
                <FormControl>
                  <Input
                    value={stage.proximo_passo_label || ''}
                    onChange={(e) => onUpdate({ proximo_passo_label: e.target.value })}
                    placeholder="Ex: Ligar para o lead"
                    className="h-10"
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Auto appointment generation */}
        {stage.proximo_passo_tipo === 'Agendamento' && (
          <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
            <div className="flex items-center gap-4 mb-3">
              <Checkbox
                checked={stage.gerar_agendamento_auto}
                onCheckedChange={(checked) => onUpdate({ gerar_agendamento_auto: !!checked })}
              />
              <span className="text-sm font-medium">Gerar agendamento automático</span>
            </div>
            
            {stage.gerar_agendamento_auto && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name={`stages.${stageIndex}.duracao_minutos`}
                  render={() => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
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
                          onFocus={(e) => e.stopPropagation()}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  name={`stages.${stageIndex}.wip_limit`}
                  render={() => (
                    <FormItem>
                      <FormLabel>Limite WIP (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          value={stage.wip_limit || ''}
                          onChange={(e) => onUpdate({ wip_limit: parseInt(e.target.value) || undefined })}
                          placeholder="5"
                          className="h-10"
                          onKeyDown={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name={`stages.${stageIndex}.entrada_criteria`}
            render={() => (
              <FormItem>
                <FormLabel>Critérios de Entrada</FormLabel>
                <FormControl>
                  <Textarea
                    value={stage.entrada_criteria || ''}
                    onChange={(e) => onUpdate({ entrada_criteria: e.target.value })}
                    placeholder="Quando o lead pode entrar nesta etapa?"
                    className="h-24 resize-none"
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            name={`stages.${stageIndex}.saida_criteria`}
            render={() => (
              <FormItem>
                <FormLabel>Critérios de Saída</FormLabel>
                <FormControl>
                  <Textarea
                    value={stage.saida_criteria || ''}
                    onChange={(e) => onUpdate({ saida_criteria: e.target.value })}
                    placeholder="Quando o lead pode sair desta etapa?"
                    className="h-24 resize-none"
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Checklist da Etapa</h4>
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
          
          <div className="space-y-3">
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
              <div className="text-center py-6 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                <p className="text-sm">Nenhum item no checklist</p>
                <p className="text-xs mt-1">Adicione itens para controlar o progresso nesta etapa</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ImprovedPipelineForm({ 
  pipeline, 
  onSave, 
  onCancel, 
  onSaveAndContinue 
}: ImprovedPipelineFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const { pipelines, saveComplexPipeline } = useSupabasePipelines();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Wizard steps
  const wizardSteps = [
    { id: 'general', label: 'Informações Básicas', icon: '1' },
    { id: 'stages', label: 'Configurar Etapas', icon: '2' },
    { id: 'templates', label: 'Templates & Automação', icon: '3' },
    { id: 'analytics', label: 'Analytics & Insights', icon: '4' },
    { id: 'criteria', label: 'Critérios Avançados', icon: '5' },
    { id: 'preview', label: 'Revisar & Salvar', icon: '6' }
  ];
  
  const currentStepIndex = wizardSteps.findIndex(step => step.id === activeTab);
  const progressPercentage = ((currentStepIndex + 1) / wizardSteps.length) * 100;

  const form = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      id: pipeline?.id,
      nome: pipeline?.nome || '',
      descricao: pipeline?.descricao || '',
      objetivo: pipeline?.objetivo || '',
      primary_pipeline: pipeline?.primary_pipeline || false,
      ativo: pipeline?.ativo ?? true,
      segmento_alvo: pipeline?.segmento_alvo || undefined,
      responsaveis: pipeline?.responsaveis || [],
      tags: pipeline?.tags || [],
      stages: pipeline?.stages || [],
    },
  });

  const watchedFormData = form.watch();
  const watchedStages = form.watch('stages');

  // Auto-save functionality
  const autoSave = useCallback(async (data: PipelineFormData) => {
    if (!data.nome || data.nome.trim() === '') return;
    
    try {
      const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(data));
      setLastAutoSave(new Date());
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  }, [pipeline?.id]);

  // Auto-save on form changes
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges && watchedFormData.nome) {
        autoSave(watchedFormData);
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [watchedFormData, hasUnsavedChanges, autoSave]);

  // Track form changes
  useEffect(() => {
    setHasUnsavedChanges(form.formState.isDirty);
  }, [watchedFormData, form.formState.isDirty]);

  // Load draft on mount
  useEffect(() => {
    const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft && !pipeline) {
      try {
        const draftData = JSON.parse(savedDraft);
        form.reset(draftData);
        
        toast({
          title: "Rascunho recuperado",
          description: "Um rascunho anterior foi encontrado e restaurado",
        });
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
      }
    }
  }, [form, pipeline, toast]);

  // Prevent accidental closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
          case 'ArrowLeft':
            e.preventDefault();
            navigateToPreviousStep();
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateToNextStep();
            break;
          case 's':
            e.preventDefault();
            form.handleSubmit(handleSave)();
            break;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleModalClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Step validation
  const validateCurrentStep = useCallback(() => {
    const errors: string[] = [];
    
    switch (activeTab) {
      case 'general':
        const nome = form.getValues('nome');
        if (!nome || nome.trim() === '') {
          errors.push('Nome do pipeline é obrigatório');
        }
        break;
      case 'stages':
        const stages = form.getValues('stages');
        if (stages.length === 0) {
          errors.push('Pelo menos uma etapa é obrigatória');
        }
        stages.forEach((stage, index) => {
          if (!stage.nome || stage.nome.trim() === '') {
            errors.push(`Nome da etapa ${index + 1} é obrigatório`);
          }
          if (!stage.prazo_em_dias || stage.prazo_em_dias < 1) {
            errors.push(`Prazo da etapa ${index + 1} deve ser pelo menos 1 dia`);
          }
        });
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [activeTab, form]);

  // Navigation functions with validation
  const navigateToNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Complete os campos necessários antes de continuar',
        variant: 'destructive'
      });
      return;
    }
    
    if (currentStepIndex < wizardSteps.length - 1) {
      setActiveTab(wizardSteps[currentStepIndex + 1].id);
    }
  }, [currentStepIndex, wizardSteps, validateCurrentStep, toast]);

  const navigateToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setActiveTab(wizardSteps[currentStepIndex - 1].id);
    }
  }, [currentStepIndex, wizardSteps]);

  const handleModalClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
      localStorage.removeItem(draftKey);
      onCancel();
    }
  }, [hasUnsavedChanges, pipeline?.id, onCancel]);

  const handleForceClose = useCallback(() => {
    const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
    localStorage.removeItem(draftKey);
    setHasUnsavedChanges(false);
    onCancel();
  }, [pipeline?.id, onCancel]);

  // Stage management functions
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
        const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
        localStorage.removeItem(draftKey);
        toast({
          title: "Pipeline salvo",
          description: "Pipeline foi criado com sucesso"
        });
        onCancel();
      }
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o pipeline. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async (data: PipelineFormData) => {
    setSaving(true);
    try {
      const result = await saveComplexPipeline(data);
      if (result && onSaveAndContinue) {
        await onSaveAndContinue(data);
      }
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
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
    <div className="flex h-full max-h-[92vh] bg-background">
      {/* Sidebar Preview */}
      {showSidebar && (
        <div className="w-80 border-r bg-muted/5 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Preview do Pipeline</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Auto-save status */}
            {lastAutoSave && (
              <div className="flex items-center gap-2 text-xs text-success bg-success/10 px-2 py-1 rounded">
                <SaveIcon className="h-3 w-3" />
                Salvo: {lastAutoSave.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Pipeline Summary */}
            <div className="p-3 bg-card rounded-lg border">
              <p className="font-medium text-sm truncate">
                {watchedFormData.nome || 'Nome do Pipeline'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {watchedFormData.descricao || 'Sem descrição'}
              </p>
              {watchedFormData.segmento_alvo && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {watchedFormData.segmento_alvo}
                </Badge>
              )}
            </div>
            
            {/* Stages Preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Etapas ({watchedStages.length})
              </p>
              {watchedStages.map((stage, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-card rounded text-xs">
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                    {stage.ordem}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{stage.nome || 'Nova Etapa'}</p>
                    <p className="text-muted-foreground">{stage.prazo_em_dias} dias</p>
                  </div>
                  {stage.checklist_items.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1">
                      {stage.checklist_items.length}
                    </Badge>
                  )}
                </div>
              ))}
              
              {watchedStages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Adicione etapas para ver o preview
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                  className="h-8"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {pipeline?.id ? 'Editar Pipeline' : 'Criar Novo Pipeline'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Etapa {currentStepIndex + 1} de {wizardSteps.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Não salvo
                </Badge>
              )}
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {validationErrors.length} erro{validationErrors.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between">
              {wizardSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 cursor-pointer transition-all ${
                    activeTab === step.id ? 'text-primary' : 
                    index < currentStepIndex ? 'text-success' : 'text-muted-foreground'
                  }`}
                  onClick={() => setActiveTab(step.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                    activeTab === step.id ? 'bg-primary text-primary-foreground border-primary shadow-md' :
                    index < currentStepIndex ? 'bg-success text-success-foreground border-success' :
                    'border-muted-foreground hover:border-primary'
                  }`}>
                    {step.icon}
                  </div>
                  <span className="text-sm font-medium hidden lg:block">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Campos obrigatórios:</span>
              </div>
              <ul className="mt-2 text-sm text-destructive list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form 
              ref={formRef}
              onSubmit={form.handleSubmit(handleSave)} 
              className="p-6 space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                            <FormLabel className="flex items-center gap-1">
                              Nome do Pipeline
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: Vendas Consultoria"
                                className={`h-11 transition-all ${
                                  fieldState.error ? 'border-destructive bg-destructive/5' : 
                                  field.value ? 'border-success bg-success/5' : ''
                                }`}
                                onKeyDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
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
                                placeholder="Descreva o propósito deste pipeline"
                                className="h-24 resize-none"
                                onKeyDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="objetivo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objetivo</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ex: Converter leads B2B"
                                  className="h-11"
                                  onKeyDown={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
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
                      </div>

                      <div className="flex items-center space-x-8">
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
                      <Card className="border-2 border-dashed">
                        <CardContent className="p-12 text-center">
                          <div className="max-w-md mx-auto">
                            <h4 className="text-lg font-medium mb-2">Nenhuma etapa configurada</h4>
                            <p className="text-muted-foreground mb-6">
                              Adicione etapas para definir o fluxo do seu pipeline. Cada etapa representa um momento específico da jornada do lead.
                            </p>
                            <Button type="button" onClick={addStage} size="lg">
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Primeira Etapa
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
                            <Clock className="h-6 w-6 mx-auto text-secondary mb-2" />
                            <p className="text-sm font-medium">Tempo Médio</p>
                            <p className="text-xs text-muted-foreground">Ciclo completo</p>
                          </div>
                          <div className="p-4 bg-muted/20 rounded-lg">
                            <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
                            <p className="text-sm font-medium">Tendências</p>
                            <p className="text-xs text-muted-foreground">Evolução mensal</p>
                          </div>
                          <div className="p-4 bg-muted/20 rounded-lg">
                            <AlertTriangle className="h-6 w-6 mx-auto text-warning mb-2" />
                            <p className="text-sm font-medium">Gargalos</p>
                            <p className="text-xs text-muted-foreground">Identificação automática</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Critérios de Avanço por Etapa</h3>
                    <p className="text-muted-foreground mb-6">
                      Configure critérios avançados para controlar quando os leads podem avançar entre as etapas.
                    </p>
                    
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