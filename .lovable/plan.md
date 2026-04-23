
## Correção do `comercial-metrics`: números do mês e fallback de produto/recorrência

### Diagnóstico confirmado
O Clarity 2 está lendo o payload novo corretamente, mas os dados ainda saem errados por 2 causas no backend atual:

1. **A função mistura “lead do mês” com “venda do mês”.**
   - Hoje ela filtra os leads por `leads.created_at` e depois soma os pedidos desses leads.
   - Isso explica exatamente o número atual do Clarity:
     - `5 fechamentos / R$ 3.643,80`
   - No banco, usando `orders.data_venda` no mês atual para o pipeline comercial, o total real é:
     - `29 fechamentos / R$ 20.222,10`

2. **Os pedidos deste mês não têm `order_items`.**
   - Por isso o backend devolve:
     - `produto = "Sem produto"`
     - `recorrente = false`
     - `receita_recorrente = 0`
   - O dado de produto/recorrência está sendo salvo no CRM principalmente em:
     - `deals.recorrente`
     - `deals.produto_id`
     - `deal_products -> products`

### O que será ajustado

#### 1. Separar universos de cálculo dentro da edge function
**Arquivo:** `supabase/functions/comercial-metrics/index.ts`

A função passará a calcular em duas bases diferentes:

- **Base de leads do período**  
  Continua usando `leads.created_at` no período para:
  - `metricas.resumo.total_leads`
  - `metricas.resumo.mentorados`
  - `metricas.resumo.leads_validos`
  - `metricas.sessoes`
  - `metricas.por_etapa`
  - `metricas.por_status`
  - `por_closer[].leads`
  - `por_origem[].leads`

- **Base de vendas do período**  
  Passa a usar `orders.data_venda` no período para:
  - `metricas.vendas.total_fechamentos`
  - `metricas.vendas.fechamentos_diretos`
  - `metricas.financeiro.*`
  - `metricas.por_tipo_venda`
  - `metricas.lista_vendas`
  - `metricas.por_produto`
  - `metricas.cruzamentos.closer_x_produto`
  - `metricas.cruzamentos.closer_x_tipo_venda`
  - parte de receita/fechamento em `metricas.por_closer`
  - parte de receita/fechamento em `metricas.por_origem`

Resultado esperado:
- cards de topo continuam mostrando entrada de leads do mês
- vendas e faturamento passam a mostrar o fechamento real do mês

#### 2. Reescrever a base de vendas para usar `orders.data_venda`
Em vez de:
```text
leads criados no mês -> pegar orders desses leads
```

A função passará a usar:
```text
orders com data_venda no mês
-> join leads
-> restringir ao pipeline comercial
-> restringir a leads com status_geral='fechou'
```

Isso deve corrigir imediatamente:
- `total_fechamentos`: de 5 para 29
- `receita_total`: de R$ 3.643,80 para R$ 20.222,10

#### 3. Adicionar fallback real para produto e recorrência
Como os pedidos atuais não possuem `order_items`, a função precisa montar produto/tipo de venda com fallback na estrutura comercial já existente.

Ordem de prioridade para cada venda:
```text
order_items -> deal_products -> deals.produto_id -> "Sem produto"
order_items.recorrencia -> deals.recorrente -> false
```

Isso permitirá preencher corretamente:
- `metricas.por_produto`
- `metricas.lista_vendas[].produto`
- `metricas.lista_vendas[].recorrente`
- `metricas.financeiro.receita_recorrente`
- `metricas.financeiro.receita_avista`
- `metricas.por_tipo_venda`
- cruzamentos por produto/tipo

#### 4. Manter a hierarquia de closer, mas calcular receita por closer na base de vendas
A resolução de closer permanece compatível com a regra já adotada:
```text
deals.closer_id -> lead_responsibles(is_primary) -> leads.closer -> "Não atribuído"
```

Mas a parte de **receita e fechamentos por closer** passará a ser agregada sobre as vendas do mês, e não sobre os leads criados no mês.

Observação importante:
- pelos dados atuais, as 29 vendas do mês resolvem para **Alessandra** via `deals.closer_id`
- então, após o ajuste, o valor total deve subir para R$ 20.222,10, mas a distribuição por closer pode continuar concentrada nela se esse for o dado salvo hoje

#### 5. Fortalecer logs e paridade
Adicionar logs explícitos para mostrar os dois critérios lado a lado:
```text
por_lead_created_at: fechou=5 receita=3643.8
por_data_venda:      fechou=29 receita=20222.1
retornado:           por_data_venda
```

E manter validações de paridade para:
- `receita_avista + receita_recorrente == receita_total`
- `vendas_avista + vendas_recorrente == total_fechamentos`
- `lista_vendas.length == total_fechamentos`

### Ajuste complementar para não reincidir no problema
**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

Hoje, ao confirmar venda, o CRM cria/atualiza `orders`, mas **não grava `order_items`** junto do pedido.  
Será incluída uma sincronização para que, ao salvar uma venda com produtos selecionados:

- os produtos do deal sejam copiados para `order_items`
- a recorrência do deal (`vendaRecorrente`) seja refletida nos itens do pedido

Isso não corrige histórico antigo sozinho, mas evita que novas vendas continuem chegando ao dashboard como:
- `Sem produto`
- `avista`
- `receita_recorrente = 0`

### Critérios de aceite
1. `metricas.vendas.total_fechamentos` do mês atual passa para **29**.
2. `metricas.financeiro.receita_total` passa para **R$ 20.222,10**.
3. `lista_vendas.length == 29`.
4. `por_produto` deixa de vir apenas com `"Sem produto"` quando houver produto no deal/deal_products.
5. `receita_recorrente` e `vendas_recorrente` passam a refletir `order_items` ou fallback de `deals.recorrente`.
6. `por_closer` continua compatível no contrato, mas receita/fechamentos passam a ser calculados na base de vendas do mês.
7. Logs da função mostram claramente a diferença entre `lead.created_at` e `orders.data_venda`.

## Resumo técnico

| Arquivo | Mudança |
|---|---|
| `supabase/functions/comercial-metrics/index.ts` | Separar base de leads e base de vendas; usar `orders.data_venda`; fallback de produto/recorrência por `deal_products`/`deals`; ajustar agregações e logs |
| `src/components/kanban/LeadEditDialog.tsx` | Ao confirmar venda, sincronizar `order_items` com os produtos/recorrência do deal para evitar novos pedidos sem item |

Sem alteração de schema e sem nova edge function.
