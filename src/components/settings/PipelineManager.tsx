import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings as SettingsIcon, Star, ChevronRight } from 'lucide-react';
import { AdvancedPipelineForm } from '@/components/forms/AdvancedPipelineForm';
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
  user_id?: string;
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
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageData | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [selectedStageForChecklist, setSelectedStageForChecklist] = useState<{ id: string; nome: string } | null>(null);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  
  const { pipelines, loading, savePipeline, deletePipeline } = useSupabasePipelines();
  const { stages, saveStage, deleteStage, refetch: refetchStages } = useSupabasePipelineStages();
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

  const getPipelineStages = (pipelineId: string) => {
    return stages.filter(stage => stage.pipeline_id === pipelineId);
  };

  const getStageChecklistCount = (stageId: string) => {
    return checklistItems.filter(item => item.stage_id === stageId).length;
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
                    <TableRow key={stage.id}>
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
                          onClick={() => setSelectedStageForChecklist({ id: stage.id, nome: stage.nome })}
                        >
                          <Badge variant="secondary" className="mr-1">
                            {getStageChecklistCount(stage.id)}
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
                                const success = await deleteStage(stage.id);
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
        
        <Sheet open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => setSelectedPipeline(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pipeline
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[95vw] max-w-7xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {selectedPipeline ? 'Editar Pipeline' : 'Novo Pipeline'}
              </SheetTitle>
            </SheetHeader>
            <AdvancedPipelineForm
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
          </SheetContent>
        </Sheet>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStage?.id ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
          </DialogHeader>
          <StageForm
            stage={selectedStage}
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
    </div>
  );
}