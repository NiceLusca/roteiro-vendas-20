

# Correcao: filtrar leads que passaram pelo pipeline comercial

## Problema

A mudanca anterior para consultar direto da tabela `leads` incluiu todos os leads do CRM, inclusive quem nunca agendou ou passou pelo pipeline comercial. O dashboard comercial deve mostrar apenas leads que tiveram (ou tem) inscricao no pipeline comercial.

## Solucao: abordagem hibrida

1. Buscar o `pipeline_id` do pipeline com slug `"comercial"`
2. Buscar todos os `lead_id` distintos da tabela `lead_pipeline_entries` onde `pipeline_id` = comercial (sem filtro de status_inscricao, para incluir historico completo)
3. Filtrar a tabela `leads` apenas para esses IDs, aplicando tambem o filtro de periodo (`created_at`)
4. Continuar usando `status_geral` para todas as metricas (sem mudar logica de classificacao)

## Arquivo: `supabase/functions/comercial-metrics/index.ts`

### Mudanca na secao de query principal (linhas 161-168)

Substituir a query direta por:

```typescript
// 1. Buscar pipeline comercial
const { data: pipeline } = await supabase
  .from("pipelines")
  .select("id")
  .eq("slug", "comercial")
  .single();

if (!pipeline) {
  return new Response(
    JSON.stringify({ error: "Pipeline comercial não encontrado" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// 2. Buscar lead_ids que passaram pelo pipeline comercial (qualquer status)
const allPipelineLeadIds: string[] = [];
let from = 0;
const PAGE = 1000;
while (true) {
  const { data } = await supabase
    .from("lead_pipeline_entries")
    .select("lead_id")
    .eq("pipeline_id", pipeline.id)
    .range(from, from + PAGE - 1);
  if (!data || data.length === 0) break;
  data.forEach(d => allPipelineLeadIds.push(d.lead_id));
  if (data.length < PAGE) break;
  from += PAGE;
}
const uniqueLeadIds = [...new Set(allPipelineLeadIds)];

// 3. Buscar leads desses IDs, filtrados por periodo (em chunks)
const allLeads: any[] = [];
for (let i = 0; i < uniqueLeadIds.length; i += CHUNK_SIZE) {
  const chunk = uniqueLeadIds.slice(i, i + CHUNK_SIZE);
  const { data } = await supabase
    .from("leads")
    .select("id, nome, origem, status_geral, closer, created_at")
    .in("id", chunk)
    .gte("created_at", `${dataInicio}T00:00:00`)
    .lte("created_at", `${dataFim}T23:59:59`);
  if (data) allLeads.push(...data);
}
const leads = allLeads;
```

### Restante do codigo

Sem mudancas. A variavel `leads` continua alimentando o mesmo fluxo de metricas por `status_geral`, closers, origens, financeiro, etc.

### Indicador na resposta

Mudar `fonte` para `"leads_pipeline_comercial"` para deixar claro o escopo.

### Deploy

Deploy automatico da edge function.

## Resultado

- Escopo: apenas leads que passaram pelo pipeline comercial (historico completo, nao so ativos)
- Metricas: baseadas em `status_geral` do lead
- Periodo: filtro por `created_at` do lead
- Financeiro: inalterado

