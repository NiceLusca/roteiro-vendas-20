import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdvancedCriteria } from '@/hooks/useAdvancedCriteria';
import { StageAdvancementCriteria } from '@/types/advancedCriteria';
import { useToast } from '@/hooks/use-toast';

interface AdvancedCriteriaManagerProps {
  stageId: string;
  stageName: string;
}

export function AdvancedCriteriaManager({ stageId, stageName }: AdvancedCriteriaManagerProps) {
  const { criteria, loading, createCriteria, updateCriteria, deleteCriteria } = useAdvancedCriteria(stageId);
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo_criterio: 'automatico',
    obrigatorio: true,
    ordem: criteria.length + 1
  });

  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do critério é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const success = await createCriteria({
      ...formData,
      stage_id: stageId,
      ativo: true
    });

    if (success) {
      setIsCreating(false);
      setFormData({
        nome: '',
        descricao: '',
        tipo_criterio: 'automatico',
        obrigatorio: true,
        ordem: criteria.length + 1
      });
    }
  };

  const handleUpdate = async (id: string) => {
    const criterio = criteria.find(c => c.id === id);
    if (!criterio) return;

    const success = await updateCriteria(id, formData);
    if (success) {
      setEditingId(null);
    }
  };

  const handleEdit = (criterio: StageAdvancementCriteria) => {
    setFormData({
      nome: criterio.nome,
      descricao: criterio.descricao || '',
      tipo_criterio: criterio.tipo_criterio,
      obrigatorio: criterio.obrigatorio,
      ordem: criterio.ordem
    });
    setEditingId(criterio.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este critério?')) {
      await deleteCriteria(id);
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'automatico': return 'bg-blue-500';
      case 'manual': return 'bg-yellow-500';
      case 'condicional': return 'bg-purple-500';
      case 'checklist': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'automatico': return 'Automático';
      case 'manual': return 'Manual';
      case 'condicional': return 'Condicional';
      case 'checklist': return 'Checklist';
      default: return tipo;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Critérios de Avanço</h3>
          <p className="text-sm text-muted-foreground">
            Etapa: {stageName}
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Critério
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Carregando critérios...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((criterio) => (
            <Card key={criterio.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{criterio.nome}</CardTitle>
                    <Badge className={`text-white ${getTipoBadgeColor(criterio.tipo_criterio)}`}>
                      {getTipoLabel(criterio.tipo_criterio)}
                    </Badge>
                    {criterio.obrigatorio && (
                      <Badge variant="destructive">Obrigatório</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(criterio)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(criterio.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {criterio.descricao && (
                <CardContent className="pt-0">
                  <CardDescription>{criterio.descricao}</CardDescription>
                </CardContent>
              )}
            </Card>
          ))}

          {criteria.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">
                  Nenhum critério configurado para esta etapa.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Adicionar Critério" para começar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || editingId !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Novo Critério' : 'Editar Critério'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Lead Score >= 75"
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Critério</Label>
              <Select
                value={formData.tipo_criterio}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_criterio: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatico">Automático</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="condicional">Condicional</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva quando este critério deve ser atendido..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="obrigatorio"
                checked={formData.obrigatorio}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, obrigatorio: checked }))}
              />
              <Label htmlFor="obrigatorio">Critério obrigatório</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                }}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={isCreating ? handleCreate : () => editingId && handleUpdate(editingId)}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}