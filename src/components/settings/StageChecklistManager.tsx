import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { ChecklistItemForm } from '@/components/forms/ChecklistItemForm';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id?: string;
  etapa_id: string;
  titulo: string;
  ordem: number;
  obrigatorio: boolean;
}

interface StageChecklistManagerProps {
  stageId: string;
  stageName: string;
}

export function StageChecklistManager({ stageId, stageName }: StageChecklistManagerProps) {
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  
  const { 
    checklistItems, 
    loading, 
    saveChecklistItem, 
    deleteChecklistItem, 
    refetch: refetchItems 
  } = useSupabaseChecklistItems(stageId);
  
  const { toast } = useToast();

  useEffect(() => {
    if (stageId) {
      refetchItems(stageId);
    }
  }, [stageId, refetchItems]);

  const handleEditItem = (item: ChecklistItem) => {
    setSelectedItem(item);
    setIsChecklistDialogOpen(true);
  };

  const handleNewItem = () => {
    const nextOrder = checklistItems.length > 0 ? Math.max(...checklistItems.map(i => i.ordem)) + 1 : 1;
    
    setSelectedItem({ 
      etapa_id: stageId,
      ordem: nextOrder,
      titulo: '',
      obrigatorio: false
    } as ChecklistItem);
    setIsChecklistDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item do checklist?')) {
      const success = await deleteChecklistItem(itemId);
      if (success) {
        refetchItems(stageId);
      }
    }
  };

  const ChecklistRow = ({ item }: { item: ChecklistItem }) => {
    return (
      <TableRow>
        <TableCell className="font-medium">{item.ordem}</TableCell>
        <TableCell>{item.titulo}</TableCell>
        <TableCell>
          <Badge variant={item.obrigatorio ? "destructive" : "secondary"}>
            {item.obrigatorio ? "Obrigatório" : "Opcional"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleEditItem(item)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleDeleteItem(item.id!)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const requiredItems = checklistItems.filter(item => item.obrigatorio);
  const optionalItems = checklistItems.filter(item => !item.obrigatorio);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Checklist - {stageName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {checklistItems.length} itens ({requiredItems.length} obrigatórios)
            </p>
          </div>
          
          <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleNewItem}>
                <Plus className="w-3 h-3 mr-1" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedItem?.id ? 'Editar Item' : 'Novo Item'} - {stageName}
                </DialogTitle>
              </DialogHeader>
              <ChecklistItemForm
                item={selectedItem}
                onSave={async (data) => {
                  const result = await saveChecklistItem({ 
                    ...data, 
                    etapa_id: stageId,
                    id: selectedItem?.id 
                  });
                  if (result) {
                    setIsChecklistDialogOpen(false);
                    setSelectedItem(null);
                    refetchItems(stageId);
                  }
                }}
                onCancel={() => {
                  setIsChecklistDialogOpen(false);
                  setSelectedItem(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Carregando checklist...</p>
          </div>
        ) : checklistItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum item no checklist ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Novo Item" para adicionar itens ao checklist desta etapa.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Obrigatórios</span>
                </div>
                <p className="text-lg font-semibold mt-1">{requiredItems.length}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Opcionais</span>
                </div>
                <p className="text-lg font-semibold mt-1">{optionalItems.length}</p>
              </div>
            </div>

            {/* Items Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklistItems.map((item) => (
                  <ChecklistRow key={item.id} item={item} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}