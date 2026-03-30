

# Plano de Correção: comercial-metrics

## Problemas identificados

1. **Bug critico: Closers zerados** - A query de `lead_responsibles` (linha 236-244) envia 611 UUIDs em um unico `.in()`, gerando URL too long. O erro e silenciado e resulta em `closerMap` vazio, zerando todos os dados por closer.

2. **Contagem dupla de "perdido"** - Leads com `status_geral = 'perdido'` sao contados em `naoCompareceram` E em `perdidosSemSessao` (linhas 347-350). Isso infla a metrica de nao-comparecimento. Um lead "perdido" pode nunca ter tido sessao, logo nao deveria contar como "nao compareceu".

3. **Query de order_responsibles sem batching** - A query de responsaveis para orders (linha 390-398) tambem nao tem batching. Funciona agora com poucos orders, mas pode quebrar se crescer.

## Correções

### Arquivo: `supabase/functions/comercial-metrics/index.ts`

**Correção 1 - Batching na query de lead_responsibles (linhas 234-257)**

Substituir a query unica por um loop em chunks de 100 IDs:

```
const CHUNK_SIZE = 100;
const allResponsibles = [];
for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
  const chunk = leadIds.slice(i, i + CHUNK_SIZE);
  const { data, error } = await supabase
    .from("lead_responsibles")
    .select(...)
    .in("lead_id", chunk)
    .eq("is_primary", true);
  if (!error && data) allResponsibles.push(...data);
}
```

**Correção 2 - Remover contagem dupla de "perdido" (linhas 347-350)**

Mudar o case `'perdido'` para contar apenas em `perdidosSemSessao`, sem incrementar `naoCompareceram`:

```
case 'perdido':
  perdidosSemSessao++;
  break;
```

**Correção 3 - Batching na query de order_responsibles (linhas 388-398)**

Aplicar o mesmo padrao de chunks de 100 para `orderLeadIds`.

## Resultado esperado

- Closers populados corretamente no dashboard Clarity
- Metrica de "nao compareceram" reflete apenas no-shows reais
- Queries robustas para qualquer volume de leads

