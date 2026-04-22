
# Diagnóstico: os closers não “somem” no CRM — o Clarity 2 está lendo o contrato errado

## Causa real no projeto Clarity 2

Os closers já existem nas edge functions do CRM, mas o **Clarity 2** tem dois problemas de integração:

1. **`useComercialMetrics.ts` espera um payload antigo**
   - O Clarity 2 espera:
     ```ts
     { periodo, metricas: { por_closer, por_origem, ... } }
     ```
   - A versão enxuta atual de `comercial-metrics` retorna:
     ```ts
     { periodo, resumo, financeiro, por_closer, por_origem }
     ```
   - Resultado: o hook tenta acessar `result.metricas...`, quebra, e cai no fallback de cache.

2. **Os nomes dos campos mudaram**
   - O Clarity 2 espera:
     - `por_closer[].closer`
     - `por_origem[].origem`
   - A edge function atual entrega:
     - `por_closer[].nome`
     - `por_origem[].nome`
   - Resultado: mesmo quando a API responde, os dropdowns ficam vazios ou incompletos se não houver normalização.

3. **O cache mascara o erro**
   - `useComercialMetrics.ts` salva e reaproveita `localStorage`.
   - Quando a resposta nova não encaixa no shape antigo, o hook falha e reutiliza cache velho.
   - Isso explica por que o Clarity 2 pode continuar mostrando uma lista antiga/incompleta de closers.

4. **Há um bug separado em filtros baseados em leads**
   - Em `src/components/Comparison/ComparisonFilters.tsx`, o código usa `lead.closer` minúsculo.
   - O lead normalizado em `useCrmLeadsData.ts` expõe `Lead.Closer` maiúsculo.
   - Resultado: nessa tela, os closers também não entram corretamente.

## O que corrigir no Clarity 2

### 1. Normalizar a resposta da `comercial-metrics`
**Arquivo:** `src/hooks/useComercialMetrics.ts`

Criar uma camada de adaptação logo após `response.json()` para aceitar **ambos os contratos**:

- contrato antigo: `result.metricas`
- contrato novo enxuto: `result.resumo`, `result.financeiro`, `result.por_closer`, `result.por_origem`

A normalização deve converter para o shape interno esperado pelo app:
- `por_closer[].nome` → `por_closer[].closer`
- `por_origem[].nome` → `por_origem[].origem`
- encapsular resposta enxuta em `metricas`

Exemplo de alvo interno:
```ts
{
  periodo,
  metricas: {
    resumo,
    financeiro,
    por_closer: normalizedClosers,
    por_origem: normalizedOrigens,
    por_etapa: [],
    por_tipo_venda: { recorrente: { vendas: 0, receita: 0 }, avista: { vendas: 0, receita: 0 } },
    vendas: defaultVendas,
    sessoes: defaultSessoes,
    cruzamentos: defaultCruzamentos,
    por_produto: [],
    lista_vendas: []
  }
}
```

### 2. Tornar o hook resiliente a aliases de campo
**Arquivos:**
- `src/hooks/useComercialMetrics.ts`
- opcionalmente `src/hooks/useFilteredMetrics.ts`

Mesmo com a normalização principal, deixar fallback defensivo:
- closer: `c.closer ?? c.nome`
- origem: `o.origem ?? o.nome`

Isso evita nova quebra se a API variar de novo.

### 3. Invalidar o cache antigo
**Arquivo:** `src/hooks/useComercialMetrics.ts`

Bump de versão do cache:
- de `comercial_metrics_cache`
- para algo como `comercial_metrics_cache_v2`

Isso força o Clarity 2 a parar de reutilizar payloads antigos incompatíveis.

### 4. Corrigir os filtros que usam leads normalizados
**Arquivo:** `src/components/Comparison/ComparisonFilters.tsx`

Trocar:
```ts
allLeads.map(lead => lead.closer)
```
por:
```ts
allLeads.map(lead => lead.Closer || lead.closer)
```

E manter o mesmo padrão para origem, se necessário:
```ts
lead.Origem || lead.origem
```

## Resultado esperado

Depois dessas correções:

- o **Dashboard** do Clarity 2 volta a ler os closers vindos de `comercial-metrics`
- o filtro **Closer** da barra unificada passa a listar os closers reais do período
- o app deixa de depender de cache velho para “funcionar”
- as telas que usam `allLeads` também passam a enxergar corretamente `Lead.Closer`

## Observação importante sobre contagem de closers

Há duas fontes com recortes diferentes:

- **Dashboard / métricas**: usa `comercial-metrics` com o período selecionado (ex.: “Este Mês”) → tende a mostrar os **8 closers** do período
- **Leads / comparação baseada em lista**: `useCrmLeadsData()` carrega `ano_atual` → pode mostrar **mais nomes** (ex.: 14) por incluir todo o ano e variações de nome

Ou seja: se o objetivo é o dropdown do Dashboard, o problema principal é **contrato + cache**.  
Se o objetivo é padronizar todos os dropdowns do sistema para a mesma lista, aí o passo seguinte é unificar também a normalização de nomes entre métricas e leads.

## Arquivos a ajustar

| Arquivo | Mudança |
|---|---|
| `src/hooks/useComercialMetrics.ts` | Adaptar payload enxuto para o shape esperado e mapear `nome -> closer/origem` |
| `src/hooks/useComercialMetrics.ts` | Versionar/invalidate cache antigo |
| `src/hooks/useFilteredMetrics.ts` | Adicionar fallback defensivo para aliases (`closer/nome`, `origem/nome`) |
| `src/components/Comparison/ComparisonFilters.tsx` | Usar `Lead.Closer` em vez de `lead.closer` |

## Critérios de aceite

1. O filtro **Closer** no Dashboard do Clarity 2 deixa de depender de cache antigo.
2. `availableClosers` passa a ser preenchido com nomes reais vindos de `comercial-metrics`.
3. O refresh manual deixa de cair silenciosamente em fallback por incompatibilidade de shape.
4. A tela de comparação por closer passa a listar nomes vindos de `Lead.Closer`.
