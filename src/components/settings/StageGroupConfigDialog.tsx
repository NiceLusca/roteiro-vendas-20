import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Palette, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  GripVertical,
  Layers,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PipelineStage {
  id: string;
  nome: string;
  ordem: number;
  grupo?: string | null;
  cor_grupo?: string | null;
}

interface StageGroupUpdate {
  stageId: string;
  grupo: string | null;
  cor_grupo: string | null;
}

interface GroupDefinition {
  nome: string;
  cor: string;
  stageIds: string[];
}

interface StageGroupConfigDialogProps {
  pipelineId: string;
  pipelineName: string;
  stages: PipelineStage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: StageGroupUpdate[]) => Promise<boolean>;
}

const PRESET_COLORS = [
  { name: "Azul", value: "#3B82F6" },
  { name: "Violeta", value: "#8B5CF6" },
  { name: "Roxo", value: "#A855F7" },
  { name: "Laranja", value: "#F97316" },
  { name: "Verde", value: "#10B981" },
  { name: "Amarelo", value: "#EAB308" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Cinza", value: "#6B7280" },
];

const GROUP_TEMPLATES = [
  {
    name: "Comercial/Vendas",
    groups: [
      { nome: "Pré-Sessão", cor: "#3B82F6" },
      { nome: "Sessão", cor: "#8B5CF6" },
      { nome: "Decisão", cor: "#A855F7" },
      { nome: "Recuperação", cor: "#F97316" },
      { nome: "Desfecho", cor: "#10B981" },
    ]
  },
  {
    name: "Prospecção",
    groups: [
      { nome: "Entrada", cor: "#6B7280" },
      { nome: "Contato", cor: "#3B82F6" },
      { nome: "Qualificação", cor: "#EAB308" },
      { nome: "Fechamento", cor: "#10B981" },
    ]
  },
  {
    name: "Onboarding",
    groups: [
      { nome: "Boas-Vindas", cor: "#3B82F6" },
      { nome: "Configuração", cor: "#EAB308" },
      { nome: "Ativação", cor: "#10B981" },
      { nome: "Acompanhamento", cor: "#F97316" },
    ]
  },
];

export function StageGroupConfigDialog({
  pipelineId,
  pipelineName,
  stages,
  open,
  onOpenChange,
  onSave,
}: StageGroupConfigDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [groups, setGroups] = useState<GroupDefinition[]>(() => {
    // Initialize from existing stage groups
    const groupMap = new Map<string, GroupDefinition>();
    stages.forEach(stage => {
      if (stage.grupo) {
        const existing = groupMap.get(stage.grupo);
        if (existing) {
          existing.stageIds.push(stage.id);
        } else {
          groupMap.set(stage.grupo, {
            nome: stage.grupo,
            cor: stage.cor_grupo || "#6B7280",
            stageIds: [stage.id]
          });
        }
      }
    });
    return Array.from(groupMap.values());
  });
  
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0].value);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // Reset state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reinitialize from stages
      const groupMap = new Map<string, GroupDefinition>();
      stages.forEach(stage => {
        if (stage.grupo) {
          const existing = groupMap.get(stage.grupo);
          if (existing) {
            existing.stageIds.push(stage.id);
          } else {
            groupMap.set(stage.grupo, {
              nome: stage.grupo,
              cor: stage.cor_grupo || "#6B7280",
              stageIds: [stage.id]
            });
          }
        }
      });
      setGroups(Array.from(groupMap.values()));
      setSelectedStageIds([]);
      setNewGroupName("");
      setNewGroupColor(PRESET_COLORS[0].value);
    }
    onOpenChange(open);
  };

  // Stages not in any group
  const unassignedStages = useMemo(() => {
    const assignedIds = new Set(groups.flatMap(g => g.stageIds));
    return stages
      .filter(s => !assignedIds.has(s.id))
      .sort((a, b) => a.ordem - b.ordem);
  }, [stages, groups]);

  // Create new group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o grupo.",
        variant: "destructive"
      });
      return;
    }
    
    if (groups.some(g => g.nome.toLowerCase() === newGroupName.trim().toLowerCase())) {
      toast({
        title: "Grupo já existe",
        description: "Escolha outro nome para o grupo.",
        variant: "destructive"
      });
      return;
    }
    
    setGroups([...groups, {
      nome: newGroupName.trim(),
      cor: newGroupColor,
      stageIds: []
    }]);
    setNewGroupName("");
  };

  // Move selected stages to group
  const handleMoveToGroup = (groupNome: string) => {
    if (selectedStageIds.length === 0) return;
    
    setGroups(prev => prev.map(g => {
      if (g.nome === groupNome) {
        return {
          ...g,
          stageIds: [...new Set([...g.stageIds, ...selectedStageIds])]
        };
      }
      // Remove from other groups
      return {
        ...g,
        stageIds: g.stageIds.filter(id => !selectedStageIds.includes(id))
      };
    }));
    setSelectedStageIds([]);
  };

  // Remove stage from group
  const handleRemoveFromGroup = (groupNome: string, stageId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.nome === groupNome) {
        return {
          ...g,
          stageIds: g.stageIds.filter(id => id !== stageId)
        };
      }
      return g;
    }));
  };

  // Delete group (stages return to unassigned)
  const handleDeleteGroup = (groupNome: string) => {
    setGroups(prev => prev.filter(g => g.nome !== groupNome));
  };

  // Start editing group name
  const startEditingGroup = (groupNome: string) => {
    setEditingGroup(groupNome);
    setEditingGroupName(groupNome);
  };

  // Save group name edit
  const saveGroupEdit = (oldName: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroup(null);
      return;
    }
    
    setGroups(prev => prev.map(g => {
      if (g.nome === oldName) {
        return { ...g, nome: editingGroupName.trim() };
      }
      return g;
    }));
    setEditingGroup(null);
    setEditingGroupName("");
  };

  // Change group color
  const changeGroupColor = (groupNome: string, newColor: string) => {
    setGroups(prev => prev.map(g => {
      if (g.nome === groupNome) {
        return { ...g, cor: newColor };
      }
      return g;
    }));
    setShowColorPicker(null);
  };

  // Apply template
  const applyTemplate = (templateIndex: number) => {
    const template = GROUP_TEMPLATES[templateIndex];
    if (!template) return;
    
    // Create groups from template
    const newGroups = template.groups.map(g => ({
      nome: g.nome,
      cor: g.cor,
      stageIds: [] as string[]
    }));
    
    setGroups(newGroups);
    toast({
      title: "Template aplicado",
      description: `Grupos do template "${template.name}" foram criados. Agora arraste as etapas para os grupos.`
    });
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    
    // Build updates array
    const updates: StageGroupUpdate[] = [];
    
    // Stages in groups
    groups.forEach(group => {
      group.stageIds.forEach(stageId => {
        updates.push({
          stageId,
          grupo: group.nome,
          cor_grupo: group.cor
        });
      });
    });
    
    // Unassigned stages (remove group)
    unassignedStages.forEach(stage => {
      updates.push({
        stageId: stage.id,
        grupo: null,
        cor_grupo: null
      });
    });
    
    const success = await onSave(updates);
    setIsSaving(false);
    
    if (success) {
      toast({
        title: "Grupos salvos!",
        description: "A configuração de grupos foi aplicada com sucesso."
      });
      onOpenChange(false);
    }
  };

  // Toggle stage selection
  const toggleStageSelection = (stageId: string) => {
    setSelectedStageIds(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  // Select all unassigned
  const selectAllUnassigned = () => {
    setSelectedStageIds(unassignedStages.map(s => s.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStageIds([]);
  };

  // Get stage name by id
  const getStageName = (stageId: string) => {
    return stages.find(s => s.id === stageId)?.nome || "Etapa desconhecida";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-size="full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Configurar Grupos - {pipelineName}
          </DialogTitle>
          <DialogDescription>
            Organize as etapas do pipeline em grupos visuais para facilitar a navegação no Kanban.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left Column: Unassigned Stages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Etapas Sem Grupo ({unassignedStages.length})
                </h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={selectAllUnassigned} disabled={unassignedStages.length === 0}>
                    Selecionar Todas
                  </Button>
                  {selectedStageIds.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={clearSelection}>
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {unassignedStages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Todas as etapas estão em grupos!
                  </p>
                ) : (
                  <div className="space-y-1">
                    {unassignedStages.map(stage => (
                      <div 
                        key={stage.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent transition-colors ${
                          selectedStageIds.includes(stage.id) ? "bg-primary/10 border border-primary" : ""
                        }`}
                        onClick={() => toggleStageSelection(stage.id)}
                      >
                        <Checkbox 
                          checked={selectedStageIds.includes(stage.id)}
                          onCheckedChange={() => toggleStageSelection(stage.id)}
                        />
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{stage.nome}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          #{stage.ordem}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Quick Action */}
              {selectedStageIds.length > 0 && groups.length > 0 && (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <p className="text-sm font-medium">
                    ⚡ Mover {selectedStageIds.length} etapa(s) para:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groups.map(group => (
                      <Button
                        key={group.nome}
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveToGroup(group.nome)}
                        className="gap-1"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.cor }}
                        />
                        {group.nome}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Group */}
              <div className="p-3 border rounded-md space-y-2">
                <Label className="text-sm font-medium">+ Novo Grupo</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome do grupo..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                    className="flex-1"
                  />
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(showColorPicker === "new" ? null : "new")}
                      className="w-10 h-10 rounded-md border flex items-center justify-center"
                      style={{ backgroundColor: newGroupColor }}
                    />
                    {showColorPicker === "new" && (
                      <div className="absolute z-50 top-full mt-1 right-0 p-2 bg-popover border rounded-md shadow-lg grid grid-cols-4 gap-1">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color.value}
                            className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground"
                            style={{ backgroundColor: color.value }}
                            onClick={() => {
                              setNewGroupColor(color.value);
                              setShowColorPicker(null);
                            }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="icon" onClick={handleCreateGroup}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Templates */}
              <div className="p-3 border rounded-md space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  📋 Aplicar Template
                </Label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_TEMPLATES.map((template, i) => (
                    <Button
                      key={template.name}
                      size="sm"
                      variant="outline"
                      onClick={() => applyTemplate(i)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Defined Groups */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Grupos Definidos ({groups.length})
              </h3>
              
              <ScrollArea className="h-[400px] border rounded-md p-2">
                {groups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Nenhum grupo definido ainda.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Crie um grupo ou aplique um template.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map(group => (
                      <div 
                        key={group.nome}
                        className="border rounded-md overflow-hidden"
                      >
                        {/* Group Header */}
                        <div 
                          className="flex items-center gap-2 p-2 text-white"
                          style={{ backgroundColor: group.cor }}
                        >
                          <div className="relative">
                            <button
                              className="w-6 h-6 rounded border-2 border-white/50 hover:border-white"
                              style={{ backgroundColor: group.cor }}
                              onClick={() => setShowColorPicker(showColorPicker === group.nome ? null : group.nome)}
                            />
                            {showColorPicker === group.nome && (
                              <div className="absolute z-50 top-full mt-1 left-0 p-2 bg-popover border rounded-md shadow-lg grid grid-cols-4 gap-1">
                                {PRESET_COLORS.map(color => (
                                  <button
                                    key={color.value}
                                    className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground"
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => changeGroupColor(group.nome, color.value)}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {editingGroup === group.nome ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                className="h-6 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/50"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveGroupEdit(group.nome);
                                  if (e.key === "Escape") setEditingGroup(null);
                                }}
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-white hover:bg-white/20"
                                onClick={() => saveGroupEdit(group.nome)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-white hover:bg-white/20"
                                onClick={() => setEditingGroup(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium flex-1">{group.nome}</span>
                              <Badge variant="secondary" className="text-xs">
                                {group.stageIds.length}
                              </Badge>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-white hover:bg-white/20"
                                onClick={() => startEditingGroup(group.nome)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-white hover:bg-white/20"
                                onClick={() => handleDeleteGroup(group.nome)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                        
                        {/* Group Stages */}
                        <div className="p-2 space-y-1 min-h-[40px]">
                          {group.stageIds.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Arraste etapas aqui ou selecione e clique no grupo
                            </p>
                          ) : (
                            group.stageIds
                              .map(id => stages.find(s => s.id === id))
                              .filter(Boolean)
                              .sort((a, b) => (a?.ordem || 0) - (b?.ordem || 0))
                              .map(stage => stage && (
                                <div 
                                  key={stage.id}
                                  className="flex items-center gap-2 p-1.5 bg-muted/50 rounded text-sm group"
                                >
                                  <span className="flex-1">{stage.nome}</span>
                                  <Badge variant="outline" className="text-xs">
                                    #{stage.ordem}
                                  </Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveFromGroup(group.nome, stage.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Preview */}
              {groups.length > 0 && (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" />
                    Preview do Kanban
                  </p>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {groups.map(group => (
                      <div 
                        key={group.nome}
                        className="flex items-center gap-1 px-2 py-1 rounded text-white text-xs whitespace-nowrap"
                        style={{ backgroundColor: group.cor }}
                      >
                        {group.nome} ({group.stageIds.length})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Grupos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
