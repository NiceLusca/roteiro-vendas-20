
# Plano: Endpoint de Métricas Comerciais com Desdobramento por Origem, Produto e Tipo de Venda

## Resumo

Criar um Edge Function `comercial-metrics` que retorna métricas completas do pipeline comercial, incluindo:
- Aproveitamento do closer por **origem do lead**
- Aproveitamento do closer por **produto vendido**
- Distinção entre vendas **recorrentes** vs **à vista**
- Cálculos de comparecimento baseados em progressão de etapas

---

## Estrutura de Dados Disponível

### Tabelas Envolvidas

| Tabela | Campos Relevantes | Uso |
|--------|-------------------|-----|
| `leads` | `origem`, `closer`, `nome` | Origem do lead, closer responsável |
| `deals` | `recorrente`, `valor_proposto`, `status`, `produto_id` | Flag recorrente, valor, status |
| `orders` | `closer`, `valor_total`, `status_pagamento`, `lead_id`, `deal_id` | Vendas confirmadas |
| `order_items` | `pedido_id`, `produto_id`, `preco_unitario`, `recorrencia` | Produtos vendidos, flag recorrência |
| `products` | `id`, `nome`, `preco` | Nome do produto |
| `lead_pipeline_entries` | `lead_id`, `pipeline_id`, `etapa_atual_id`, `status_inscricao` | Posição no pipeline |
| `pipeline_stages` | `id`, `nome`, `ordem`, `grupo` | Etapas do pipeline |

### Origens de Leads Existentes
- "Outro" (822 leads)
- "Agenda Oceano" (124 leads)
- "Mentoria Society - GAB" (10 leads)
- Outros

### Campos de Recorrência
- `deals.recorrente` (boolean) - Flag de venda recorrente
- `order_items.recorrencia` (text) - Tipo de recorrência por item

---

## Métricas Detalhadas do Endpoint

### 1. Métricas Gerais (já planejadas)
```json
{
  "total_leads": 150,
  "mentorados": 8,
  "leads_validos": 142,
  "sessoes": { "compareceram": 72, "nao_compareceram": 22, "taxa_comparecimento": 76.6 },
  "vendas": { "fechamentos": 25, "taxa_conversao": 34.72 },
  "financeiro": { "receita_total": 125000, "ticket_medio": 5000 }
}
```

### 2. Por Closer x Origem (NOVO)
```json
"por_closer_origem": [
  {
    "closer": "Gabriel",
    "origens": [
      { "origem": "Agenda Oceano", "leads": 20, "compareceu": 16, "fechou": 5, "receita": 25000, "taxa_conversao": 31.25 },
      { "origem": "Mentoria Society", "leads": 15, "compareceu": 12, "fechou": 4, "receita": 20000, "taxa_conversao": 33.33 }
    ]
  }
]
```

### 3. Por Closer x Produto (NOVO)
```json
"por_closer_produto": [
  {
    "closer": "Gabriel",
    "produtos": [
      { "produto": "Mentoria Society", "vendas": 8, "receita": 40000, "recorrente": 3, "avista": 5 },
      { "produto": "Consultoria", "vendas": 4, "receita": 20000, "recorrente": 2, "avista": 2 }
    ]
  }
]
```

### 4. Vendas Recorrente vs À Vista (NOVO)
```json
"por_tipo_venda": {
  "recorrente": { "total": 12, "receita": 60000, "ticket_medio": 5000 },
  "avista": { "total": 13, "receita": 65000, "ticket_medio": 5000 }
},
"por_closer_tipo": [
  { "closer": "Gabriel", "recorrente": 5, "avista": 7, "receita_recorrente": 25000, "receita_avista": 35000 }
]
```

---

## Detalhes Técnicos

### Arquivo: `supabase/functions/comercial-metrics/index.ts`

A Edge Function irá:

1. **Buscar pipeline comercial** pelo slug "comercial"
2. **Buscar todas as etapas** e classificar por grupo/ordem
3. **Buscar lead_pipeline_entries** com JOIN em leads para obter origem e closer
4. **Calcular comparecimento** por progressão de etapas:
   - Compareceu = etapas ordem >= 6 (exceto "Perdido sem sessão" e "Mentorado")
   - Não compareceu = "No-Show" + "Perdido sem sessão"
5. **Buscar deals e orders** para dados financeiros
6. **Cruzar com order_items + products** para desdobrar por produto
7. **Agrupar por dimensões**: closer, origem, produto, tipo de venda

### Consultas SQL Principais

**1. Leads por etapa com origem e closer:**
```sql
SELECT 
  ps.nome as etapa,
  ps.ordem,
  ps.grupo,
  l.origem,
  l.closer,
  COUNT(lpe.id) as total
FROM lead_pipeline_entries lpe
JOIN pipeline_stages ps ON lpe.etapa_atual_id = ps.id
JOIN leads l ON lpe.lead_id = l.id
WHERE lpe.pipeline_id = :pipeline_id
  AND lpe.status_inscricao = 'Ativo'
GROUP BY ps.id, l.origem, l.closer
```

**2. Vendas por closer, produto e tipo:**
```sql
SELECT 
  o.closer,
  p.nome as produto,
  d.recorrente,
  COUNT(o.id) as vendas,
  SUM(o.valor_total) as receita
FROM orders o
JOIN deals d ON o.deal_id = d.id
JOIN leads l ON o.lead_id = l.id
LEFT JOIN order_items oi ON oi.pedido_id = o.id
LEFT JOIN products p ON oi.produto_id = p.id
WHERE o.status_pagamento = 'pago'
  AND o.created_at BETWEEN :data_inicio AND :data_fim
GROUP BY o.closer, p.nome, d.recorrente
```

**3. Vendas por closer e origem:**
```sql
SELECT 
  o.closer,
  l.origem,
  COUNT(o.id) as vendas,
  SUM(o.valor_total) as receita
FROM orders o
JOIN leads l ON o.lead_id = l.id
WHERE o.status_pagamento = 'pago'
  AND o.created_at BETWEEN :data_inicio AND :data_fim
GROUP BY o.closer, l.origem
```

### Modificar: `supabase/config.toml`

```toml
[functions.comercial-metrics]
verify_jwt = false
```

---

## Estrutura Completa da Resposta

```json
{
  "periodo": { "inicio": "2026-01-01", "fim": "2026-01-28" },
  "pipeline": { "id": "uuid", "nome": "Comercial" },
  "metricas": {
    "resumo": {
      "total_leads": 150,
      "mentorados": 8,
      "leads_validos": 142
    },
    "sessoes": {
      "pendentes": { "agendado": 25, "confirmado": 18, "remarcou": 5, "total": 48 },
      "compareceram": 72,
      "nao_compareceram": 22,
      "taxa_comparecimento": 76.6
    },
    "vendas": {
      "fechamentos_diretos": 20,
      "fechamentos_recuperacao": 5,
      "total_fechamentos": 25,
      "taxa_conversao": 34.72,
      "perdidos_pos_sessao": 30,
      "perdidos_sem_sessao": 10
    },
    "financeiro": {
      "receita_total": 125000,
      "ticket_medio": 5000
    },
    "por_tipo_venda": {
      "recorrente": { "vendas": 12, "receita": 60000 },
      "avista": { "vendas": 13, "receita": 65000 }
    },
    "por_etapa": [
      { "etapa": "Agendado", "grupo": "Pré-Sessão", "total": 25 }
    ],
    "por_closer": [
      { 
        "closer": "Gabriel", 
        "leads": 45, 
        "compareceu": 38, 
        "fechou": 12, 
        "receita": 60000,
        "taxa_conversao": 31.58,
        "recorrente": 5,
        "avista": 7
      }
    ],
    "por_origem": [
      { "origem": "Agenda Oceano", "leads": 50, "fechou": 10, "receita": 50000 }
    ],
    "por_produto": [
      { "produto": "Mentoria Society", "vendas": 15, "receita": 75000 }
    ],
    "cruzamentos": {
      "closer_x_origem": [
        { "closer": "Gabriel", "origem": "Agenda Oceano", "leads": 20, "fechou": 5, "receita": 25000 }
      ],
      "closer_x_produto": [
        { "closer": "Gabriel", "produto": "Mentoria Society", "vendas": 8, "receita": 40000, "recorrente": 3, "avista": 5 }
      ],
      "closer_x_tipo_venda": [
        { "closer": "Gabriel", "recorrente": 5, "avista": 7, "receita_recorrente": 25000, "receita_avista": 35000 }
      ]
    }
  },
  "gerado_em": "2026-01-28T19:30:00.000Z"
}
```

---

## Arquivos a Criar/Modificar

| # | Arquivo | Acao |
|---|---------|------|
| 1 | `supabase/functions/comercial-metrics/index.ts` | Criar (Edge Function completa) |
| 2 | `supabase/config.toml` | Adicionar configuracao da funcao |

---

## Uso pelo n8n/Clarity

O endpoint pode ser consumido de duas formas:

**Via n8n (polling periódico):**
```text
Trigger (Cron 1h) 
  → HTTP GET /functions/v1/comercial-metrics?periodo=mes_atual
  → Transform JSON 
  → Update Google Sheets/Clarity
```

**Chamada direta:**
```
GET https://szuqdfakikbotidnxxvw.supabase.co/functions/v1/comercial-metrics
GET https://szuqdfakikbotidnxxvw.supabase.co/functions/v1/comercial-metrics?periodo=mes_anterior
GET https://szuqdfakikbotidnxxvw.supabase.co/functions/v1/comercial-metrics?data_inicio=2026-01-01&data_fim=2026-01-31
```

---

## Observações Importantes

1. **Closer vem de duas fontes**: 
   - `leads.closer` para o responsável pelo lead
   - `orders.closer` para quem efetivamente fechou a venda
   - O endpoint usará `orders.closer` para métricas de vendas

2. **Recorrência tem duas fontes**:
   - `deals.recorrente` (boolean) - Flag simples
   - `order_items.recorrencia` (text) - Detalhes por item
   - O endpoint priorizará `deals.recorrente` para agregação

3. **Produtos podem estar em dois lugares**:
   - `deals.produto_id` (single product)
   - `deal_products` / `order_items` (multi-product)
   - O endpoint suportará ambos os cenários

4. **Sem dados históricos ainda**: As tabelas `orders` e `deal_products` estão vazias. O endpoint funcionará assim que houver dados ou quando os dados forem migrados da planilha.
