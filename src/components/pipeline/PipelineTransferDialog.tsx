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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pipeline, PipelineStage, PipelineTransferRequest } from '@/types/crm';

interface PipelineTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentPipelineId: string;
  pipelines: Pipeline[];
  stages: PipelineStage[];
  onConfirm: (transfer: PipelineTransferRequest) => void;
}

export function PipelineTransferDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  currentPipelineId,
  pipelines,
  stages,
  onConfirm
}: PipelineTransferDialogProps) {
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [motivo, setMotivo] = useState('');

  // Filtrar pipelines disponíveis (excluir o atual)
  const availablePipelines = pipelines.filter(p => p.id !== currentPipelineId && p.ativo);

  // Filtrar stages do pipeline selecionado
  const availableStages = stages.filter(s => s.pipeline_id === selectedPipelineId);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setSelectedStageId(''); // Reset stage selection
  };

  const handleConfirm = () => {
    if (!selectedPipelineId || !selectedStageId || !motivo.trim()) return;

    onConfirm({
      leadId,
      fromPipelineId: currentPipelineId,
      toPipelineId: selectedPipelineId,
      toStageId: selectedStageId,
      motivo: motivo.trim()
    });

    // Reset form
    setSelectedPipelineId('');
    setSelectedStageId('');
    setMotivo('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPipelineId('');
    setSelectedStageId('');
    setMotivo('');
    onOpenChange(false);
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Lead</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Transferindo: <span className="font-medium">{leadName}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Pipeline de Destino</Label>
            <Select value={selectedPipelineId} onValueChange={handlePipelineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar pipeline" />
              </SelectTrigger>
              <SelectContent>
                {availablePipelines.map(pipeline => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPipeline && (
              <p className="text-xs text-muted-foreground">
                {selectedPipeline.descricao}
              </p>
            )}
          </div>

          {selectedPipelineId && (
            <div className="space-y-2">
              <Label>Etapa Inicial</Label>
              <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo da Transferência</Label>
            <Textarea
              placeholder="Descreva o motivo da transferência..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedPipelineId || !selectedStageId || !motivo.trim()}
          >
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}