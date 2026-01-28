

# Plano: Corrigir Atribuicao de Closer na API comercial-metrics

## Problema Raiz Identificado

A edge function `comercial-metrics` usa o campo legado `leads.closer` (texto livre) para atribuir leads aos closers, mas o sistema atual usa a tabela `lead_responsibles` para gerenciar responsaveis.

### Evidencia do Problema:

| Dado | Valor Atual | Deveria Ser |
|------|-------------|-------------|
| `leads.closer` (campo legado) | `NULL` | - |
| `lead_responsibles.is_primary` | `true` | ✓ |
| `profiles.nome` | `Lucas Nascimento` | ✓ |
| `orders.closer` | `Lucas Nascimento` | ✓ |
| **API: leads** | `0` | `1` |
| **API: fechou** | `0` | `1` |
| **API: taxa_conversao** | `0` | Deveria calcular |

### Fluxo Atual (Incorreto):
```text
lead_pipeline_entries 
    → leads.closer (NULL!)
        → closerStats.leads = 0
        → closerStats.fechou = 0
```

### Fluxo Correto:
```text
lead_pipeline_entries 
    → lead_responsibles (is_primary=true)
        → profiles.nome ("Lucas Nascimento")
            → closerStats.leads = 1
            → closerStats.fechou = 1
```

---

## Solucao

### Modificar a edge function `comercial-metrics`

**Arquivo:** `supabase/functions/comercial-metrics/index.ts`

### 1. Alterar query de entries para incluir responsaveis

DE (linha 105-114):
```typescript
const { data: entries } = await supabase
  .from("lead_pipeline_entries")
  .select(`
    id,
    lead_id,
    etapa_atual_id,
    leads!inner(origem, closer)  // ❌ usa campo texto legado
  `)
```

PARA:
```typescript
const { data: entries } = await supabase
  .from("lead_pipeline_entries")
  .select(`
    id,
    lead_id,
    etapa_atual_id,
    leads!inner(
      origem,
      lead_responsibles!inner(
        is_primary,
        profiles!inner(nome, full_name)
      )
    )
  `)
```

### 2. Atualizar processamento de entries para usar responsavel

DE (linha 124-134):
```typescript
const leadEntries = (entries || []).map((e) => {
  const stage = e.etapa_atual_id ? stageMap.get(e.etapa_atual_id) : null;
  return {
    lead_id: e.lead_id,
    etapa_nome: stage?.nome || "Sem etapa",
    etapa_ordem: stage?.ordem || 0,
    etapa_grupo: stage?.grupo || null,
    origem: e.leads?.origem || "Outro",
    closer: e.leads?.closer || null,  // ❌ usa campo texto
  };
});
```

PARA:
```typescript
const leadEntries = (entries || []).map((e) => {
  const stage = e.etapa_atual_id ? stageMap.get(e.etapa_atual_id) : null;
  
  // Buscar responsavel principal via lead_responsibles
  const primaryResp = e.leads?.lead_responsibles?.find((r: any) => r.is_primary);
  const closerName = primaryResp?.profiles?.nome 
    || primaryResp?.profiles?.full_name 
    || null;
  
  return {
    lead_id: e.lead_id,
    etapa_nome: stage?.nome || "Sem etapa",
    etapa_ordem: stage?.ordem || 0,
    etapa_grupo: stage?.grupo || null,
    origem: e.leads?.origem || "Outro",
    closer: closerName,  // ✓ usa responsavel principal
  };
});
```

### 3. Problema adicional: !inner exclui leads sem responsavel

Se usarmos `!inner` para lead_responsibles, leads sem responsavel serao excluidos. Precisamos usar JOIN normal (sem !inner) e filtrar no codigo.

Query corrigida:
```typescript
const { data: entries } = await supabase
  .from("lead_pipeline_entries")
  .select(`
    id,
    lead_id,
    etapa_atual_id,
    leads!inner(
      origem,
      lead_responsibles(
        is_primary,
        profiles(nome, full_name)
      )
    )
  `)
  .eq("pipeline_id", pipeline.id)
  .eq("status_inscricao", "Ativo");
```

---

## Resultado Esperado Apos Correcao

```json
{
  "por_closer": [
    {
      "closer": "Lucas Nascimento",
      "leads": 1,
      "compareceu": 1,
      "fechou": 1,
      "receita": 1497,
      "recorrente": 0,
      "avista": 1,
      "taxa_conversao": 100
    }
  ]
}
```

---

## Logica de Calculo Correta

| Metrica | Formula | Descricao |
|---------|---------|-----------|
| `leads` | Count de entries com este closer | Total de leads atribuidos |
| `compareceu` | Count onde ordem >= 6 e !perdido_sem_sessao e !mentorado | Leads que fizeram sessao |
| `fechou` | `recorrente + avista` | Total de vendas |
| `receita` | Sum de orders.valor_total | Faturamento gerado |
| `taxa_conversao` | `(fechou / compareceu) * 100` | % de conversao |

---

## Arquivo a Modificar

| # | Arquivo | Alteracao |
|---|---------|-----------|
| 1 | `supabase/functions/comercial-metrics/index.ts` | - Alterar query para usar lead_responsibles |
|   |                                                 | - Atualizar mapeamento de entries |
|   |                                                 | - Garantir calculo correto de fechou e taxa_conversao |

---

## Impacto

Apos a correcao, o dashboard Clarity tera:

- ✅ Ranking de Closers por Faturamento
- ✅ Taxa de Conversao por Closer  
- ✅ Participacao na Receita por Closer
- ✅ Comparativo de Performance entre Closers
- ✅ Analise por Produto

