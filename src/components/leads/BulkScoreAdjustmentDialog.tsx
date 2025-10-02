import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  nome: string;
  lead_score: number | null;
}

interface BulkScoreAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: string[];
  onConfirm: (scoreAdjustment: number, mode: 'add' | 'set') => Promise<void>;
  isLoading: boolean;
  progress: number;
}

export function BulkScoreAdjustmentDialog({
  open,
  onOpenChange,
  leadIds,
  onConfirm,
  isLoading,
  progress
}: BulkScoreAdjustmentDialogProps) {
  const [scoreAdjustment, setScoreAdjustment] = useState<string>('');
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (open && leadIds.length > 0) {
      loadPreview();
    }
  }, [open, leadIds]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, lead_score')
        .in('id', leadIds.slice(0, 10));

      if (error) throw error;
      setPreviewLeads(data || []);
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    const adjustment = parseInt(scoreAdjustment);
    if (isNaN(adjustment)) return;
    await onConfirm(adjustment, mode);
  };

  const calculateNewScore = (currentScore: number | null, adjustment: number, adjustmentMode: 'add' | 'set'): number => {
    const current = currentScore || 0;
    const newScore = adjustmentMode === 'add' ? current + adjustment : adjustment;
    return Math.max(0, Math.min(100, newScore));
  };

  const adjustment = parseInt(scoreAdjustment) || 0;
  const canConfirm = !isNaN(adjustment) && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ajustar Score dos Leads
          </DialogTitle>
          <DialogDescription>
            Ajustar score de {leadIds.length} lead{leadIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Modo de Ajuste */}
          <div className="space-y-3">
            <Label>Modo de Ajuste</Label>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'add' | 'set')} disabled={isLoading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="font-normal">
                  Adicionar/Subtrair pontos do score atual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set" className="font-normal">
                  Definir score específico (substitui o atual)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Input de pontos */}
          <div className="space-y-2">
            <Label htmlFor="score-input">
              {mode === 'add' ? 'Pontos a adicionar/subtrair' : 'Novo score'}
            </Label>
            <Input
              id="score-input"
              type="number"
              value={scoreAdjustment}
              onChange={(e) => setScoreAdjustment(e.target.value)}
              placeholder={mode === 'add' ? 'Ex: +10 ou -5' : 'Ex: 75'}
              disabled={isLoading}
              min={mode === 'set' ? 0 : undefined}
              max={mode === 'set' ? 100 : undefined}
            />
            <p className="text-xs text-muted-foreground">
              {mode === 'add' 
                ? 'Use valores positivos para adicionar ou negativos para subtrair'
                : 'Defina um valor entre 0 e 100'
              }
            </p>
          </div>

          {/* Preview de mudanças */}
          {!loadingPreview && previewLeads.length > 0 && scoreAdjustment && (
            <div className="space-y-2">
              <Label>Preview das mudanças:</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 gap-2 p-2 bg-muted font-medium text-sm">
                  <div>Lead</div>
                  <div className="text-center">Score Atual</div>
                  <div className="text-center">Novo Score</div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {previewLeads.map(lead => {
                    const currentScore = lead.lead_score || 0;
                    const newScore = calculateNewScore(lead.lead_score, adjustment, mode);
                    const isChanged = currentScore !== newScore;
                    
                    return (
                      <div key={lead.id} className="grid grid-cols-3 gap-2 p-2 border-t text-sm">
                        <div className="truncate">{lead.nome}</div>
                        <div className="text-center">{currentScore}</div>
                        <div className={`text-center font-medium ${isChanged ? 'text-primary' : ''}`}>
                          {newScore}
                          {newScore === 0 && currentScore !== 0 && ' (mín)'}
                          {newScore === 100 && currentScore !== 100 && ' (máx)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {leadIds.length > 10 && (
                  <div className="p-2 border-t text-sm text-center text-muted-foreground bg-muted">
                    ... e mais {leadIds.length - 10} lead{leadIds.length - 10 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aviso */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Scores serão automaticamente limitados entre 0 e 100. 
              A classificação (Baixo/Médio/Alto) será recalculada automaticamente.
            </AlertDescription>
          </Alert>

          {/* Progress bar */}
          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Ajustando scores... {progress}%
              </p>
            </div>
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
            disabled={!canConfirm}
          >
            {isLoading ? 'Ajustando...' : 'Confirmar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
