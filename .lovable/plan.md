

# Diagnóstico: alinhar `comercial-metrics` à Tabela CRM como fonte de verdade

## Princípio

A **Tabela CRM** (`useLeadsCRMData` + `LeadsCRMTable`) é a fonte de verdade. Todo número que o Clarity 2 mostra precisa bater exatamente com o que essa tabela exibe quando filtrada pelo mesmo período.

Hoje a `comercial-metrics` resolve closer/produto/receita por uma lógica própria, então diverge da Tabela CRM. O ajuste é fazer a edge function reproduzir **a mesma resolução** da tabela.

## Como a Tabela CRM resolve cada coluna

| Coluna | Resolução |
|---|---|
| **Closer** | `lead.closer` (texto livre, editado inline na tabela) |
| **Origem** | `lead.origem` |
| **Status** | `lead.status_geral` |
| **Valor Vendas** | soma de `orders.valor_total` do lead, sem depender de `deals.closer_id` |
| **Breakdown** | quebrado por `orders.closer` (texto da order) |
| **Data da venda** | `orders.data_venda` |

Pontos-chave que a Tabela CRM **não** usa:
- não usa `deals.closer_id` para atribuição de closer
- não usa `lead_responsibles` para closer
- closer é sempre o texto humano salvo em `leads.closer` ou `orders.closer`

## Ajustes na `comercial-metrics`

### 1. Atribuição de closer = mesma da Tabela CRM
Trocar a hierarquia atual por:

```text
Para vendas (orders):  orders.closer  -> leads.closer  -> "Não atribuído"
Para leads:            leads.closer   -> "Não atribuído"
```

Remover completamente o uso de:
- `deals.closer_id`
- `lead_responsibles.is_primary`

Motivo: a Alessandra (SDR) vira closer porque opera o CRM e cai em `deals.closer_id`. A Tabela CRM ignora isso, então a métrica também precisa ignorar.

### 2. Receita por closer = mesma da Tabela CRM
Para cada `order` no período (`data_venda` no mês), atribuir receita ao closer resolvido pela regra acima.

Resultado esperado:
- se a Tabela CRM mostra a venda atribuída a "Lucas", o Clarity 2 mostra "Lucas"
- se mostra "Não atribuído", o Clarity 2 mostra "Não atribuído"
- nunca mais a Alessandra vai aparecer com 29 vendas só por ter operado o sistema

### 3. Lista de vendas = espelho da Tabela CRM
`metricas.lista_vendas` passa a ser construída exatamente como o breakdown da Tabela CRM:

```text
para cada order no período:
  closer = orders.closer || leads.closer || "Não atribuído"
  produto = order_items.produto || deal_products.produto || deals.produto_id (nome) || "Sem produto"
  recorrente = order_items tem recorrencia ≠ Nenhuma || deals.recorrente
  valor = orders.valor_total
  data_venda = orders.data_venda
```

### 4. Total de leads e conversão = mesma base da Tabela CRM
- `total_leads` = leads do pipeline comercial criados no período (= linhas da Tabela CRM filtradas pelo período)
- `por_closer[].leads` = `count` agrupado por `leads.closer` (mesmo agrupamento da tabela)
- `taxa_conversao` por closer = `fechou / leads` usando o mesmo `leads.closer` em ambos os lados

Isso elimina a distorção atual de "5 leads vs 29 vendas no mesmo closer".

### 5. Logs de paridade com Tabela CRM
Adicionar log no formato:

```text
[comercial-metrics v7] paridade-tabela-crm
  total_leads_pipeline:     125
  closers_distintos_leads:  ['Lucas', 'Carol', 'Vagner', ..., 'Não atribuído']
  closers_distintos_vendas: ['Lucas', 'Carol', ..., 'Não atribuído']
  receita_por_closer:       Lucas=R$X / Carol=R$Y / ...
```

Assim qualquer divergência futura entre Tabela CRM e Clarity 2 fica óbvia no log.

## Sincronização ao salvar venda no CRM

**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

Para que novas vendas sigam a mesma fonte de verdade:

1. **Não atribuir** automaticamente o usuário logado como `deals.closer_id` (esse campo deixa de ser usado pela métrica, mas vale parar de poluir).
2. Ao confirmar venda, gravar `orders.closer` com o **mesmo texto** que está em `leads.closer` no momento — assim a venda já nasce alinhada à coluna Closer da Tabela CRM.
3. Continuar sincronizando `order_items` com `deal_products` (já feito na v6).

## Critérios de aceite

1. O Clarity 2 lista os mesmos closers que aparecem na coluna **Closer** da Tabela CRM filtrada pelo mesmo período.
2. A receita por closer no Clarity 2 == soma de **Valor Vendas** da Tabela CRM agrupado por **Closer** (com breakdown).
3. Alessandra deixa de aparecer como dona de 29 vendas (a menos que a coluna Closer da Tabela CRM realmente diga isso).
4. Conversões impossíveis (>100%) somem porque leads e vendas usam o mesmo agrupamento.
5. `lista_vendas.length` == número de vendas vistas no breakdown da Tabela CRM no período.
6. Novas vendas registradas pelo `LeadEditDialog` já gravam `orders.closer` igual a `leads.closer`.

## Resumo técnico

| Arquivo | Mudança |
|---|---|
| `supabase/functions/comercial-metrics/index.ts` | Trocar resolução de closer para `orders.closer → leads.closer`; remover uso de `deals.closer_id` e `lead_responsibles`; agrupar `por_closer` pelo mesmo texto da coluna Closer da Tabela CRM; logs de paridade |
| `src/components/kanban/LeadEditDialog.tsx` | Parar de auto-atribuir `deals.closer_id`; gravar `orders.closer` espelhando `leads.closer` no momento da venda |

Sem alteração de schema, sem nova edge function, sem migração de dados (a correção fica retroativa porque passa a ler os campos que a Tabela CRM já usa).

