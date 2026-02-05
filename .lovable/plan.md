
# Plano: Data de Venda Obrigatória no Dialog e Webhook

## Objetivo

1. **Remover data da venda do card Kanban** (visualização fechada)
2. **Tornar data de venda obrigatória** ao marcar "Venda Confirmada" no LeadEditDialog
3. **Incluir data de venda no webhook** `comercial-metrics` para o dashboard Clarity

## Alterações

### 1. Remover data do Kanban Card (visualização fechada)

**Arquivo:** `src/types/pipelineDisplay.ts`

Remover `data_venda` dos `card_fields` do pipeline comercial:

```typescript
// ANTES
card_fields: ['nome', 'origem', 'valor_deal', 'data_venda', 'closer', 'sla'],

// DEPOIS
card_fields: ['nome', 'origem', 'valor_deal', 'closer', 'sla'],
```

A data permanece na tabela e no dialog (card aberto).

### 2. Campo de Data Obrigatório no LeadEditDialog

**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

Adicionar um seletor de data que aparece quando "Venda Confirmada" está marcada:

| Elemento | Comportamento |
|----------|---------------|
| Campo de data | Exibido condicionalmente quando `vendaConfirmada = true` |
| Validação | Bloquear salvamento se data não preenchida |
| Default | Data atual quando checkbox é marcado pela primeira vez |

Novo estado e UI:
```typescript
// Novo estado
const [dataVenda, setDataVenda] = useState<Date | undefined>(undefined);

// Ao marcar venda confirmada, definir data atual como default
useEffect(() => {
  if (vendaConfirmada && !dataVenda && !existingDeal?.data_fechamento) {
    setDataVenda(new Date());
  }
}, [vendaConfirmada]);

// Validação no handleSaveDeal
if (vendaConfirmada && !dataVenda) {
  toast.error('Selecione a data da venda');
  return;
}

// Usar dataVenda ao invés de new Date()
data_fechamento: vendaConfirmada ? dataVenda.toISOString() : null
```

### 3. Atualizar Webhook comercial-metrics

**Arquivo:** `supabase/functions/comercial-metrics/index.ts`

Atualmente o webhook busca orders filtrando por `created_at`. Precisamos incluir `data_venda` no retorno para permitir análises por data de fechamento real.

Alterações na query:
```typescript
// Adicionar data_venda na query de orders
const { data: orders } = await supabase
  .from("orders")
  .select(`
    id,
    closer,
    valor_total,
    deal_id,
    lead_id,
    data_venda,
    deals!inner(recorrente, data_fechamento),
    leads!inner(origem)
  `)
```

Alterações no processamento:
```typescript
// Adicionar ao processedOrders
const processedOrders = (orders || []).map((o: any) => ({
  ...existing,
  data_venda: o.data_venda || o.deals?.data_fechamento || null,
}));

// Incluir no array de vendas retornado
vendas: processedOrders.map(o => ({
  ...existing,
  data_venda: o.data_venda,
})),
```

## Fluxo de Dados

```text
LeadEditDialog
      │
      ▼
  ┌─────────────┐
  │ Checkbox:   │
  │ "Venda      │──────┬──────────────┐
  │ Confirmada" │      │              │
  └─────────────┘      ▼              ▼
               ┌──────────────┐  ┌─────────────┐
               │ Date Picker  │  │ Valor Venda │
               │ (Data Venda)*│  │ (R$) *      │
               └──────────────┘  └─────────────┘
                      │
                      ▼
           ┌───────────────────┐
           │ deals.data_fecham │
           │ orders.data_venda │
           └───────────────────┘
                      │
                      ▼
           ┌───────────────────┐
           │ comercial-metrics │
           │ /functions/v1     │──► Dashboard Clarity
           └───────────────────┘
```

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/types/pipelineDisplay.ts` | Remover `data_venda` dos card_fields |
| `src/components/kanban/LeadEditDialog.tsx` | Adicionar campo de data obrigatório |
| `supabase/functions/comercial-metrics/index.ts` | Incluir `data_venda` no retorno |

## Detalhes Técnicos

### Validação de Data
- Se o deal já existe e tem `data_fechamento`, pré-popular o campo
- Se é novo fechamento, usar data atual como default (mas editável)
- Impedir salvamento sem data quando "Venda Confirmada" está marcada

### Webhook - Prioridade de Data
1. `orders.data_venda` (preenchido manualmente)
2. `deals.data_fechamento` (timestamp automático)
3. `null` se nenhum disponível

### Interface do Seletor de Data
Usar o mesmo componente `Calendar` + `Popover` já utilizado na aba de Agendamentos, mantendo consistência visual.
