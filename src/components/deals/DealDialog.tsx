import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Loader2 } from 'lucide-react';

interface Deal {
  id?: string;
  lead_id: string;
  valor_proposto: number;
  valor_recorrente?: number | null;
  status: 'aberto' | 'ganho' | 'perdido';
  motivo_perda?: string | null;
  data_fechamento?: string | null;
}

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  existingDeal?: Deal | null;
  onSave: (deal: Partial<Deal>) => Promise<void>;
}

export function DealDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  existingDeal,
  onSave
}: DealDialogProps) {
  const [valorProposto, setValorProposto] = useState<string>('');
  const [valorRecorrente, setValorRecorrente] = useState<string>('');
  const [status, setStatus] = useState<'aberto' | 'ganho' | 'perdido'>('aberto');
  const [motivoPerda, setMotivoPerda] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar com deal existente quando abrir
  useEffect(() => {
    if (open) {
      if (existingDeal) {
        setValorProposto(existingDeal.valor_proposto?.toString() || '');
        setValorRecorrente(existingDeal.valor_recorrente?.toString() || '');
        setStatus(existingDeal.status || 'aberto');
        setMotivoPerda(existingDeal.motivo_perda || '');
      } else {
        // Reset para novo deal
        setValorProposto('');
        setValorRecorrente('');
        setStatus('aberto');
        setMotivoPerda('');
      }
    }
  }, [open, existingDeal]);

  const handleSave = async () => {
    const parsedValor = parseFloat(valorProposto.replace(/\D/g, '')) / 100 || 0;
    const parsedRecorrente = valorRecorrente 
      ? parseFloat(valorRecorrente.replace(/\D/g, '')) / 100 
      : null;

    const dealData: Partial<Deal> = {
      ...(existingDeal?.id ? { id: existingDeal.id } : {}),
      lead_id: leadId,
      valor_proposto: parsedValor,
      valor_recorrente: parsedRecorrente,
      status,
      motivo_perda: status === 'perdido' ? motivoPerda : null,
      data_fechamento: status !== 'aberto' ? new Date().toISOString() : null
    };

    setIsSaving(true);
    try {
      await onSave(dealData);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    
    // Converte para centavos
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {existingDeal ? 'Editar Negociação' : 'Nova Negociação'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lead (readonly) */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Lead</Label>
            <p className="font-medium">{leadName}</p>
          </div>

          {/* Valor Proposto */}
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor da Venda (R$) *</Label>
            <Input
              id="valor"
              placeholder="R$ 0,00"
              value={valorProposto}
              onChange={(e) => setValorProposto(formatCurrencyInput(e.target.value))}
              className="font-mono"
            />
          </div>

          {/* Valor Recorrente */}
          <div className="space-y-1.5">
            <Label htmlFor="recorrente">Valor Recorrente (R$/mês)</Label>
            <Input
              id="recorrente"
              placeholder="R$ 0,00"
              value={valorRecorrente}
              onChange={(e) => setValorRecorrente(formatCurrencyInput(e.target.value))}
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Opcional. Use para assinaturas ou contratos recorrentes.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Em Negociação
                  </span>
                </SelectItem>
                <SelectItem value="ganho">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Ganha
                  </span>
                </SelectItem>
                <SelectItem value="perdido">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Perdida
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Motivo da Perda (condicional) */}
          {status === 'perdido' && (
            <div className="space-y-1.5">
              <Label htmlFor="motivo">Motivo da Perda</Label>
              <Input
                id="motivo"
                placeholder="Por que a venda foi perdida?"
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!valorProposto || isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Negociação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
