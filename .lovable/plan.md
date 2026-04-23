

# Corrigir leitura de closer da venda: tratar `"Não atribuído"` como vazio

## Causa raiz confirmada por query no banco

Rodei direto no `orders` do mês:

| order_closer | lead_closer |
|---|---|
| `"Não atribuído"` | Lucas Casagrande Sampaio |
| `"Não atribuído"` | Vagner |
| `"Não atribuído"` | Gabriel |
| `"Não atribuído"` | Uilma |
| `"Não atribuído"` | Carolaine Santana |
| ... (todas as 29) | ... |

A coluna `orders.closer` foi populada com a **string literal** `"Não atribuído"` em vez de ficar `NULL`. Resultado: a hierarquia da v7

```
orders.closer  ->  leads.closer  ->  "Não atribuído"
```

nunca cai no `leads.closer`, porque `orders.closer` "tem valor" (mesmo sendo o texto sentinel).

A Tabela CRM funciona porque ela lê `leads.closer` direto. O Clarity 2 não, porque a edge function lê `orders.closer` primeiro.

## Correção

### 1. Edge function: tratar valores sentinel como vazio
**Arquivo:** `supabase/functions/comercial-metrics/index.ts`

Ajustar `resolveSaleCloser` para considerar como “sem valor”:
- `null`
- string vazia
- `"Não atribuído"` (case-insensitive, com/sem acento)
- `"nao atribuido"`
- `"-"`

```text
fromOrder = orders.closer (após normalização)
se fromOrder for sentinel/vazio -> usar leads.closer
se leads.closer também for sentinel/vazio -> "Não atribuído"
```

Mesma normalização aplicada em:
- `metricas.por_closer`
- `metricas.lista_vendas[].closer`
- `metricas.cruzamentos.closer_x_*`
- ranking de receita por closer

### 2. LeadEditDialog: nunca gravar o texto sentinel
**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

Ao registrar venda:
- se `leads.closer` estiver vazio/sentinel, gravar `orders.closer = NULL` (não a string `"Não atribuído"`).
- se tiver nome real, gravar exatamente o texto de `leads.closer`.

Isso evita que novas vendas continuem nascendo com o sentinel poluindo a base.

### 3. Backfill dos 29 pedidos do mês (e histórico)
Migração SQL única para limpar o sentinel já gravado:

```sql
UPDATE orders o
SET closer = l.closer
FROM leads l
WHERE o.lead_id = l.id
  AND (o.closer IS NULL 
       OR btrim(o.closer) = '' 
       OR lower(unaccent(btrim(o.closer))) IN ('nao atribuido','não atribuído','-'))
  AND l.closer IS NOT NULL
  AND btrim(l.closer) <> '';
```

E zerar para `NULL` os casos em que `leads.closer` também está vazio:

```sql
UPDATE orders
SET closer = NULL
WHERE lower(unaccent(btrim(closer))) IN ('nao atribuido','não atribuído','-');
```

### 4. Logs de paridade reforçados
Adicionar no log da v8:

```
sentinel_orders_substituidos_por_lead_closer: N
orders_sem_closer_resolvido: M
```

Para flagrar regressão futura imediatamente.

## Critérios de aceite

1. Ranking do Clarity 2 mostra Lucas, Vagner, Gabriel, Uilma, Carolaine, Casagrande etc — não mais "Não atribuído" concentrando 29 vendas.
2. Receita por closer = soma de `orders.valor_total` agrupada pelo `leads.closer` quando `orders.closer` está sentinel.
3. Número total continua **29 vendas / R$ 20.222,10**.
4. Apenas vendas que realmente não têm nem `orders.closer` nem `leads.closer` aparecem como "Não atribuído".
5. Novas vendas registradas pelo `LeadEditDialog` deixam de gravar o texto `"Não atribuído"` em `orders.closer`.
6. Conversões por closer voltam a fazer sentido (>0% e ≤100% para cada um).

## Resumo técnico

| Arquivo | Mudança |
|---|---|
| `supabase/functions/comercial-metrics/index.ts` | Normalizar valores sentinel (`null`, `""`, `"Não atribuído"`, `"-"`) como vazio em todos os pontos de resolução de closer |
| `src/components/kanban/LeadEditDialog.tsx` | Gravar `NULL` em vez de `"Não atribuído"` quando não houver closer real |
| Migração SQL | Backfill de `orders.closer` puxando de `leads.closer` quando o atual for sentinel |

Sem alteração de schema, sem nova edge function. Correção retroativa via migração + correção prospectiva via UI/edge function.

