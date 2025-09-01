import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings as SettingsIcon, Star, ChevronRight } from 'lucide-react';
import { PipelineStage } from '@/types/crm';
import { PipelineForm } from '@/components/forms/PipelineForm';
import { StageForm } from '@/components/forms/StageForm';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';

interface Pipeline {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  objetivo?: string;
  primary_pipeline: boolean; // Changed to match database
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export function PipelineManager() {
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  
  const { pipelines, loading } = useSupabasePipelines();

  const handleEditPipeline = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setIsPipelineDialogOpen(true);
  };

  const handleEditStage = (stage: PipelineStage) => {
    setSelectedStage(stage);
    setIsStageDialogOpen(true);
  };

  const handleNewStage = (pipelineId: string) => {
    setSelectedStage({ 
      pipeline_id: pipelineId,
      ordem: 1 // Will be calculated properly in the form
    } as PipelineStage);
    setIsStageDialogOpen(true);
  };

  const getPipelineStages = (pipelineId: string) => {
    // TODO: Fetch stages from database
    return [];
  };

  const getStageChecklistCount = (stageId: string) => {
    // TODO: Fetch checklist items from database
    return 0;
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
                        <Badge variant="secondary">
                          {getStageChecklistCount(stage.id)} itens
                        </Badge>
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
                            onClick={() => {
                              // TODO: Implement delete
                              console.log('Delete stage:', stage.id);
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
        
        <Dialog open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedPipeline(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedPipeline ? 'Editar Pipeline' : 'Novo Pipeline'}
              </DialogTitle>
            </DialogHeader>
            <PipelineForm
              pipeline={selectedPipeline}
              onSave={() => {
                setIsPipelineDialogOpen(false);
                setSelectedPipeline(null);
              }}
              onCancel={() => {
                setIsPipelineDialogOpen(false);
                setSelectedPipeline(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Cards */}
      <div>
        {pipelines.map(renderPipelineCard)}
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
            onSave={() => {
              setIsStageDialogOpen(false);
              setSelectedStage(null);
            }}
            onCancel={() => {
              setIsStageDialogOpen(false);
              setSelectedStage(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}