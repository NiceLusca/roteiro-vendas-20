import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadCount: number;
  previewLeads: Array<{ id: string; nome: string; email?: string }>;
  onConfirmDelete: () => Promise<void>;
  isLoading: boolean;
  progress: number;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  leadCount,
  previewLeads,
  onConfirmDelete,
  isLoading,
  progress
}: BulkDeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmed(false);
    setConfirmText('');
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!confirmed || confirmText !== 'EXCLUIR') return;

    try {
      await onConfirmDelete();
      handleClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  const canConfirm = confirmed && confirmText === 'EXCLUIR' && !isLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Leads em Massa
          </DialogTitle>
          <DialogDescription>
            Esta ação é <strong>irreversível</strong> e excluirá permanentemente <strong>{leadCount} leads</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Todos os dados relacionados (agendamentos, interações, pipeline entries) também serão excluídos.
            </AlertDescription>
          </Alert>

          {/* Preview of Leads */}
          <div className="space-y-2">
            <Label>Preview dos Leads (primeiros 10)</Label>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-muted/50">
              {previewLeads.slice(0, 10).map(lead => (
                <div key={lead.id} className="py-1 text-sm">
                  <span className="font-medium">{lead.nome}</span>
                  {lead.email && (
                    <span className="text-muted-foreground ml-2">({lead.email})</span>
                  )}
                </div>
              ))}
              {leadCount > 10 && (
                <div className="text-sm text-muted-foreground mt-2">
                  ... e mais {leadCount - 10} leads
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              disabled={isLoading}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Eu entendo que esta ação é irreversível e desejo excluir {leadCount} leads permanentemente
            </label>
          </div>

          {/* Confirmation Text Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Digite <strong>EXCLUIR</strong> para confirmar
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              disabled={!confirmed || isLoading}
              className={confirmText === 'EXCLUIR' ? 'border-destructive' : ''}
            />
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-2">
              <Label>Excluindo leads...</Label>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {progress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Excluir {leadCount} Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
