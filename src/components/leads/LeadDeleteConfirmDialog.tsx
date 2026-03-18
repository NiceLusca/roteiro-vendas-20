import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onDeleted?: () => void;
}

export function LeadDeleteConfirmDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onDeleted,
}: LeadDeleteConfirmDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setConfirmed(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!confirmed) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
      toast.success(`Lead "${leadName}" excluído com sucesso`);
      handleClose();
      onDeleted?.();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Lead
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a excluir permanentemente o lead <strong className="text-foreground">{leadName}</strong>.
            Todos os dados relacionados (agendamentos, interações, vendas, pipeline entries) também serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start space-x-2 py-2">
          <Checkbox
            id="confirm-delete"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            disabled={deleting}
          />
          <label
            htmlFor="confirm-delete"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Eu entendo que esta ação é irreversível e desejo excluir este lead permanentemente
          </label>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmed || deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir Lead
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
