import { useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tag, X, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadTag } from '@/types/bulkImport';
import { useLeadTags } from '@/hooks/useLeadTags';

interface TagPopoverProps {
  leadId: string;
  currentTags: LeadTag[];
  onTagsChange?: () => void;
}

export function TagPopover({ leadId, currentTags, onTagsChange }: TagPopoverProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { tags: availableTags, createTag, assignTagsToLead, removeTagFromLead } = useLeadTags();

  const handleAddTag = useCallback(async (tag: LeadTag) => {
    if (currentTags.some(t => t.id === tag.id)) return;
    
    setIsAdding(true);
    try {
      await assignTagsToLead(leadId, [tag.id]);
      onTagsChange?.();
    } finally {
      setIsAdding(false);
    }
  }, [leadId, currentTags, assignTagsToLead, onTagsChange]);

  const handleRemoveTag = useCallback(async (tagId: string) => {
    setIsAdding(true);
    try {
      await removeTagFromLead(leadId, tagId);
      onTagsChange?.();
    } finally {
      setIsAdding(false);
    }
  }, [leadId, removeTagFromLead, onTagsChange]);

  const handleCreateAndAdd = useCallback(async () => {
    if (!newTagName.trim()) return;
    
    setIsAdding(true);
    try {
      // Gerar cor aleatória
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newTag = await createTag(newTagName.trim(), randomColor);
      if (newTag) {
        await assignTagsToLead(leadId, [newTag.id]);
        setNewTagName('');
        onTagsChange?.();
      }
    } finally {
      setIsAdding(false);
    }
  }, [newTagName, leadId, createTag, assignTagsToLead, onTagsChange]);

  const unassignedTags = availableTags.filter(
    t => !currentTags.some(ct => ct.id === t.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Tags</h4>
            {isAdding && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
          
          {/* Tags atuais */}
          {currentTags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Atribuídas:</p>
              <div className="flex flex-wrap gap-1">
                {currentTags.map(tag => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.cor || '#3b82f6', color: 'white' }}
                    className="text-[11px] px-2 py-0.5 pr-1 flex items-center gap-1"
                  >
                    {tag.nome}
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:bg-white/20 rounded p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags disponíveis */}
          {unassignedTags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Adicionar:</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {unassignedTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{ borderColor: tag.cor || '#3b82f6', color: tag.cor || '#3b82f6' }}
                    className="text-[11px] px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleAddTag(tag)}
                  >
                    <Plus className="h-2.5 w-2.5 mr-0.5" />
                    {tag.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Criar nova tag */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Criar nova:</p>
            <div className="flex gap-1.5">
              <Input
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateAndAdd();
                  }
                }}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCreateAndAdd}
                disabled={!newTagName.trim() || isAdding}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
