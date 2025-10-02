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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Minus, RefreshCw } from 'lucide-react';

interface BulkTaggingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadCount: number;
  availableTags: Array<{ id: string; nome: string; cor: string }>;
  onAddTags: (tagIds: string[]) => Promise<void>;
  onRemoveTags: (tagIds: string[]) => Promise<void>;
  onReplaceTags: (tagIds: string[]) => Promise<void>;
  isLoading: boolean;
  progress: number;
}

type ActionType = 'add' | 'remove' | 'replace';

export function BulkTaggingDialog({
  open,
  onOpenChange,
  leadCount,
  availableTags,
  onAddTags,
  onRemoveTags,
  onReplaceTags,
  isLoading,
  progress
}: BulkTaggingDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [actionType, setActionType] = useState<ActionType>('add');

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleConfirm = async () => {
    if (selectedTags.length === 0) return;

    try {
      if (actionType === 'add') {
        await onAddTags(selectedTags);
      } else if (actionType === 'remove') {
        await onRemoveTags(selectedTags);
      } else {
        await onReplaceTags(selectedTags);
      }
      
      setSelectedTags([]);
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case 'add': return <Plus className="h-4 w-4" />;
      case 'remove': return <Minus className="h-4 w-4" />;
      case 'replace': return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'add': return 'Adicionar';
      case 'remove': return 'Remover';
      case 'replace': return 'Substituir';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Tags em Massa
          </DialogTitle>
          <DialogDescription>
            Esta ação afetará <strong>{leadCount} leads</strong> que correspondem aos filtros atuais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Ação</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={actionType === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionType('add')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button
                type="button"
                variant={actionType === 'remove' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionType('remove')}
                className="flex-1"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remover
              </Button>
              <Button
                type="button"
                variant={actionType === 'replace' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionType('replace')}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Substituir
              </Button>
            </div>
          </div>

          {/* Tags Selection */}
          <div className="space-y-2">
            <Label>Selecione as Tags</Label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
              {availableTags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleToggleTag(tag.id)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={tag.id}
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <Badge style={{ backgroundColor: tag.cor }}>
                      {tag.nome}
                    </Badge>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-2">
              <Label>Progresso</Label>
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
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedTags.length === 0 || isLoading}
          >
            {getActionIcon()}
            {getActionLabel()} Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
