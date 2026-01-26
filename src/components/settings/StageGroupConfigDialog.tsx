import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Layers,
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
  
  // Local state: stage assignments (stageId -> groupName or null)
  const [stageAssignments, setStageAssignments] = useState<Record<string, string | null>>(() => {
    const assignments: Record<string, string | null> = {};
    stages.forEach(stage => {
      assignments[stage.id] = stage.grupo || null;
    });
    return assignments;
  });
  
  // Local state: group definitions (name + color)
  const [groups, setGroups] = useState<GroupDefinition[]>(() => {
    const groupMap = new Map<string, string>();
    stages.forEach(stage => {
      if (stage.grupo && !groupMap.has(stage.grupo)) {
        groupMap.set(stage.grupo, stage.cor_grupo || "#6B7280");
      }
    });
    return Array.from(groupMap.entries()).map(([nome, cor]) => ({ nome, cor }));
  });
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0].value);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reinitialize from stages
      const assignments: Record<string, string | null> = {};
      const groupMap = new Map<string, string>();
      stages.forEach(stage => {
        assignments[stage.id] = stage.grupo || null;
        if (stage.grupo && !groupMap.has(stage.grupo)) {
          groupMap.set(stage.grupo, stage.cor_grupo || "#6B7280");
        }
      });
      setStageAssignments(assignments);
      setGroups(Array.from(groupMap.entries()).map(([nome, cor]) => ({ nome, cor })));
      setNewGroupName("");
      setNewGroupColor(PRESET_COLORS[0].value);
      setEditingGroup(null);
      setShowColorPicker(null);
    }
    onOpenChange(isOpen);
  };

  // Sorted stages
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => a.ordem - b.ordem);
  }, [stages]);

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
    
    setGroups(prev => [...prev, { nome: newGroupName.trim(), cor: newGroupColor }]);
    setNewGroupName("");
  };

  // Delete group
  const handleDeleteGroup = (groupName: string) => {
    // Remove group from definitions
    setGroups(prev => prev.filter(g => g.nome !== groupName));
    // Remove assignments for this group
    setStageAssignments(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(stageId => {
        if (updated[stageId] === groupName) {
          updated[stageId] = null;
        }
      });
      return updated;
    });
  };

  // Start editing group name
  const startEditingGroup = (groupName: string) => {
    setEditingGroup(groupName);
    setEditingGroupName(groupName);
  };

  // Save group name edit
  const saveGroupEdit = (oldName: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroup(null);
      return;
    }
    
    const newName = editingGroupName.trim();
    
    // Update group definition
    setGroups(prev => prev.map(g => 
      g.nome === oldName ? { ...g, nome: newName } : g
    ));
    
    // Update stage assignments
    setStageAssignments(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(stageId => {
        if (updated[stageId] === oldName) {
          updated[stageId] = newName;
        }
      });
      return updated;
    });
    
    setEditingGroup(null);
    setEditingGroupName("");
  };

  // Change group color
  const changeGroupColor = (groupName: string, newColor: string) => {
    setGroups(prev => prev.map(g => 
      g.nome === groupName ? { ...g, cor: newColor } : g
    ));
    setShowColorPicker(null);
  };

  // Assign stage to group
  const assignStageToGroup = (stageId: string, groupName: string | null) => {
    setStageAssignments(prev => ({
      ...prev,
      [stageId]: groupName
    }));
  };

  // Apply template
  const applyTemplate = (templateIndex: number) => {
    const template = GROUP_TEMPLATES[templateIndex];
    if (!template) return;
    
    // Create groups from template
    setGroups(template.groups.map(g => ({ nome: g.nome, cor: g.cor })));
    
    // Clear all assignments
    setStageAssignments(prev => {
      const updated: Record<string, string | null> = {};
      Object.keys(prev).forEach(stageId => {
        updated[stageId] = null;
      });
      return updated;
    });
    
    toast({
      title: "Template aplicado",
      description: `Grupos do template "${template.name}" foram criados. Agora selecione o grupo de cada etapa.`
    });
  };

  // Get group color
  const getGroupColor = (groupName: string): string => {
    return groups.find(g => g.nome === groupName)?.cor || "#6B7280";
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    
    const updates: StageGroupUpdate[] = stages.map(stage => {
      const groupName = stageAssignments[stage.id];
      return {
        stageId: stage.id,
        grupo: groupName,
        cor_grupo: groupName ? getGroupColor(groupName) : null
      };
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

  // Count stages per group for preview
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groups.forEach(g => { counts[g.nome] = 0; });
    Object.values(stageAssignments).forEach(groupName => {
      if (groupName && counts[groupName] !== undefined) {
        counts[groupName]++;
      }
    });
    return counts;
  }, [groups, stageAssignments]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-size="full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Configurar Grupos - {pipelineName}
          </DialogTitle>
          <DialogDescription>
            Atribua cada etapa a um grupo visual. No Kanban, grupos podem ser colapsados para melhor visualização.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Group Management Section */}
          <div className="p-3 border rounded-md space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Grupos ({groups.length})
              </Label>
              <div className="flex gap-2">
                {GROUP_TEMPLATES.map((template, i) => (
                  <Button
                    key={template.name}
                    size="sm"
                    variant="ghost"
                    onClick={() => applyTemplate(i)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Existing Groups */}
            <div className="flex flex-wrap gap-2">
              {groups.map(group => (
                <div 
                  key={group.nome}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border"
                  style={{ borderColor: group.cor, backgroundColor: `${group.cor}15` }}
                >
                  <div className="relative">
                    <button
                      className="w-4 h-4 rounded-full border"
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
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        className="h-6 w-24 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveGroupEdit(group.nome);
                          if (e.key === "Escape") setEditingGroup(null);
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5"
                        onClick={() => saveGroupEdit(group.nome)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5"
                        onClick={() => setEditingGroup(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{group.nome}</span>
                      <Badge variant="secondary" className="text-xs ml-1">
                        {groupCounts[group.nome] || 0}
                      </Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5"
                        onClick={() => startEditingGroup(group.nome)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGroup(group.nome)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              
              {/* New Group Input */}
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === "new" ? null : "new")}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: newGroupColor }}
                  />
                  {showColorPicker === "new" && (
                    <div className="absolute z-50 top-full mt-1 left-0 p-2 bg-popover border rounded-md shadow-lg grid grid-cols-4 gap-1">
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
                <Input 
                  placeholder="Novo grupo..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  className="h-7 w-32 text-sm"
                />
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleCreateGroup}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stage List */}
          <div className="flex-1 min-h-0">
            <Label className="text-sm font-medium mb-2 block">
              Etapas do Pipeline ({sortedStages.length})
            </Label>
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="divide-y">
                {sortedStages.map(stage => {
                  const currentGroup = stageAssignments[stage.id];
                  const groupColor = currentGroup ? getGroupColor(currentGroup) : null;
                  
                  return (
                    <div 
                      key={stage.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50"
                      style={groupColor ? { borderLeftWidth: 3, borderLeftColor: groupColor } : undefined}
                    >
                      <Badge variant="outline" className="text-xs shrink-0 w-8 justify-center">
                        {stage.ordem}
                      </Badge>
                      
                      <span className="flex-1 text-sm font-medium truncate">
                        {stage.nome}
                      </span>
                      
                      <Select
                        value={currentGroup || "__none__"}
                        onValueChange={(value) => assignStageToGroup(stage.id, value === "__none__" ? null : value)}
                      >
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue placeholder="Sem grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">Sem grupo</span>
                          </SelectItem>
                          {groups.map(group => (
                            <SelectItem key={group.nome} value={group.nome}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: group.cor }}
                                />
                                {group.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {currentGroup && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => assignStageToGroup(stage.id, null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Preview */}
          {groups.length > 0 && (
            <div className="p-3 bg-muted rounded-md space-y-2 shrink-0">
              <p className="text-sm font-medium">Preview do Kanban</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {groups.map(group => (
                  <div 
                    key={group.nome}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-xs whitespace-nowrap"
                    style={{ backgroundColor: group.cor }}
                  >
                    {group.nome} ({groupCounts[group.nome] || 0})
                  </div>
                ))}
                {Object.values(stageAssignments).some(g => g === null) && (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded bg-muted-foreground/20 text-muted-foreground text-xs whitespace-nowrap">
                    Sem grupo ({Object.values(stageAssignments).filter(g => g === null).length})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 shrink-0">
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
