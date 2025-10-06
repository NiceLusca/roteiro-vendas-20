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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lead, LeadPipelineEntry } from '@/types/crm';
import { formatWhatsApp } from '@/utils/formatters';
import { 
  User, 
  Phone, 
  TrendingUp, 
  GitBranch, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface LeadQuickEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  entry?: LeadPipelineEntry;
  closers: (string | undefined | null)[];
  onSave: (updates: { leadId: string; closer?: string; note?: string }) => void;
  onTransferPipeline?: () => void;
  onViewFull?: () => void;
}

export function LeadQuickEditDialog({
  open,
  onOpenChange,
  lead,
  entry,
  closers,
  onSave,
  onTransferPipeline,
  onViewFull
}: LeadQuickEditDialogProps) {
  const [selectedCloser, setSelectedCloser] = useState(lead?.closer || '');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!lead) return;

    onSave({
      leadId: lead.id,
      closer: selectedCloser !== lead.closer ? selectedCloser : undefined,
      note: note.trim() || undefined
    });

    // Reset form
    setNote('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNote('');
    setSelectedCloser(lead?.closer || '');
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edição Rápida - {lead.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações Básicas */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Básicas
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{formatWhatsApp(lead.whatsapp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                <Badge className="text-xs">
                  Score: {lead.lead_score} ({lead.lead_score_classification})
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {lead.segmento} • {lead.origem}
            </div>
          </div>

          <Separator />

          {/* Trocar Responsável */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsável (Closer)
            </Label>
            <Select value={selectedCloser} onValueChange={setSelectedCloser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar closer" />
              </SelectTrigger>
              <SelectContent>
                {closers.filter(Boolean).map((closer, index) => (
                  <SelectItem key={`closer-${index}`} value={closer as string}>
                    {closer as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Ações Rápidas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Ações Rápidas
            </Label>
            <div className="flex gap-2">
              {onTransferPipeline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onTransferPipeline();
                  }}
                  className="flex-1"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Transferir Pipeline
                </Button>
              )}
              {onViewFull && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onViewFull();
                  }}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Completo
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Adicionar Comentário */}
          <div className="space-y-2">
            <Label>Adicionar Comentário/Nota</Label>
            <Textarea
              placeholder="Adicione uma observação sobre este lead..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Este comentário será adicionado à nota da etapa atual.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
