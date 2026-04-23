

# Edge Function `comercial-metrics` v5 — payload completo para o Clarity 2

## Problema

Hoje a função devolve um payload enxuto (`resumo`, `financeiro`, `por_closer`, `por_origem`) e calcula receita errada (soma `orders.valor_total` de **todos** os leads, não só dos `fechou`). Resultado no Clarity 2: R$ 3.643 incorretos, 0 leads válidos, 0 vendas à vista/recorrente, gráficos zerados.

## Solução

Reescrever `supabase/functions/comercial-metrics/index.ts` (v5) devolvendo o contrato nested completo dentro de `metricas`, mantendo os campos legados no nível raiz para compatibilidade com qualquer outro consumidor.

## Mudanças no cálculo

### Novas regras de negócio
- **Mentorado**: `status_geral ∈ {cliente, mentorado}` — separar do `total_leads`.
- **Lead válido**: lead não-mentorado que tem appointment.
- **Compareceu**: `atendido | ligacao_realizada | fechou | nao_fechou | ja_possui | perdido`.
- **No-show**: `nao_compareceu | closer_ausente`.
- **Pendente**: `agendado | confirmado | remarcou`.
- **Fechou**: estritamente `status_geral = 'fechou'` (não inclui mais `cliente`).
- **Receita**: soma de `orders.valor_total` **somente para leads fechados**.
- **Tipo de venda**: recorrente se algum `order_items.recorrencia` ≠ `Nenhuma`/`null`; à vista caso contrário.
- **Perdido pós-sessão**: `nao_fechou | ja_possui | perdido` com appointment.
- **Perdido sem sessão**: mesmos status sem appointment.

### Novas queries
1. `appointments` — já existe, mas precisa também guardar `start_at` para sessões pendentes/no-show.
2. `orders` — buscar `id, lead_id, valor_total, data_venda` + nested `order_items(recorrencia, products(nome))` para classificar tipo de venda e quebrar por produto.
3. Closer hierarchy — mantida igual (`deals → lead_responsibles → leads.closer → "Não atribuído"`).
4. `lead_pipeline_entries` — buscar também `data_inscricao` para filtro de período (alternativa ao `leads.created_at`, manter `leads.created_at` por enquanto).

### Sem `recuperação` confiável
Não há tabela de log de mudanças de `status_geral`. Vamos devolver `fechamentos_diretos = total_fechamentos` e `fechamentos_recuperacao = 0` (documentado nos critérios de aceite do prompt).

## Estrutura do novo payload

```text
{
  periodo: { inicio, fim, data_inicio, data_fim, tipo, dias_totais },
  pipeline: { id, nome },
  fonte: "supabase-direct",
  gerado_em: ISO,
  // legado (raiz) — mantém compatibilidade
  resumo: { total_leads, agendamentos, atendimentos, fechamentos },
  financeiro: { receita_total, ticket_medio },
  por_closer: [...],
  por_origem: [...],
  // novo nested completo
  metricas: {
    resumo: { total_leads, mentorados, leads_validos },
    sessoes: { pendentes:{agendado,confirmado,remarcou,total},
               compareceram, nao_compareceram, no_show, taxa_comparecimento },
    vendas: { fechamentos_diretos, fechamentos_recuperacao, total_fechamentos,
              taxa_conversao, perdidos_pos_sessao, perdidos_sem_sessao,
              em_recuperacao },
    financeiro: { receita_total, ticket_medio,
                  receita_recorrente, receita_avista,
                  ticket_medio_recorrente, ticket_medio_avista,
                  vendas_recorrente, vendas_avista },
    por_tipo_venda: { recorrente:{vendas,receita}, avista:{vendas,receita} },
    por_closer:  [{ closer, nome, leads, compareceu, fechou, receita,
                    taxa_conversao, recorrente, avista,
                    receita_recorrente, receita_avista }],
    por_origem:  [{ origem, nome, leads, compareceu, fechou, receita }],
    por_etapa:   [{ etapa, grupo, total, ordem }],
    por_status:  [{ status, total, grupo }],
    por_produto: [{ produto, vendas, receita }],
    lista_vendas:[{ id, closer, valor, origem, recorrente, produto, data_venda }],
    cruzamentos: { closer_x_origem:[...],
                   closer_x_produto:[...],
                   closer_x_tipo_venda:[...] }
  }
}
```

## Critérios de aceite

1. Resposta inclui **todas** as chaves de `metricas`, mesmo vazias.
2. `metricas.resumo.leads_validos > 0` quando há leads com appointment.
3. `metricas.financeiro.receita_total` = soma de `orders.valor_total` **apenas dos leads `fechou`**.
4. `receita_avista + receita_recorrente == receita_total` (paridade exata).
5. `por_tipo_venda.avista.vendas + recorrente.vendas == vendas.total_fechamentos`.
6. `lista_vendas.length == vendas.total_fechamentos`.
7. `por_etapa` cobre 100% dos leads (`sum(total) == resumo.total_leads`).
8. Filtros `closer[]`/`origem[]` continuam funcionando e recalculam todos os blocos.
9. Logs mostram paridade fechamentos+receita por closer.

## Resumo técnico

| Arquivo | Tipo de mudança |
|---|---|
| `supabase/functions/comercial-metrics/index.ts` | Reescrita completa para v5 (nested `metricas` + raiz legada) |

Sem alteração de schema, sem nova edge function, sem mudança de RLS. Deploy automático após save.

