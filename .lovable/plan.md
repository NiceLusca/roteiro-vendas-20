

# Plano: Restaurar Ordem Natural das Colunas e Manter Colapso Discreto

## Problema

A implementação atual do `expanded-group` no `KanbanBoard.tsx` (linhas 295-308) agrupa TODAS as etapas de um grupo na posição da primeira etapa encontrada, reordenando o pipeline visualmente.

**Exemplo do bug**:
- Pipeline real: `[1-Entrada, 2-CALL, 3-Grupo, 4-Definição, 5-Ativação, 6-..., 8-Contrato]`
- Se etapas 1,2,3,8 pertencem ao grupo "Captação"
- O código atual junta 1,2,3,8 em um container único na posição 1
- Resultado: `[container(1,2,3,8), 4-Definição, 5-Ativação, 6-...]` — etapa 8 "pulou" para o começo!

## Solução

Remover completamente o tipo `expanded-group` e voltar ao comportamento simples:

1. **Etapa sem grupo**: renderiza como coluna normal
2. **Etapa de grupo colapsado**: só a primeira etapa do grupo renderiza o card colapsado, demais são omitidas
3. **Etapa de grupo expandido**: renderiza como coluna normal NA SUA POSIÇÃO ORIGINAL

O `KanbanColumn` já possui a barra de cor do grupo (`stage.cor_grupo`), então a identidade visual está garantida.

Para colapsar/expandir de forma discreta, vou adicionar um pequeno ícone de toggle na barra de cor de cada coluna que pertence a um grupo.

---

## Alterações Técnicas

### Arquivo: `src/components/kanban/KanbanBoard.tsx`

#### 1. Simplificar o tipo `RenderItem` (remover expanded-group)

**Antes (linha 265-268)**:
```typescript
type RenderItem = 
  | { type: 'column'; entry: typeof stageEntries[0] }
  | { type: 'collapsed-group'; groupName: string; color: string | null; totalLeads: number; stageCount: number; stageNames: string[] }
  | { type: 'expanded-group'; groupName: string; color: string | null; entries: typeof stageEntries; isFragmented: boolean; fragmentRanges: string };
```

**Depois**:
```typescript
type RenderItem = 
  | { type: 'column'; entry: typeof stageEntries[0]; groupName?: string }
  | { type: 'collapsed-group'; groupName: string; color: string | null; totalLeads: number; stageCount: number; stageNames: string[] };
```

#### 2. Corrigir a lógica do loop (linhas 273-309)

**Antes** (problema - pula etapas do grupo expandido):
```typescript
stageEntries.forEach((entry) => {
  const groupName = entry.stage.grupo;
  
  if (!groupName) {
    items.push({ type: 'column', entry });
  } else if (processedGroups.has(groupName)) {
    return; // PULA as demais etapas do grupo!
  } else if (collapsedGroups.includes(groupName)) {
    // ...collapsed-group
    processedGroups.add(groupName);
  } else {
    // expanded-group com TODAS as entries
    items.push({ type: 'expanded-group', ... });
    processedGroups.add(groupName);
  }
});
```

**Depois** (correto - mantém ordem natural):
```typescript
stageEntries.forEach((entry) => {
  const groupName = entry.stage.grupo;
  
  if (!groupName) {
    // Etapa sem grupo → coluna normal
    items.push({ type: 'column', entry });
  } else if (collapsedGroups.includes(groupName)) {
    // Grupo COLAPSADO → só adiciona card de resumo uma vez
    if (!processedGroups.has(groupName)) {
      const info = groupInfo.get(groupName)!;
      items.push({
        type: 'collapsed-group',
        groupName,
        color: info.color,
        totalLeads: info.entries.reduce((sum, e) => sum + e.entries.length, 0),
        stageCount: info.entries.length,
        stageNames: info.stageNames
      });
      processedGroups.add(groupName);
    }
    // Não adiciona colunas individuais de grupos colapsados
  } else {
    // Grupo EXPANDIDO → coluna normal na posição natural!
    items.push({ type: 'column', entry, groupName });
  }
});
```

#### 3. Simplificar a renderização (linhas 351-400)

**Remover** o bloco `if (item.type === 'expanded-group')` inteiro (linhas 368-394).

**Depois**:
```typescript
{renderData.items.map((item) => {
  if (item.type === 'collapsed-group') {
    return (
      <KanbanCollapsedGroup
        key={`collapsed-${item.groupName}`}
        groupName={item.groupName}
        groupColor={item.color}
        totalLeads={item.totalLeads}
        stageCount={item.stageCount}
        stageNames={item.stageNames}
        onToggleCollapse={() => toggleGroupCollapse(item.groupName)}
      />
    );
  }
  
  // Coluna individual (com ou sem grupo)
  return (
    <KanbanColumn 
      key={item.entry.stage.id} 
      {...getColumnProps(item.entry)}
      // Toggle discreto será adicionado ao KanbanColumn
      groupName={item.groupName}
      onToggleGroupCollapse={item.groupName ? () => toggleGroupCollapse(item.groupName!) : undefined}
    />
  );
})}
```

---

### Arquivo: `src/components/kanban/KanbanColumn.tsx`

#### Adicionar botão discreto de colapso no header (se tiver grupo)

Adicionar novas props:
```typescript
interface KanbanColumnProps {
  // ... props existentes
  groupName?: string;
  onToggleGroupCollapse?: () => void;
}
```

No header da coluna (linha ~200), se `groupName` existir, adicionar um ícone pequeno na barra de cor:

```tsx
{/* Barra de cor com toggle discreto */}
<div className="relative">
  <div 
    className="h-1 rounded-full mb-2" 
    style={{ 
      background: stage.cor_grupo 
        ? `linear-gradient(to right, ${stage.cor_grupo}cc, ${stage.cor_grupo}99)` 
        : 'linear-gradient(to right, #10b981cc, #10b98199)' 
    }} 
  />
  {groupName && onToggleGroupCollapse && (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleGroupCollapse(); }}
      className="absolute -top-0.5 right-0 p-0.5 rounded hover:bg-muted/50 transition-colors"
      title={`Colapsar grupo "${groupName}"`}
    >
      <ChevronLeft className="h-3 w-3 text-muted-foreground" />
    </button>
  )}
</div>
```

---

## Resultado Visual

```text
EXPANDIDO (ordem natural preservada):
│ 1-Entrada │ │ 2-CALL │ │ 3-Grupo │ │ 4-Definição │ │ 5-Ativação │ │... │ │ 8-Contrato │
    ═══ ◁       ═══ ◁       ═══ ◁         ───              ───               ═══ ◁
   Azul        Azul        Azul          Roxo             Roxo              Azul
   
◁ = ícone discreto para colapsar grupo "Captação"

COLAPSADO (grupo "Captação" fechado):
│ ▸ Captação (4et) │ │ 4-Definição │ │ 5-Ativação │ │...│
      12 leads
```

---

## Resumo das Alterações

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `KanbanBoard.tsx` | Remover tipo `expanded-group`, corrigir loop para manter ordem natural |
| 2 | `KanbanBoard.tsx` | Passar `groupName` e `onToggleGroupCollapse` para `KanbanColumn` |
| 3 | `KanbanColumn.tsx` | Adicionar ícone discreto de colapso na barra de cor (se tiver grupo) |

## Benefícios

1. **Ordem preservada**: cada etapa fica exatamente na sua posição original do pipeline
2. **Toggle discreto**: ícone pequeno na barra de cor para colapsar grupo
3. **Código mais simples**: apenas 2 tipos de item (column, collapsed-group)
4. **Identidade visual mantida**: barra de cor indica pertencimento ao grupo

