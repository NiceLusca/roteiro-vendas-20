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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, X, GripVertical, Eye, Save, SaveIcon, ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useToast } from '@/hooks/use-toast';
import { memo, useCallback as useCallbackReact } from 'react';
import { AdvancedCriteriaManager } from '@/components/criteria/AdvancedCriteriaManager';

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
  // ID optional for updates
  id: z.string().optional(),
  
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
  
  duplicar_de_pipeline: z.string().optional(),
  
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
        onKeyDown={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
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
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
          <Input
            type="number"
            value={stage.prazo_em_dias}
            onChange={(e) => onUpdate({ prazo_em_dias: parseInt(e.target.value) || 1 })}
            placeholder="Prazo (dias)"
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
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
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
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
              onKeyDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Textarea
            value={stage.entrada_criteria || ''}
            onChange={(e) => onUpdate({ entrada_criteria: e.target.value })}
            placeholder="Critérios de entrada"
            className="h-20"
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
          <Textarea
            value={stage.saida_criteria || ''}
            onChange={(e) => onUpdate({ saida_criteria: e.target.value })}
            placeholder="Critérios de saída"
            className="h-20"
            onKeyDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
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
  const [continueEditing, setContinueEditing] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isClosingPrevented, setIsClosingPrevented] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const { pipelines, saveComplexPipeline, duplicatePipeline } = useSupabasePipelines();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Wizard steps configuration
  const wizardSteps = [
    { id: 'general', label: 'Informações Básicas', icon: '1' },
    { id: 'stages', label: 'Configurar Etapas', icon: '2' },
    { id: 'criteria', label: 'Critérios Avançados', icon: '3' },
    { id: 'advanced', label: 'Opções Avançadas', icon: '4' },
    { id: 'preview', label: 'Revisar & Salvar', icon: '5' }
  ];
  
  const currentStepIndex = wizardSteps.findIndex(step => step.id === activeTab);
  const progressPercentage = ((currentStepIndex + 1) / wizardSteps.length) * 100;

  const form = useForm<AdvancedPipelineFormData>({
    resolver: zodResolver(advancedPipelineSchema),
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
      duplicar_de_pipeline: pipeline?.duplicar_de_pipeline || undefined,
      stages: pipeline?.stages || [],
    },
  });

  const watchedFormData = form.watch();
  const watchedStages = form.watch('stages');

  // Auto-save functionality
  const autoSave = useCallback(async (data: AdvancedPipelineFormData) => {
    if (!data.nome || data.nome.trim() === '') return;
    
    try {
      const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(data));
      setLastAutoSave(new Date());
      
      toast({
        title: "Rascunho salvo",
        description: "Suas alterações foram salvas automaticamente",
        duration: 2000
      });
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  }, [pipeline?.id, toast]);

  // Watch form changes for auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges && watchedFormData.nome) {
        autoSave(watchedFormData);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [watchedFormData, hasUnsavedChanges, autoSave]);

  // Track form changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [watchedFormData]);

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

  // Prevent accidental modal closing
  useEffect(() => {
    const preventClosing = hasUnsavedChanges && form.formState.isDirty;
    setIsClosingPrevented(preventClosing);
    
    // Prevent browser navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (preventClosing) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, form.formState.isDirty]);

  // Keyboard shortcuts management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent global shortcuts when focused on form elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        e.stopPropagation();
        return;
      }

      // Navigate between wizard steps
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

      // Escape key handling with confirmation
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isClosingPrevented) {
          setShowExitDialog(true);
        } else {
          handleModalClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation functions
  const navigateToNextStep = useCallback(() => {
    if (currentStepIndex < wizardSteps.length - 1) {
      const nextStep = wizardSteps[currentStepIndex + 1];
      setActiveTab(nextStep.id);
    }
  }, [currentStepIndex, wizardSteps]);

  const navigateToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevStep = wizardSteps[currentStepIndex - 1];
      setActiveTab(prevStep.id);
    }
  }, [currentStepIndex, wizardSteps]);

  // Validation per step
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

  // Handle modal close with confirmation
  const handleModalClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      onCancel();
    }
  }, [hasUnsavedChanges, onCancel]);

  // Handle exit confirmation
  const handleConfirmExit = useCallback(() => {
    const draftKey = `pipeline-draft-${pipeline?.id || 'new'}`;
    localStorage.removeItem(draftKey);
    onCancel();
  }, [pipeline?.id, onCancel]);

  // Funções para gerenciar etapas
  const addStage = useCallback(() => {
    const currentStages = form.getValues('stages');
    const newOrder = currentStages.length + 1;
    
    const newStage: StageData = {
      nome: 'Nova Etapa',
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
      titulo: 'Novo item',
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
      // Validate required fields
      if (!data.nome || data.nome.trim() === '') {
        toast({
          title: "Erro de validação",
          description: "Nome do pipeline é obrigatório",
          variant: "destructive"
        });
        return;
      }

      // Remove auxiliary field that is not saved to database
      const { duplicar_de_pipeline, ...validData } = data;
      
      const result = await saveComplexPipeline(validData);
      if (result) {
        if (!continueEditing) {
          onCancel(); // Close modal
        } else {
          setContinueEditing(false);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async (data: AdvancedPipelineFormData) => {
    setContinueEditing(true);
    setSaving(true);
    try {
      // Validate required fields
      if (!data.nome || data.nome.trim() === '') {
        toast({
          title: "Erro de validação",
          description: "Nome do pipeline é obrigatório",
          variant: "destructive"
        });
        return;
      }

      // Remove auxiliary field that is not saved to database
      const { duplicar_de_pipeline, ...validData } = data;
      
      const result = await saveComplexPipeline(validData);
      if (result) {
        // Keep form open for editing
        toast({
          title: "Pipeline salvo",
          description: "Continue editando o pipeline..."
        });
      }
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateFrom = async (sourcePipelineId: string) => {
    if (!sourcePipelineId) return;
    
    const currentName = form.getValues('nome');
    const newName = currentName ? `${currentName} (Cópia)` : 'Pipeline Duplicado';
    
    setSaving(true);
    try {
      const result = await duplicatePipeline(sourcePipelineId, newName);
      if (result) {
        // Update form with duplicated data
        const sourcePipeline = pipelines.find(p => p.id === sourcePipelineId);
        if (sourcePipeline) {
          form.reset({
            ...form.getValues(),
            nome: newName,
            descricao: sourcePipeline.descricao,
            objetivo: sourcePipeline.objetivo,
          });
          
          toast({
            title: "Pipeline duplicado",
            description: "Pipeline base foi carregado. Faça as alterações necessárias."
          });
        }
      }
    } catch (error) {
      console.error('Erro ao duplicar pipeline:', error);
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
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {pipeline?.id ? 'Editar Pipeline' : 'Criar Pipeline'}
        </h2>
        <div className="flex items-center gap-4">
          {lastAutoSave && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Salvo {lastAutoSave.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de progresso do wizard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Progresso: Etapa {currentStepIndex + 1} de {wizardSteps.length}</span>
          <span>{Math.round(progressPercentage)}% completo</span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
        
        {/* Steps indicator */}
        <div className="flex items-center justify-between">
          {wizardSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                index === currentStepIndex
                  ? 'text-primary'
                  : index < currentStepIndex
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
              onClick={() => setActiveTab(step.id)}
            >
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStepIndex
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/50 text-muted-foreground/50'
                }`}
              >
                {step.icon}
              </div>
              <span className="hidden sm:block text-xs">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Erros encontrados:</span>
          </div>
          <ul className="mt-2 text-sm text-destructive list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Hidden tabs list - navigation is handled by the progress bar */}
              <TabsList className="sr-only">
                {wizardSteps.map(step => (
                  <TabsTrigger key={step.id} value={step.id}>
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab: Informações Gerais */}
              <TabsContent value="general" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Pipeline *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Ex: Vendas B2B"
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
                    name="objetivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Ex: Converter leads B2B em clientes"
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
                </div>

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
              </TabsContent>

              {/* Tab: Configuração de Etapas */}
              <TabsContent value="stages" className="space-y-6 mt-0">
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

              {/* Tab: Critérios Avançados */}
              <TabsContent value="criteria" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-medium mb-4">Critérios de Avanço por Etapa</h3>
                  <p className="text-muted-foreground mb-6">
                    Configure critérios avançados para controlar quando os leads podem avançar entre as etapas.
                  </p>
                  
                  {watchedStages.length > 0 ? (
                    <div className="space-y-6">
                      {watchedStages.map((stage, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Etapa {stage.ordem}: {stage.nome || 'Nova Etapa'}
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
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">
                          Configure as etapas primeiro na aba "Etapas" para poder definir critérios de avanço.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Configurações Avançadas */}
              <TabsContent value="advanced" className="space-y-6 mt-0">
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
              </TabsContent>

              {/* Tab: Preview Visual */}
              <TabsContent value="preview" className="space-y-6 mt-0">
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
          </form>
        </Form>
      </div>

      {/* Footer com navegação e ações */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          {/* Navegação entre etapas */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={navigateToPreviousStep}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (validateCurrentStep()) {
                  navigateToNextStep();
                }
              }}
              disabled={currentStepIndex === wizardSteps.length - 1}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Ações principais */}
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleModalClose}
              disabled={saving}
            >
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
            
            <Button 
              onClick={form.handleSubmit(handleSave)} 
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar e Fechar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de saída */}
      {showExitDialog && (
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem alterações não salvas. Se sair agora, todas as alterações serão perdidas.
                {lastAutoSave && (
                  <span className="block mt-2 text-sm">
                    Último rascunho salvo: {lastAutoSave.toLocaleTimeString()}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
                Continuar Editando
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sair Sem Salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}