

## Plano: Grupos Não-Consecutivos com Agregação ao Colapsar

### Conceito

Quando etapas não consecutivas pertencem ao mesmo grupo (ex: 1, 2, 3 e 8 no "Grupo A"):
- **Expandido**: Mostra todas as colunas na ordem natural do pipeline
- **Colapsado**: O grupo se torna um único card vertical mostrando dados agregados de TODAS as etapas, independentemente de onde estejam

```text
EXPANDIDO (ordem natural):
│ 1-Agend │ 2-Conf │ 3-Remarc │ 4-NoShow │ 5-Sessão │ 6-Fechou │ 7-Quente │ 8-Frio │
└─────────────────────────────┘           └────────┘ └──────────────────────────────┘
        Pré-Sessão                          Sessão           Decisão

COLAPSADO (grupos agregados - etapas pulam para junto do grupo):
│ ▸ Pré-Sessão │ ▸ Sessão │ ▸ Decisão │
│     (28)     │    (5)   │    (12)   │
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/settings/PipelineManager.tsx` | Remover botão "Setup Completo" |
| `src/components/settings/StageGroupConfigDialog.tsx` | Redesenhar interface com lista unificada + scroll fix |
| `src/components/kanban/KanbanBoard.tsx` | Nova lógica de renderização para grupos não-consecutivos |
| `src/components/kanban/KanbanStageGroup.tsx` | Suportar receber fragmentos de etapas espalhadas |

---

### Mudança 1: Remover Botão "Setup Completo"

O botão condicional para pipeline "comercial" será removido do `PipelineManager.tsx`.

---

### Mudança 2: Redesenhar StageGroupConfigDialog

**Problema atual**: Botões de "Mover para" cortados quando há mais de 3 grupos.

**Solução**: Substituir layout de 2 colunas por lista unificada vertical mais intuitiva:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configurar Grupos - Pipeline Comercial                              [X] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  📋 TODAS AS ETAPAS (na ordem do pipeline)                                │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  # │ Etapa                    │ Grupo                │ Ações        │ │
│  ├────┼──────────────────────────┼──────────────────────┼──────────────┤ │
│  │ 1  │ Agendado                 │ [🔵 Pré-Sessão ▼]    │ [✕]          │ │
│  │ 2  │ Confirmado               │ [🔵 Pré-Sessão ▼]    │ [✕]          │ │
│  │ 3  │ Remarcou                 │ [🔵 Pré-Sessão ▼]    │ [✕]          │ │
│  │ 4  │ No-Show                  │ [🔵 Pré-Sessão ▼]    │ [✕]          │ │
│  │ 5  │ Sessão Realizada         │ [🟣 Sessão ▼]        │ [✕]          │ │
│  │ 6  │ Fechou                   │ [🟣 Decisão ▼]       │ [✕]          │ │
│  │ 7  │ Não Fechou (quente)      │ [🟣 Decisão ▼]       │ [✕]          │ │
│  │ 8  │ Não Fechou (frio)        │ [🟣 Decisão ▼]       │ [✕]          │ │
│  │ ...│ ...                      │ ...                  │ ...          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ➕ GERENCIAR GRUPOS                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ 🔵 Pré-Sessão [✏️][🗑️]  🟣 Sessão [✏️][🗑️]  🟢 Desfecho [✏️][🗑️]   │ │
│  │ + Novo Grupo: [_______] [🎨] [+]                                     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  📋 Templates: [Vendas] [Prospecção] [Onboarding]                         │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                               [Cancelar]  [Salvar Grupos]  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- Cada etapa tem seu próprio dropdown para escolher grupo
- Cor do grupo aparece automaticamente no dropdown
- Sem limite de grupos visíveis
- Ordem do pipeline sempre clara
- Ações rápidas: "✕" remove do grupo atual

---

### Mudança 3: Nova Lógica de Renderização no Kanban

**Lógica atual** (problemática):
```typescript
// Agrupa etapas por nome de grupo e renderiza bloco único
const groupedStages = useMemo(() => {
  const groups = new Map<string | null, typeof stageEntries>();
  stageEntries.forEach(entry => {
    const groupName = entry.stage.grupo || null;
    groups.get(groupName)?.push(entry);
  });
  return groups;
});
```

**Nova lógica** (híbrida):
```typescript
const renderData = useMemo(() => {
  // 1. Identificar quais grupos estão colapsados
  const collapsedGroups = getCollapsedGroupsFromLocalStorage(pipelineId);
  
  // 2. Se nenhum grupo está colapsado → renderizar na ordem natural
  if (collapsedGroups.length === 0) {
    return { mode: 'natural', items: stageEntries };
  }
  
  // 3. Para grupos colapsados → agregar todas as etapas do grupo
  //    Para grupos expandidos → manter ordem natural
  const items = [];
  const processedGroupNames = new Set();
  
  stageEntries.forEach(entry => {
    const groupName = entry.stage.grupo;
    
    if (!groupName) {
      // Etapa sem grupo → renderiza normalmente
      items.push({ type: 'column', entry });
    } else if (collapsedGroups.includes(groupName)) {
      // Grupo colapsado → só adicionar uma vez (agrega todas)
      if (!processedGroupNames.has(groupName)) {
        const allEntriesInGroup = stageEntries.filter(e => e.stage.grupo === groupName);
        items.push({ 
          type: 'collapsed-group', 
          groupName,
          entries: allEntriesInGroup 
        });
        processedGroupNames.add(groupName);
      }
      // Se já processado, pular (já foi agregado)
    } else {
      // Grupo expandido → renderiza com header de grupo
      items.push({ type: 'column', entry, groupName });
    }
  });
  
  return { mode: 'hybrid', items };
}, [stageEntries, pipelineId]);
```

**Visualização:**

```text
Expandido (grupos abertos):
│ Agend │ Conf │ Remarc │ NoShow │ Sessão │ Fechou │ Quente │ Frio │ D+2 │ ...
  ───────────────────────────      ──────   ────────────────────────  ─────
       Pré-Sessão                  Sessão         Decisão              Rec

Colapsado (Pré-Sessão fechado):
│▸ Pré-Sessão (28)│ Sessão │ Fechou │ Quente │ Frio │ D+2 │ D+4 │ ...
                   ──────   ────────────────────────   ─────────────
                   Sessão         Decisão               Recuperação
```

---

### Mudança 4: Atualizar KanbanStageGroup

Adicionar prop para indicar se o grupo é "fragmentado" (não-consecutivo):

```typescript
interface KanbanStageGroupProps {
  groupName: string;
  groupColor?: string | null;
  totalLeads: number;
  stageCount: number;
  pipelineId: string;
  children: ReactNode;
  isFragmented?: boolean;  // NOVO: indica que tem etapas não-consecutivas
  fragmentRanges?: string; // NOVO: ex: "1-4, 8" para mostrar no tooltip
}
```

Quando `isFragmented=true`, mostrar indicador visual sutil:

```text
┌─────────────────────────────────────────┐
│ 🔵 PRÉ-SESSÃO (4 etapas • 28 leads)  ▼ │
│ ⚡ Agregado: posições 1-4, 8             │  ← Tooltip/badge opcional
└─────────────────────────────────────────┘
```

---

### Fluxo de Experiência do Usuário

1. **Configuração**: Usuário agrupa etapas 1, 2, 3 e 8 no mesmo grupo "Pré-Sessão"
2. **Kanban Expandido**: Vê todas as colunas na ordem 1→2→3→4→5→6→7→8
   - Colunas 1, 2, 3 têm header azul "Pré-Sessão"
   - Coluna 8 também tem header azul "Pré-Sessão"
   - Visual indica que pertencem ao mesmo grupo
3. **Kanban Colapsado**: Clica para colapsar "Pré-Sessão"
   - As 4 etapas (1, 2, 3, 8) se fundem em um único card resumido
   - Card mostra: nome do grupo + total de leads + contagem de etapas
   - Etapas 4, 5, 6, 7 continuam visíveis normalmente

---

### Detalhes Técnicos

**Armazenamento do estado de collapse** (já existe):
```typescript
// localStorage key: 'kanban-collapsed-groups-{pipelineId}'
// Valor: JSON array de nomes de grupos colapsados
// Ex: ["Pré-Sessão", "Recuperação"]
```

**Cálculo de leads no grupo colapsado**:
```typescript
const collapsedGroupData = useMemo(() => {
  const allEntriesInGroup = stageEntries.filter(
    e => e.stage.grupo === groupName
  );
  return {
    totalLeads: allEntriesInGroup.reduce(
      (sum, entry) => sum + entry.entries.length, 0
    ),
    stageCount: allEntriesInGroup.length,
    stageOrders: allEntriesInGroup.map(e => e.stage.ordem).sort((a,b) => a-b)
  };
}, [stageEntries, groupName]);
```

**Detecção de fragmentação**:
```typescript
const isFragmented = (orders: number[]) => {
  for (let i = 1; i < orders.length; i++) {
    if (orders[i] - orders[i-1] > 1) return true;
  }
  return false;
};
```

---

### Resumo das Mudanças

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `PipelineManager.tsx` | Remover botão "Setup Completo" |
| 2 | `StageGroupConfigDialog.tsx` | Interface lista unificada com dropdowns |
| 3 | `KanbanBoard.tsx` | Nova lógica de renderização híbrida (expandido/colapsado) |
| 4 | `KanbanStageGroup.tsx` | Suporte a grupos fragmentados com agregação |

