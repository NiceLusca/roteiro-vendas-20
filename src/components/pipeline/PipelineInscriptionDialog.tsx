import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pipeline, PipelineStage } from '@/types/crm';

interface PipelineInscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  activePipelineIds: string[]; // Pipelines onde o lead já está inscrito
  pipelines: Pipeline[];
  stages: PipelineStage[];
  onConfirm: (pipelineId: string, stageId: string) => void;
}

export function PipelineInscriptionDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  activePipelineIds,
  pipelines,
  stages,
  onConfirm
}: PipelineInscriptionDialogProps) {
  const [selectedPipelineId, setSelectedPipelineId] = useState('');

  // Filtrar pipelines disponíveis (excluir os ativos)
  const availablePipelines = pipelines.filter(p => 
    !activePipelineIds.includes(p.id) && p.ativo
  );

  const handleConfirm = () => {
    console.log('PipelineInscriptionDialog handleConfirm called');
    console.log('selectedPipelineId:', selectedPipelineId);
    
    if (!selectedPipelineId) {
      console.log('No pipeline selected, returning');
      return;
    }

    // Encontrar a primeira etapa do pipeline selecionado
    const firstStage = stages
      .filter(s => s.pipeline_id === selectedPipelineId)
      .sort((a, b) => a.ordem - b.ordem)[0];

    console.log('First stage found:', firstStage);

    if (!firstStage) {
      console.log('No first stage found, returning');
      return;
    }

    console.log('Calling onConfirm with:', selectedPipelineId, firstStage.id);
    onConfirm(selectedPipelineId, firstStage.id);

    // Reset form
    setSelectedPipelineId('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPipelineId('');
    onOpenChange(false);
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscrever em Pipeline</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Inscrevendo: <span className="font-medium">{leadName}</span>
            </p>
          </div>

          {availablePipelines.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Este lead já está inscrito em todos os pipelines disponíveis
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Pipeline</Label>
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {availablePipelines.map(pipeline => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      <div className="flex items-center gap-2">
                        <span>{pipeline.nome}</span>
                        {pipeline.primary_pipeline && (
                          <Badge variant="secondary" className="text-xs">
                            Primário
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPipeline && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {selectedPipeline.descricao}
                  </p>
                  {selectedPipeline.objetivo && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Objetivo:</span> {selectedPipeline.objetivo}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedPipelineId || availablePipelines.length === 0}
          >
            Inscrever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}