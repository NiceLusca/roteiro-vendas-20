import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, GripVertical, AlertCircle, CheckCircle } from 'lucide-react';
import { ChecklistItemForm } from '@/components/forms/ChecklistItemForm';
import { useSupabaseChecklistItems } from '@/hooks/useSupabaseChecklistItems';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = checklistItems.findIndex((item) => item.id === active.id);
    const newIndex = checklistItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Criar nova ordem
    const reorderedItems = [...checklistItems];
    const [movedItem] = reorderedItems.splice(oldIndex, 1);
    reorderedItems.splice(newIndex, 0, movedItem);

    // Atualizar ordem de todos os itens
    const updates = reorderedItems.map((item, index) => ({
      ...item,
      ordem: index + 1,
    }));

    // Salvar todos os itens com nova ordem
    try {
      await Promise.all(updates.map(item => saveChecklistItem(item)));
      await refetchItems(stageId);
      toast({
        title: "Ordem atualizada",
        description: "A ordem dos itens foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível atualizar a ordem dos itens.",
        variant: "destructive",
      });
    }
  };

  const SortableChecklistRow = ({ item }: { item: ChecklistItem }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id! });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <TableRow ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg' : ''}>
        <TableCell>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </TableCell>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={checklistItems.map(item => item.id!)}
                    strategy={verticalListSortingStrategy}
                  >
                    {checklistItems.map((item) => (
                      <SortableChecklistRow key={item.id} item={item} />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
}