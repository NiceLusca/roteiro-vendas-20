import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useLeadTags } from '@/hooks/useLeadTags';
import { ArrowRight, ArrowLeft, Plus, Tag, X } from 'lucide-react';

interface TagSelectionStepProps {
  onComplete: (selectedTags: string[]) => void;
  onBack: () => void;
}

const TAG_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export function TagSelectionStep({ onComplete, onBack }: TagSelectionStepProps) {
  const { tags, loading, createTag } = useLeadTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [creatingTag, setCreatingTag] = useState(false);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    const newTag = await createTag(newTagName.trim(), selectedColor);
    if (newTag) {
      setSelectedTags(prev => [...prev, newTag.id]);
      setNewTagName('');
    }
    setCreatingTag(false);
  };

  const handleContinue = () => {
    onComplete(selectedTags);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Tags dos Leads</h3>
        <p className="text-sm text-muted-foreground">
          Selecione ou crie tags para organizar os leads importados (opcional)
        </p>
      </div>

      {/* Criar nova tag */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-4 w-4" />
          <span className="font-medium text-sm">Criar Nova Tag</span>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Nome da tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
          />
          <Button onClick={handleCreateTag} disabled={!newTagName.trim() || creatingTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Tags existentes */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4" />
          <span className="font-medium text-sm">Tags Existentes</span>
          {selectedTags.length > 0 && (
            <Badge variant="secondary">{selectedTags.length} selecionadas</Badge>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando tags...</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tag criada ainda</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                onClick={() => handleToggleTag(tag.id)}
              >
                <Checkbox
                  checked={selectedTags.includes(tag.id)}
                  onCheckedChange={() => handleToggleTag(tag.id)}
                />
                <Badge style={{ backgroundColor: tag.cor, color: 'white' }}>
                  {tag.nome}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="bg-accent/50 rounded-lg p-3">
          <p className="text-sm font-medium mb-2">Tags selecionadas:</p>
          <div className="flex gap-2 flex-wrap">
            {selectedTags.map((tagId) => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.cor, color: 'white' }}
                  className="cursor-pointer"
                  onClick={() => handleToggleTag(tag.id)}
                >
                  {tag.nome}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleContinue}>
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
