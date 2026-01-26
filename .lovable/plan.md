
# Plano: Corrigir Visualização de Grupos Expandidos no Kanban

## Problema Identificado

Na imagem fornecida, o grupo "Captação e Formalização do Con..." mostra o header com "(5 etapas)", mas apenas a primeira etapa "Entrada" aparece diretamente abaixo dele. As outras 4 etapas (PRIMEIRA CALL, Grupo Criado + BOAS VINDAS!, etc.) aparecem como colunas soltas sem conexão visual com o grupo.

**Causa raiz**: No `KanbanBoard.tsx`, cada coluna de um grupo expandido é renderizada em uma `<div>` separada. O header do grupo só aparece na primeira coluna (`showGroupHeader: isFirstInGroup`), deixando as outras colunas visualmente desconectadas.

```text
ATUAL (problema):
┌─────────────────────┐
│ ▼ Captação (5 et.)  │   
│ ───────────         │   ┌───────────┐  ┌───────────┐  ┌───────────┐
│ Entrada             │   │PRIMEIRA   │  │Grupo Cria.│  │Aguard.    │
│   0                 │   │CALL    0  │  │+ BOAS   0 │  │Assinat. 1 │
└─────────────────────┘   └───────────┘  └───────────┘  └───────────┘
                           ↑ SEM HEADER DE GRUPO!
```

## Solução Proposta

Agrupar todas as colunas de um grupo expandido dentro de um container visual único, mantendo o header do grupo acima de todas as colunas do grupo.

```text
CORRIGIDO:
┌────────────────────────────────────────────────────────────────────────────┐
│ ▼ Captação e Formalização do Contrato    👤 1    (5 etapas)               │
│ ══════════════════════════════════════════════════════════════════════════│
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│ │ Entrada   │  │PRIMEIRA   │  │Grupo Cria.│  │Aguardando │  │Contrato   │ │
│ │    0      │  │CALL    0  │  │+ BOAS   0 │  │Assinat. 1 │  │Assinado 0 │ │
│ └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

## Alterações Técnicas

### Arquivo: `src/components/kanban/KanbanBoard.tsx`

#### 1. Nova lógica de agrupamento para renderização

Modificar o `renderData` useMemo para agrupar itens de forma diferente:

**Em vez de**:
```typescript
items.push({ type: 'column', entry, groupName, showGroupHeader: isFirstInGroup });
```

**Usar**:
```typescript
// Agrupar todas as colunas de um grupo expandido em um único item
items.push({ 
  type: 'expanded-group', 
  groupName, 
  entries: allEntriesInGroup,
  color: groupColor 
});
```

#### 2. Nova estrutura de renderização

O render passará a ter 3 tipos de itens:
- `column`: coluna sem grupo (renderiza normalmente)
- `collapsed-group`: grupo colapsado (card vertical compacto)
- `expanded-group`: **NOVO** - grupo expandido (container com header + múltiplas colunas)

```typescript
type RenderItem = 
  | { type: 'column'; entry: StageEntry }
  | { type: 'collapsed-group'; groupName: string; ... }
  | { type: 'expanded-group'; groupName: string; entries: StageEntry[]; color: string | null };
```

#### 3. Container visual para grupo expandido

```tsx
{item.type === 'expanded-group' && (
  <div className="flex flex-col rounded-lg border border-border/40 bg-muted/10 p-2">
    {/* Header do grupo */}
    <KanbanStageGroupHeader
      groupName={item.groupName}
      groupColor={item.color}
      totalLeads={item.entries.reduce((sum, e) => sum + e.entries.length, 0)}
      stageCount={item.entries.length}
      pipelineId={selectedPipelineId}
      onToggleCollapse={() => toggleGroupCollapse(item.groupName)}
      isCollapsed={false}
    />
    
    {/* Barra de cor */}
    <KanbanGroupColorBar color={item.color || '#10b981'} />
    
    {/* Colunas do grupo lado a lado */}
    <div className="flex gap-2">
      {item.entries.map(entry => (
        <KanbanColumn key={entry.stage.id} {...getColumnProps(entry)} />
      ))}
    </div>
  </div>
)}
```

### Arquivo: `src/components/kanban/KanbanStageGroup.tsx`

Ajustes menores no `KanbanStageGroupHeader`:
- Garantir que o header ocupe largura total do container pai
- Ajustar padding para acomodar múltiplas colunas abaixo

## Fluxo Visual Final

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ▼ Captação e Formalização do Contrato                     👤 1    (5 etapas)       │
│ ════════════════════════════════════════════════════════════════════════════════════│
│  Entrada      PRIMEIRA CALL    Grupo Criado    Aguardando     Contrato Assinado    │
│     0              0          + BOAS VINDAS    Assinatura           0               │
│                                     0               1                               │
└─────────────────────────────────────────────────────────────────────────────────────┘

│ ▸ Definição da Promessa │   ← Grupo colapsado (clicável para expandir)
│         1               │
```

## Resumo das Mudanças

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `KanbanBoard.tsx` | Refatorar `renderData` para agrupar colunas de grupos expandidos |
| 2 | `KanbanBoard.tsx` | Adicionar renderização de container visual para grupos expandidos |
| 3 | `KanbanStageGroup.tsx` | Ajustar `KanbanStageGroupHeader` para ocupar largura total |

## Benefícios

1. **Conexão visual clara** entre etapas do mesmo grupo
2. **Header do grupo** sempre visível acima de todas as suas etapas
3. **Experiência consistente** entre grupos expandidos e colapsados
4. **Mantém funcionalidade** de drag-and-drop entre colunas
