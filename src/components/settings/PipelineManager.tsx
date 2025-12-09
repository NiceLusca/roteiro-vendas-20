import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Settings as SettingsIcon, Star, ChevronRight, Zap, Layers, Copy } from 'lucide-react';
import { SimplePipelineForm } from '@/components/forms/SimplePipelineForm';
import { PipelineWizardForm } from '@/components/forms/PipelineWizardForm';
import { StageForm } from '@/components/forms/StageForm';
import { StageChecklistManager } from '@/components/settings/StageChecklistManager';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useToast } from '@/hooks/use-toast';

interface Pipeline {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  objetivo?: string;
  primary_pipeline: boolean;
  created_at?: string;
  updated_at?: string;
}

interface StageData {
  id?: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  prazo_em_dias: number;
  proximo_passo_tipo: 'Humano' | 'Agendamento' | 'Mensagem' | 'Outro';
  proximo_passo_label?: string;
  entrada_criteria?: string;
  saida_criteria?: string;
  wip_limit?: number;
  gerar_agendamento_auto: boolean;
  duracao_minutos?: number;
}

export function PipelineManager() {
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);
  const [isWizardDialogOpen, setIsWizardDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [pipelineToDuplicate, setPipelineToDuplicate] = useState<Pipeline | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [selectedStage, setSelectedStage] = useState<StageData | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [selectedStageForChecklist, setSelectedStageForChecklist] = useState<{ id: string; nome: string } | null>(null);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  
  const { pipelines, loading, savePipeline, saveComplexPipeline, duplicatePipeline, deletePipeline } = useSupabasePipelines();
  const { stages, saveStage, deleteStage, batchUpdateStages, refetch: refetchStages } = useSupabasePipelineStages();
  const { checklistItems, refetch: refetchChecklistItems } = useSupabaseChecklistItems();
  const { toast } = useToast();

  const handleEditPipeline = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setIsPipelineDialogOpen(true);
  };

  const handleEditStage = (stage: StageData) => {
    setSelectedStage(stage);
    setIsStageDialogOpen(true);
  };

  const handleNewStage = (pipelineId: string) => {
    const pipelineStages = getPipelineStages(pipelineId);
    const nextOrder = pipelineStages.length > 0 ? Math.max(...pipelineStages.map(s => s.ordem)) + 1 : 1;
    
    setSelectedStage({ 
      pipeline_id: pipelineId,
      ordem: nextOrder,
      nome: '',
      prazo_em_dias: 3,
      proximo_passo_tipo: 'Humano',
      gerar_agendamento_auto: false
    } as StageData);
    setIsStageDialogOpen(true);
  };

  const handleDuplicatePipeline = (pipeline: Pipeline) => {
    setPipelineToDuplicate(pipeline);
    setDuplicateName(`${pipeline.nome} (Cópia)`);
    setIsDuplicateDialogOpen(true);
  };

  const confirmDuplicate = async () => {
    if (!pipelineToDuplicate || !duplicateName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome para o pipeline duplicado.",
        variant: "destructive",
      });
      return;
    }

    const success = await duplicatePipeline(pipelineToDuplicate.id, duplicateName.trim());
    if (success) {
      setIsDuplicateDialogOpen(false);
      setPipelineToDuplicate(null);
      setDuplicateName('');
      toast({
        title: "Pipeline duplicado!",
        description: `O pipeline "${duplicateName}" foi criado com sucesso.`,
      });
    }
  };

  const getPipelineStages = (pipelineId: string) => {
    return stages
      .filter(stage => stage.pipeline_id === pipelineId)
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));
  };

  const getStageChecklistCount = (stageId: string) => {
    return checklistItems.filter(item => item.etapa_id === stageId).length;
  };

  const StageRow = ({ stage, pipelineId }: { stage: StageData; pipelineId: string }) => {
    return (
      <TableRow>
        <TableCell className="font-medium">{stage.ordem}</TableCell>
        <TableCell>{stage.nome}</TableCell>
        <TableCell>{stage.prazo_em_dias}</TableCell>
        <TableCell>
          <div>
            <p className="text-sm">{stage.proximo_passo_label}</p>
            <Badge variant="outline" className="text-xs">
              {stage.proximo_passo_tipo}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedStageForChecklist({ id: stage.id!, nome: stage.nome })}
          >
            <Badge variant="secondary" className="mr-1">
              {getStageChecklistCount(stage.id!)}
            </Badge>
            Checklist
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleEditStage(stage)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={async () => {
                if (window.confirm('Tem certeza que deseja excluir esta etapa?')) {
                  const success = await deleteStage(stage.id!);
                  if (success) {
                    refetchStages();
                    refetchChecklistItems();
                  }
                }
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderPipelineCard = (pipeline: Pipeline) => {
    const pipelineStages = getPipelineStages(pipeline.id);
    const isExpanded = expandedPipeline === pipeline.id;

    return (
      <Card key={pipeline.id} className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer flex-1"
              onClick={() => setExpandedPipeline(isExpanded ? null : pipeline.id)}
            >
              <ChevronRight 
                className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{pipeline.nome}</CardTitle>
                   {pipeline.primary_pipeline && (
                     <Badge variant="default">
                       <Star className="w-3 h-3 mr-1" />
                       Primário
                     </Badge>
                   )}
                  <Badge variant={pipeline.ativo ? 'default' : 'secondary'}>
                    {pipeline.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{pipeline.descricao}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pipelineStages.length} etapas configuradas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPipeline(pipeline);
                }}
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicatePipeline(pipeline);
                }}
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewStage(pipeline.id);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Nova Etapa
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPipelineToDelete(pipeline);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Excluir Pipeline</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-3">
                        <p>
                          <strong>Tem certeza que deseja excluir permanentemente o pipeline "{pipeline.nome}"?</strong>
                        </p>
                        <div className="bg-destructive/10 p-3 rounded-md border-l-4 border-destructive">
                          <p className="text-sm font-medium text-destructive">Esta ação é irreversível e irá:</p>
                          <ul className="text-sm text-destructive mt-2 space-y-1">
                            <li>• Excluir todas as etapas do pipeline</li>
                            <li>• Excluir todos os checklists das etapas</li>
                            <li>• Remover configurações de critérios</li>
                          </ul>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Importante:</strong> Se houver leads neste pipeline, você precisará transferi-los 
                          para outro pipeline antes de poder excluir este.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const success = await deletePipeline(pipeline.id);
                        if (success) {
                          setPipelineToDelete(null);
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sim, excluir permanentemente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Etapas do Pipeline</h4>
                <Button 
                  size="sm" 
                  onClick={() => handleNewStage(pipeline.id)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Etapa
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>SLA (dias)</TableHead>
                    <TableHead>Próximo Passo</TableHead>
                    <TableHead>Checklist</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelineStages.map((stage) => (
                    <StageRow
                      key={stage.id}
                      stage={stage}
                      pipelineId={pipeline.id}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pipelines</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie seus pipelines de vendas e suas etapas
          </p>
        </div>
        
        {/* Dropdown Menu para escolher tipo de pipeline */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pipeline
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setIsPipelineDialogOpen(true)}>
              <Zap className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                <span className="font-medium">Pipeline Simples</span>
                <span className="text-xs text-muted-foreground">Configuração rápida básica</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsWizardDialogOpen(true)}>
              <Layers className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                <span className="font-medium">Pipeline Completo</span>
                <span className="text-xs text-muted-foreground">Com etapas e checklists</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialog: Pipeline Simples */}
        <Dialog open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPipeline ? 'Editar Pipeline' : 'Criar Pipeline Simples'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações básicas do pipeline. As etapas e checklists podem ser adicionados depois.
              </DialogDescription>
            </DialogHeader>
            <SimplePipelineForm
              pipeline={selectedPipeline}
              onSave={async (data) => {
                const result = await savePipeline({ ...data, id: selectedPipeline?.id });
                if (result) {
                  setIsPipelineDialogOpen(false);
                  setSelectedPipeline(null);
                }
              }}
              onCancel={() => {
                setIsPipelineDialogOpen(false);
                setSelectedPipeline(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog: Pipeline Wizard */}
        <Dialog open={isWizardDialogOpen} onOpenChange={setIsWizardDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Pipeline Completo</DialogTitle>
              <DialogDescription>
                Configure o pipeline com etapas e checklists em um processo guiado.
              </DialogDescription>
            </DialogHeader>
            <PipelineWizardForm
              onSave={async (data) => {
                const result = await saveComplexPipeline(data);
                if (result) {
                  setIsWizardDialogOpen(false);
                }
              }}
              onCancel={() => setIsWizardDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Cards */}
      <div>
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando pipelines...</p>
        </div>
      ) : pipelines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum pipeline cadastrado ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Clique em "Novo Pipeline" para começar.
          </p>
        </div>
      ) : (
        pipelines.map(renderPipelineCard)
      )}
      </div>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStage?.id ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
          </DialogHeader>
          <StageForm
            stage={selectedStage}
            existingStages={selectedStage?.pipeline_id ? getPipelineStages(selectedStage.pipeline_id).map(s => ({ id: s.id!, ordem: s.ordem })) : []}
            onSave={async (data) => {
              const result = await saveStage({ ...data, id: selectedStage?.id });
              if (result) {
                setIsStageDialogOpen(false);
                setSelectedStage(null);
                refetchStages();
              }
            }}
            onCancel={() => {
              setIsStageDialogOpen(false);
              setSelectedStage(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Checklist Management Dialog */}
      <Dialog 
        open={!!selectedStageForChecklist} 
        onOpenChange={(open) => !open && setSelectedStageForChecklist(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Checklist - {selectedStageForChecklist?.nome}
            </DialogTitle>
          </DialogHeader>
          {selectedStageForChecklist && (
            <StageChecklistManager
              stageId={selectedStageForChecklist.id}
              stageName={selectedStageForChecklist.nome}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Duplicar Pipeline */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar Pipeline</DialogTitle>
            <DialogDescription>
              Crie uma cópia completa do pipeline "{pipelineToDuplicate?.nome}" incluindo todas as etapas e checklists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="duplicate-name" className="text-sm font-medium">
                Nome do novo pipeline
              </label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Digite o nome..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmDuplicate();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDuplicateDialogOpen(false);
                setPipelineToDuplicate(null);
                setDuplicateName('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar Pipeline
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}