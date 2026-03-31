

# Migrar comercial-metrics para fonte direta: tabela `leads`

## O que muda

A API deixa de depender do pipeline comercial (`lead_pipeline_entries`) e passa a consultar diretamente a tabela `leads`, usando `status_geral` e `created_at` como filtros principais.

## Arquivo: `supabase/functions/comercial-metrics/index.ts`

### 1. Remover busca do pipeline e entries

Eliminar as queries de:
- `pipelines` (slug = "comercial")
- `pipeline_stages`
- `lead_pipeline_entries`

### 2. Nova query principal: tabela `leads`

```sql
SELECT id, nome, origem, status_geral, closer, created_at
FROM leads
WHERE created_at >= dataInicio AND created_at <= dataFim
```

- Filtro de periodo agora aplica-se aos **leads** (pela `created_at`), nao apenas aos orders
- Todos os leads do CRM entram, independente de pipeline

### 3. Closer via `lead_responsibles`

Manter a logica de batching (chunks de 100) para buscar o responsavel primario de cada lead. Sem mudanca aqui, so muda o conjunto de `leadIds` (agora vem da query de leads, nao de entries).

### 4. Metricas por `status_geral`

Mesma logica atual de classificacao (compareceu, no-show, fechou, perdido, etc.) - ja esta baseada em `status_geral`, nao precisa mudar.

### 5. Remover `por_etapa` e `por_status` baseado em pipeline

- Remover `por_etapa` (nao ha mais etapas)
- Manter `por_status` (contagem por `status_geral`)

### 6. Financeiro (orders) - sem mudanca

A query de orders continua filtrando por periodo e `status_pagamento = 'pago'`. Nenhuma alteracao.

### 7. Breakdowns mantidos

- `por_closer` - sem mudanca (ja usa `status_geral`)
- `por_origem` - sem mudanca (ja usa normalizeOrigem)
- `por_produto` - sem mudanca (vem de orders)
- `cruzamentos` - sem mudanca
- `lista_vendas` - sem mudanca

### 8. Resposta JSON

Remover `pipeline` do response (nao ha mais pipeline). Manter toda a estrutura de `metricas`.

### 9. Deploy

Deploy automatico da edge function.

## Resultado

- Fonte: tabela `leads` filtrada por periodo
- Metricas: baseadas em `status_geral` (como ja esta)
- Financeiro: inalterado
- Dashboard Clarity recebe os mesmos campos, com dados mais abrangentes

