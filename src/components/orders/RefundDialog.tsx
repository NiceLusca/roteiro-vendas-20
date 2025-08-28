import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Order, Refund } from '@/types/crm';
import { formatCurrency } from '@/utils/formatters';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onConfirm: (refund: Omit<Refund, 'id' | 'data'>) => void;
}

export function RefundDialog({
  open,
  onOpenChange,
  order,
  onConfirm
}: RefundDialogProps) {
  const [isParcial, setIsParcial] = useState(false);
  const [valor, setValor] = useState(order.total);
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (!motivo.trim() || valor <= 0) return;

    onConfirm({
      order_id: order.id,
      valor: isParcial ? valor : order.total,
      motivo: motivo.trim(),
      parcial: isParcial
    });

    // Reset form
    setIsParcial(false);
    setValor(order.total);
    setMotivo('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setIsParcial(false);
    setValor(order.total);
    setMotivo('');
    onOpenChange(false);
  };

  const handleParcialChange = (checked: boolean) => {
    setIsParcial(checked);
    if (!checked) {
      setValor(order.total);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processar Reembolso</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded p-3">
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Pedido:</span> #{order.id}</p>
              <p><span className="font-medium">Valor Total:</span> {formatCurrency(order.total)}</p>
              <p><span className="font-medium">Status:</span> {order.status}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="parcial"
              checked={isParcial}
              onCheckedChange={handleParcialChange}
            />
            <Label htmlFor="parcial">Reembolso parcial</Label>
          </div>

          {isParcial && (
            <div className="space-y-2">
              <Label>Valor do Reembolso</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                min="0"
                max={order.total}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {formatCurrency(order.total)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo do Reembolso</Label>
            <Textarea
              placeholder="Descreva o motivo do reembolso..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Resumo do Reembolso
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Valor: {formatCurrency(isParcial ? valor : order.total)}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Tipo: {isParcial ? 'Parcial' : 'Total'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!motivo.trim() || valor <= 0 || (isParcial && valor > order.total)}
            variant="destructive"
          >
            Processar Reembolso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}