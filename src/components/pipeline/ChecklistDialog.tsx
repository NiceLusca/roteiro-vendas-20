import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  ArrowRight 
} from 'lucide-react';
import { 
  LeadPipelineEntry, 
  StageChecklistItem, 
  PipelineStage 
} from '@/types/crm';

interface ChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LeadPipelineEntry;
  stage: PipelineStage;
  checklistItems: StageChecklistItem[];
  onUpdateChecklist: (checklistState: Record<string, boolean>) => void;
  onUpdateNote: (note: string) => void;
  onAdvanceStage?: () => void;
}

export function ChecklistDialog({
  open,
  onOpenChange,
  entry,
  stage,
  checklistItems,
  onUpdateChecklist,
  onUpdateNote,
  onAdvanceStage
}: ChecklistDialogProps) {
  const [checklistState, setChecklistState] = useState(entry.checklist_state || {});
  const [note, setNote] = useState(entry.nota_etapa || '');
  const [criteriaCompleted, setCriteriaCompleted] = useState(false);

  const sortedItems = [...checklistItems]
    .filter(item => item.etapa_id === stage.id)
    .sort((a, b) => a.ordem - b.ordem);

  const completedItems = sortedItems.filter(item => checklistState[item.id]);
  const requiredItems = sortedItems.filter(item => item.obrigatorio);
  const completedRequiredItems = requiredItems.filter(item => checklistState[item.id]);
  
  const progress = sortedItems.length > 0 ? (completedItems.length / sortedItems.length) * 100 : 0;
  const canAdvance = completedRequiredItems.length === requiredItems.length && criteriaCompleted;

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    const newState = { ...checklistState, [itemId]: checked };
    setChecklistState(newState);
  };

  const handleSave = () => {
    onUpdateChecklist(checklistState);
    onUpdateNote(note);
    onOpenChange(false);
  };

  const handleAdvance = () => {
    onUpdateChecklist(checklistState);
    onUpdateNote(note);
    onAdvanceStage?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Checklist - {stage.nome}
            <Badge variant="outline">
              {completedItems.length}/{sortedItems.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h4 className="font-medium">Itens do Checklist</h4>
            {sortedItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id={item.id}
                  checked={checklistState[item.id] || false}
                  onCheckedChange={(checked) => 
                    handleChecklistChange(item.id, checked as boolean)
                  }
                />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={item.id}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    {item.titulo}
                    {item.obrigatorio && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </Label>
                </div>
                {checklistState[item.id] ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Critérios de Saída */}
          {stage.saida_criteria && (
            <div className="space-y-3">
              <h4 className="font-medium">Critérios de Saída</h4>
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-3">
                  {stage.saida_criteria}
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="criteria"
                    checked={criteriaCompleted}
                    onCheckedChange={(checked) => setCriteriaCompleted(checked === true)}
                  />
                  <Label htmlFor="criteria" className="text-sm cursor-pointer">
                    Critérios de saída atendidos
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Notas da Etapa */}
          <div className="space-y-3">
            <Label htmlFor="note">Observações da Etapa</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione observações sobre o progresso nesta etapa..."
              rows={3}
            />
          </div>

          {/* Validação */}
          {!canAdvance && requiredItems.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  Itens obrigatórios pendentes
                </p>
                <p className="text-muted-foreground">
                  Complete {requiredItems.length - completedRequiredItems.length} item(s) obrigatório(s) 
                  {stage.saida_criteria && !criteriaCompleted && ' e marque os critérios de saída'} 
                  para avançar.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                Salvar Progresso
              </Button>
              
              {canAdvance && (
                <Button onClick={handleAdvance} className="bg-success hover:bg-success/90">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Avançar Etapa
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}