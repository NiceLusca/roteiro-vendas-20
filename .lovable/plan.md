
# Plano: Adicionar Campo "Data da Venda" na Visualização

## Contexto do Problema

Atualmente a data de fechamento da venda (`data_fechamento` no `deals` e `data_venda` no `orders`) existe no banco de dados, mas **não é exibida** na interface do pipeline. Isso dificulta identificar rapidamente quando uma venda foi confirmada e verificar se os dados estão corretos.

## Solução Proposta

Adicionar a coluna **"Data Venda"** nas visualizações do pipeline (Kanban e Tabela) quando a configuração `show_deals` estiver ativa.

## Alterações

### 1. Atualizar Tipos de Exibição

**Arquivo:** `src/types/pipelineDisplay.ts`

| Campo | Valor |
|-------|-------|
| Novo field key | `data_venda` |
| Label | "Data Venda" |
| Source | `deals` |
| Format | `date` |

Adicionar também ao `DealDisplayInfo`:
- `data_fechamento?: string | null`

### 2. Atualizar Hook de Dados

**Arquivo:** `src/hooks/usePipelineDisplayData.ts`

Incluir `data_fechamento` na query de deals:
```sql
SELECT id, lead_id, valor_proposto, valor_recorrente, status, motivo_perda, data_fechamento
FROM deals
WHERE lead_id IN (...)
```

### 3. Atualizar Visualização em Tabela

**Arquivo:** `src/components/pipeline/PipelineTableView.tsx`

Adicionar coluna "Data Venda" que exibe:
- Data formatada (dd/MM/yyyy) quando `status = 'ganho'`
- Badge "Pendente" quando ainda não confirmado

### 4. Atualizar Kanban Card (Opcional)

**Arquivo:** `src/components/kanban/KanbanCard.tsx`

Para vendas confirmadas, exibir badge com a data:
- "Fechou em 03/02" (formato compacto)

### 5. Atualizar Config Comercial

**Arquivo:** `src/types/pipelineDisplay.ts`

Adicionar `data_venda` aos campos padrão do pipeline comercial:
```typescript
COMERCIAL_DISPLAY_CONFIG: {
  card_fields: ['nome', 'origem', 'valor_deal', 'data_venda', 'closer', 'sla'],
  table_columns: ['nome', 'contato', 'etapa', 'origem', 'valor_deal', 'data_venda', ...],
  ...
}
```

## Visualização Esperada

### Tabela do Pipeline Comercial

| Lead | Etapa | Valor | Data Venda | Closer |
|------|-------|-------|------------|--------|
| Brendon Khelf | Fechou | R$ 997 | 03/02/2026 | João |
| Lana Quincó | Fechou | R$ 997 | 01/02/2026 | Maria |
| Diana Rocha | Fechou | R$ 497 | - | Pedro |

### Benefícios

1. **Visibilidade imediata** de quando cada venda foi confirmada
2. **Fácil verificação** de dados entre planilhas e sistema
3. **Identificação rápida** de vendas não confirmadas (sem data)
4. **Ordenação** por data de venda para relatórios

## Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/types/pipelineDisplay.ts` | Adicionar campo e tipo |
| `src/hooks/usePipelineDisplayData.ts` | Incluir campo na query |
| `src/components/pipeline/PipelineTableView.tsx` | Nova coluna |
| `src/components/kanban/KanbanCard.tsx` | Badge opcional |

## Detalhes Técnicos

O campo `data_fechamento` já existe na tabela `deals` e é preenchido automaticamente quando o checkbox "Venda Confirmada" é marcado no `LeadEditDialog`. A alteração é puramente de exibição - nenhuma mudança no banco de dados é necessária.
