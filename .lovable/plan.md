

# Substituir edge functions comerciais (versão enxuta) — com correções de schema

Confirmação: **nenhum código do CRM consome `comercial-metrics`** (busca não retornou nenhum import). Apenas o Clarity externo consome. Logo, "Substituir tudo (versão enxuta)" é seguro.

Porém o código que você colou tem **3 problemas de schema** que precisam ser corrigidos antes do deploy, senão receita e closers vão zerar:

| Código colado | Coluna real no banco |
|---|---|
| `orders.total` | `orders.valor_total` |
| `order_items.valor` | `order_items.preco_unitario` |
| `appointments.start_at` | `appointments.start_at` ✅ (ok, existe) |

Além disso, o import `https://esm.sh/@supabase/supabase-js@2` deu **502 Bad Gateway** num deploy anterior (msg #46) — vou trocar por `npm:@supabase/supabase-js@2`, que é estável.

## Plano de execução

### 1. Criar `supabase/functions/comercial-leads-list/index.ts` (novo)

Aplicar exatamente o código que você colou, com 3 ajustes mínimos:
- `import { createClient } from "npm:@supabase/supabase-js@2"` (em vez de esm.sh)
- `orders.total` → `orders.valor_total`
- `order_items.valor` → `order_items.preco_unitario`

Tudo o resto fica igual: CORS completo, hierarquia `deals → lead_responsibles → leads.closer → "Não atribuído"`, suporte a POST/GET, filtros `closer[]`/`origem[]`.

### 2. Substituir `supabase/functions/comercial-metrics/index.ts` (versão enxuta)

Aplicar exatamente o código que você colou (perde `pendentes`, `por_tipo_venda`, `por_status`, `produtos`, `vendas` — confirmado que ninguém consome internamente), com os mesmos 3 ajustes:
- Import `npm:`
- `orders.total` → `orders.valor_total`
- Hierarquia idêntica à `comercial-leads-list`

### 3. Atualizar `supabase/config.toml`

Adicionar a nova função:
```toml
[functions.comercial-leads-list]
verify_jwt = false
```

### 4. Deploy + validação

- Deploy das duas funções
- Testar `OPTIONS` → deve retornar 204 com headers CORS
- Testar `POST {periodo: "mes_atual"}` em ambas
- Conferir paridade: `sum(por_closer.leads) === resumo.total_leads`
- Conferir que `por_closer.length > 1` (não só "Não atribuído")
- Conferir que nomes em `por_closer[].nome` batem com `leads[].Closer`

## Resumo técnico

| Mudança | Arquivo | Tipo |
|---|---|---|
| Criar nova função | `supabase/functions/comercial-leads-list/index.ts` | Novo arquivo |
| Substituir versão enxuta | `supabase/functions/comercial-metrics/index.ts` | Reescrever |
| Registrar verify_jwt=false | `supabase/config.toml` | Adicionar bloco |
| Deploy + curl validation | (tools) | `deploy_edge_functions` + `curl_edge_functions` |

## Riscos assumidos (versão enxuta)

- A função `comercial-metrics` deixa de retornar `pendentes`, `por_tipo_venda`, `por_status`, `produtos`, `vendas`. **Confirmado por busca no código que nenhum frontend interno usa esses campos** (apenas Clarity externo consome a função, e ele só usa os 4 blocos preservados).
- Se algum consumidor externo que não conhecemos usar esses campos, vai quebrar.

