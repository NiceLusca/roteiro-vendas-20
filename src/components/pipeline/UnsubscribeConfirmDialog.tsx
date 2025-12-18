import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UnsubscribeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  pipelineName: string;
  onConfirm: (motivo?: string) => void;
  loading?: boolean;
}

const MOTIVOS_COMUNS = [
  'Lead não qualificado',
  'Fora do perfil',
  'Sem interesse',
  'Duplicado em outro pipeline',
  'Erro de cadastro',
  'Outro'
];

export function UnsubscribeConfirmDialog({
  open,
  onOpenChange,
  leadName,
  pipelineName,
  onConfirm,
  loading = false
}: UnsubscribeConfirmDialogProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');

  const handleConfirm = () => {
    const motivo = motivoSelecionado === 'Outro' ? motivoCustom : motivoSelecionado;
    onConfirm(motivo || undefined);
    // Resetar estado
    setMotivoSelecionado('');
    setMotivoCustom('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMotivoSelecionado('');
      setMotivoCustom('');
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descadastrar do Pipeline</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja descadastrar <strong>{leadName}</strong> do pipeline <strong>{pipelineName}</strong>?
            <br /><br />
            O lead não será excluído, apenas removido deste pipeline. Você poderá inscrevê-lo novamente depois.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Select value={motivoSelecionado} onValueChange={setMotivoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_COMUNS.map((motivo) => (
                  <SelectItem key={motivo} value={motivo}>
                    {motivo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {motivoSelecionado === 'Outro' && (
            <div className="space-y-2">
              <Label>Descreva o motivo</Label>
              <Textarea
                placeholder="Informe o motivo..."
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Removendo...' : 'Descadastrar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
