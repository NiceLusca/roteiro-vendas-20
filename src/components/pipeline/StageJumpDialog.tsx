import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft } from 'lucide-react';
import { PipelineStage, LeadPipelineEntry, Lead } from '@/types/crm';

interface StageJumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: (LeadPipelineEntry & { lead: Lead }) | null;
  currentStage?: PipelineStage | null;
  availableStages: PipelineStage[];
  onConfirm: (targetStageId: string) => Promise<void>;
}

export function StageJumpDialog({
  open,
  onOpenChange,
  entry,
  currentStage,
  availableStages,
  onConfirm,
}: StageJumpDialogProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedStageId('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedStageId) return;
    
    setIsLoading(true);
    try {
      await onConfirm(selectedStageId);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao transferir etapa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!entry || !currentStage) return null;

  // Ordenar etapas por ordem
  const sortedStages = [...availableStages].sort((a, b) => a.ordem - b.ordem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferir para Etapa
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div><strong>Lead:</strong> {entry.lead.nome}</div>
            <div><strong>Etapa atual:</strong> {currentStage.nome}</div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {sortedStages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Não há outras etapas disponíveis
            </p>
          ) : (
            <RadioGroup value={selectedStageId} onValueChange={setSelectedStageId}>
              <div className="space-y-2">
                {sortedStages.map((stage) => {
                  const isBackward = stage.ordem < currentStage.ordem;
                  const isForward = stage.ordem > currentStage.ordem;
                  
                  return (
                    <div
                      key={stage.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={stage.id} id={stage.id} />
                      <Label
                        htmlFor={stage.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-semibold">{stage.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {isBackward && 'Voltar etapa'}
                          {isForward && 'Avançar etapa'}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStageId || isLoading}
          >
            {isLoading ? 'Transferindo...' : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
