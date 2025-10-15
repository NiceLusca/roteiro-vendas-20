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
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useSupabaseLeadStageManagement } from '@/hooks/useSupabaseLeadStageManagement';
import { ChecklistValidation } from '@/components/checklist/ChecklistValidation';

interface StageAdvancementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id: string;
    lead_id: string;
    etapa_atual_id: string;
    pipeline_id: string;
    checklist_state: Record<string, boolean>;
    nota_etapa?: string;
    tempo_em_etapa_dias: number;
    dias_em_atraso: number;
    saude_etapa: string;
  };
  currentStage: {
    id: string;
    nome: string;
    prazo_em_dias: number;
    saida_criteria?: string;
    proximo_passo_label?: string;
  };
  nextStage: {
    id: string;
    nome: string;
    entrada_criteria?: string;
  };
  leadName: string;
  onSuccess?: () => void;
}

export function StageAdvancementDialog({
  open,
  onOpenChange,
  entry,
  currentStage,
  nextStage,
  leadName,
  onSuccess
}: StageAdvancementDialogProps) {
  const [checklistState, setChecklistState] = useState(entry.checklist_state || {});
  const [note, setNote] = useState(entry.nota_etapa || '');
  const [criteriaCompleted, setCriteriaCompleted] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const { checklistItems, loading: checklistLoading } = useSupabaseChecklistItems(currentStage.id);
  const { advanceStage, loading: advancing } = useSupabaseLeadStageManagement();

  const sortedItems = [...checklistItems].sort((a, b) => a.ordem - b.ordem);
  const completedItems = sortedItems.filter(item => checklistState[item.id]);
  const requiredItems = sortedItems.filter(item => item.obrigatorio);
  const completedRequiredItems = requiredItems.filter(item => checklistState[item.id]);
  
  const progress = sortedItems.length > 0 ? (completedItems.length / sortedItems.length) * 100 : 0;
  const canAdvance = completedRequiredItems.length === requiredItems.length && 
                    (!currentStage.saida_criteria || criteriaCompleted);

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    const newState = { ...checklistState, [itemId]: checked };
    setChecklistState(newState);
  };

  const handleAdvanceStage = async () => {
    setIsAdvancing(true);
    
    try {
      const result = await advanceStage(
        entry.id,
        nextStage.id,
        checklistState,
        note
      );

      if (result.success) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const getSLAStatus = () => {
    if (entry.dias_em_atraso > 0) {
      return { color: 'text-destructive', text: `${entry.dias_em_atraso} dias atrasado`, icon: AlertTriangle };
    }
    
    const remainingDays = currentStage.prazo_em_dias - entry.tempo_em_etapa_dias;
    if (remainingDays <= 1) {
      return { color: 'text-warning', text: `${remainingDays} dia(s) restante(s)`, icon: Clock };
    }
    
    return { color: 'text-success', text: `${remainingDays} dias restantes`, icon: Target };
  };

  const slaStatus = getSLAStatus();
  const SLAIcon = slaStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Avançar Etapa - {leadName}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>De: <strong>{currentStage.nome}</strong></span>
            <ArrowRight className="w-3 h-3" />
            <span>Para: <strong>{nextStage.nome}</strong></span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* SLA Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <SLAIcon className={`w-4 h-4 ${slaStatus.color}`} />
              <span className="text-sm font-medium">Status SLA:</span>
              <span className={`text-sm ${slaStatus.color}`}>{slaStatus.text}</span>
            </div>
            <Badge variant={entry.saude_etapa === 'Verde' ? 'default' : entry.saude_etapa === 'Amarelo' ? 'secondary' : 'destructive'}>
              {entry.saude_etapa}
            </Badge>
          </div>

          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso do Checklist</span>
              <Badge variant="outline">
                {completedItems.length}/{sortedItems.length}
              </Badge>
            </div>
            <Progress value={progress} />
          </div>

          {/* Checklist Items */}
          {!checklistLoading && sortedItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Checklist da Etapa Atual</h4>
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
          )}

          {/* Exit Criteria */}
          {currentStage.saida_criteria && (
            <div className="space-y-3">
              <h4 className="font-medium">Critérios de Saída</h4>
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-3">
                  {currentStage.saida_criteria}
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

          {/* Entry Criteria for Next Stage */}
          {nextStage.entrada_criteria && (
            <div className="space-y-3">
              <h4 className="font-medium">Critérios da Próxima Etapa</h4>
              <div className="p-3 border rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  <strong>{nextStage.nome}:</strong> {nextStage.entrada_criteria}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="note">Observações da Etapa</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione observações sobre o progresso ou próximos passos..."
              rows={3}
            />
          </div>

          {/* Next Step Info */}
          {currentStage.proximo_passo_label && (
            <div className="p-3 bg-primary/5 border rounded-lg">
              <p className="text-sm">
                <strong>Próximo passo sugerido:</strong> {currentStage.proximo_passo_label}
              </p>
            </div>
          )}

          {/* Validation Messages */}
          {!canAdvance && (requiredItems.length > 0 || currentStage.saida_criteria) && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  Pendências para avançar:
                </p>
                <ul className="text-muted-foreground mt-1 list-disc list-inside">
                  {requiredItems.length > completedRequiredItems.length && (
                    <li>
                      Complete {requiredItems.length - completedRequiredItems.length} item(s) obrigatório(s) do checklist
                    </li>
                  )}
                  {currentStage.saida_criteria && !criteriaCompleted && (
                    <li>Marque os critérios de saída como atendidos</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            
            <Button 
              onClick={handleAdvanceStage}
              disabled={!canAdvance || advancing || isAdvancing}
              className="bg-success hover:bg-success/90"
            >
              {advancing || isAdvancing ? (
                'Avançando...'
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Avançar para {nextStage.nome}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}