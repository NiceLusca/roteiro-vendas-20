

# Webhook comercial-metrics: filtrar pelo pipeline comercial + usar status_geral

## Contexto

O usuário mudou de ideia: quer manter o filtro pelo pipeline "comercial" (só leads inscritos nele), mas usar `leads.status_geral` para calcular as métricas ao invés da lógica de `etapa_ordem >= 6`.

## O que muda

A função já busca o pipeline comercial e seus entries. A mudança principal é **substituir a lógica de métricas baseada em `etapa_ordem`/`etapa_nome` pela lógica baseada em `leads.status_geral`**.

### Arquivo: `supabase/functions/comercial-metrics/index.ts`

1. **Manter** a busca do pipeline comercial e seus `lead_pipeline_entries` (filtro de escopo)
2. **Adicionar** join com `leads.status_geral` na query de entries (já faz join com `leads!inner(origem)`, basta adicionar `status_geral`)
3. **Substituir** a lógica de classificação (linhas ~290-336) de `etapa_ordem`/`etapa_nome` para `status_geral`:

| status_geral | Categoria |
|---|---|
| `agendado`, `confirmado` | Pendentes |
| `remarcou` | Pendentes (remarcou) |
| `atendido`, `ligacao_realizada` | Compareceram |
| `nao_compareceu`, `desmarcou`, `closer_ausente` | Não compareceram |
| `fechou` | Fechamento direto |
| `nao_fechou`, `ja_possui` | Perdidos pós-sessão |
| `perdido` | Perdido geral |
| `cliente` | Mentorado/Cliente |
| `em_negociacao` | Em recuperação |

4. **Atualizar** a lógica de `porCloser` e `cruzamentos` para usar `status_geral` em vez de `etapa_ordem`
5. **Manter** `por_etapa` com dados do pipeline (útil para Clarity) + adicionar `por_status` com contagem por `status_geral`
6. **Manter** toda lógica financeira (orders) inalterada
7. **Manter** batching de `lead_responsibles` para evitar URL too long

### Resultado

- Escopo: apenas leads do pipeline comercial (como antes)
- Métricas: baseadas em `status_geral` do lead (alinhado com a Tabela CRM)
- Financeiro: inalterado
- Resposta JSON: mesma estrutura, compatível com Clarity

