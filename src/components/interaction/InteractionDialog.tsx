import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CanalInteracao, Interaction } from '@/types/crm';

interface InteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onSave: (interaction: Omit<Interaction, 'id' | 'timestamp'>) => void;
}

const canaisInteracao: { value: CanalInteracao; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'email', label: 'Email' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'notas', label: 'Notas Internas' },
  { value: 'sessao', label: 'Sessão' }
];

export function InteractionDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onSave
}: InteractionDialogProps) {
  const [canal, setCanal] = useState<CanalInteracao>('whatsapp');
  const [conteudo, setConteudo] = useState('');
  const [autor, setAutor] = useState('Sistema');

  const handleSave = () => {
    if (!conteudo.trim()) return;

    onSave({
      lead_id: leadId,
      canal,
      conteudo: conteudo.trim(),
      autor
    });

    // Reset form
    setCanal('whatsapp');
    setConteudo('');
    setAutor('Sistema');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCanal('whatsapp');
    setConteudo('');
    setAutor('Sistema');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Lead: <span className="font-medium">{leadName}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Canal de Interação</Label>
            <Select value={canal} onValueChange={(value) => setCanal(value as CanalInteracao)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canaisInteracao.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo da Interação</Label>
            <Textarea
              placeholder="Descreva o que foi discutido ou acordado..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={autor} onValueChange={setAutor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="João Santos">João Santos</SelectItem>
                <SelectItem value="Maria Costa">Maria Costa</SelectItem>
                <SelectItem value="Ana Pereira">Ana Pereira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!conteudo.trim()}
          >
            Salvar Interação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}