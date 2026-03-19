

# Mover botão de excluir para a linha da Tabela CRM

## O que muda

1. **Remover** o botão "Excluir" do `LeadEditDialog` (header do dialog) — não aparece mais em nenhum contexto
2. **Remover** o item "Excluir Lead" do `KanbanCardMenu` (menu ⋮ do card no pipeline)
3. **Remover** props `onDeleteLead`/`isAdmin` da cadeia Kanban (`Pipelines.tsx` → `KanbanBoard` → `KanbanColumn` → `KanbanCard` → `KanbanCardMenu`)
4. **Adicionar** um ícone de lixeira (🗑) na linha de cada lead na `LeadsCRMTable`, visível apenas para admins, que abre o `LeadDeleteConfirmDialog` (checkbox + botão, já existente)

## Arquivos afetados

- **`src/components/kanban/LeadEditDialog.tsx`** — remover botão Excluir do header e props relacionadas
- **`src/components/kanban/KanbanCardMenu.tsx`** — remover item "Excluir Lead" e props `onDeleteLead`/`isAdmin`
- **`src/components/kanban/KanbanCard.tsx`** — remover props `onDeleteLead`/`isAdmin`
- **`src/components/kanban/KanbanColumn.tsx`** — remover props `onDeleteLead`/`isAdmin`
- **`src/components/kanban/KanbanBoard.tsx`** — remover props `onDeleteLead`/`isAdmin`
- **`src/pages/Pipelines.tsx`** — remover state de delete e `LeadDeleteConfirmDialog` do pipeline
- **`src/components/leads/LeadsCRMTable.tsx`** — adicionar coluna de ações com ícone de lixeira (admin only) em cada linha; manter dialog de delete já existente

## Detalhe da coluna de ações na tabela

Adicionar uma última coluna "Ações" com um botão de ícone `Trash2` por linha, que ao clicar (com `e.stopPropagation()` para não abrir o dialog de edição) abre o `LeadDeleteConfirmDialog`. Visível apenas quando `isAdmin === true`.

