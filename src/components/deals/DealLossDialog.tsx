import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObjecaoPrincipal, DealLostReason } from '@/types/crm';
import { AlertTriangle } from 'lucide-react';

interface DealLossDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  onConfirm: (reason: Omit<DealLostReason, 'id' | 'timestamp'>) => void;
}

const motivosPerda: { value: ObjecaoPrincipal; label: string }[] = [
  { value: 'confianca', label: 'Falta de Confiança' },
  { value: 'preco', label: 'Orçamento/Preço' },
  { value: 'necessidade', label: 'Não é Prioridade' },
  { value: 'tempo', label: 'Falta de Tempo' },
  { value: 'outro', label: 'Outro' },
];

export function DealLossDialog({
  open,
  onOpenChange,
  dealId,
  onConfirm
}: DealLossDialogProps) {
  const [motivo, setMotivo] = useState<ObjecaoPrincipal | ''>('');
  const [detalhes, setDetalhes] = useState('');

  const handleConfirm = () => {
    if (!motivo) return;

    onConfirm({
      deal_id: dealId,
      motivo: motivo as ObjecaoPrincipal,
      detalhes: detalhes.trim() || undefined
    });

    // Reset form
    setMotivo('');
    setDetalhes('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setMotivo('');
    setDetalhes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Marcar Deal como Perdida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Perda*</Label>
            <Select value={motivo} onValueChange={(value) => setMotivo(value as ObjecaoPrincipal)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo principal" />
              </SelectTrigger>
              <SelectContent>
                {motivosPerda.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detalhes">Detalhes Adicionais</Label>
            <Textarea
              id="detalhes"
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Descreva mais detalhes sobre o motivo da perda..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirm}
              disabled={!motivo}
            >
              Confirmar Perda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}