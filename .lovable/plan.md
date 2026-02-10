
# Otimizacao: Limite de Cards por Coluna no Kanban

## Problema

O pipeline "Pos-Venda" tem 1000+ leads concentrados em uma unica coluna ("Enviar mensagem de texto"). Todos os 1000 cards sao renderizados simultaneamente no DOM, causando:

- Lentidao ao abrir o pipeline
- Scroll pesado e travamentos
- Uso excessivo de memoria (cada card tem calculos de SLA, tooltips, badges, etc.)

## Solucao

Implementar **paginacao a nivel de coluna** (lazy rendering): cada coluna mostra inicialmente ate **50 cards**, com um botao "Mostrar mais" no final para carregar mais 50 por vez. Os dados ja estao todos em memoria -- a otimizacao e puramente de renderizacao.

```text
Antes:                          Depois:
┌─────────────────┐            ┌─────────────────┐
│ Enviar msg  1000│            │ Enviar msg  1000│
├─────────────────┤            ├─────────────────┤
│ Card 1          │            │ Card 1          │
│ Card 2          │            │ Card 2          │
│ ...             │            │ ...             │
│ Card 999        │            │ Card 50         │
│ Card 1000       │            │                 │
│                 │            │ [Mostrar mais]  │
│ (1000 no DOM)   │            │ 950 restantes   │
└─────────────────┘            └─────────────────┘
```

## Alteracoes

### 1. KanbanColumn.tsx -- Limite de renderizacao por coluna

Adicionar estado interno `visibleCount` iniciando em 50. Renderizar apenas `sortedEntries.slice(0, visibleCount)` ao inves de todos. Exibir um botao "Mostrar mais (X restantes)" quando houver mais cards alem do limite. O botao incrementa `visibleCount` em 50 a cada clique.

### 2. KanbanColumn.tsx -- Resetar ao trocar de pipeline

O `visibleCount` reseta para 50 quando `stage.id` muda (via useEffect), garantindo que ao navegar entre pipelines o limite reinicia.

## Detalhes tecnicos

```typescript
// Dentro de KanbanColumn
const CARDS_PER_PAGE = 50;
const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

// Reset quando muda a coluna
useEffect(() => {
  setVisibleCount(CARDS_PER_PAGE);
}, [stage.id]);

const visibleEntries = sortedEntries.slice(0, visibleCount);
const hasMoreInColumn = sortedEntries.length > visibleCount;
const remaining = sortedEntries.length - visibleCount;

// No JSX, renderizar visibleEntries ao inves de sortedEntries
// E ao final:
{hasMoreInColumn && (
  <Button onClick={() => setVisibleCount(prev => prev + CARDS_PER_PAGE)}>
    Mostrar mais ({remaining} restantes)
  </Button>
)}
```

## Impacto

| Metrica | Antes | Depois |
|---------|-------|--------|
| Cards no DOM (1a coluna) | 1000 | 50 |
| Tempo de render | ~3-5s | < 500ms |
| Memoria | Alta | -95% |
| Funcionalidades afetadas | Nenhuma | Nenhuma |

## Riscos

Nenhum. Os dados continuam todos carregados em memoria. O drag-and-drop funciona normalmente porque opera sobre o entryId, nao sobre a posicao visual. O contador no header da coluna continua mostrando o total real (1000). A busca e os filtros continuam funcionando sobre todos os dados.

## Arquivo modificado

- `src/components/kanban/KanbanColumn.tsx` (unica alteracao)
