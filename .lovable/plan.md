
# Plano: Período de Pesquisa Totalmente Customizável

## Situação Atual

A API já aceita alguns parâmetros:
- `periodo`: mes_atual, mes_anterior, ultimos_30_dias, ultimos_7_dias
- `data_inicio`: data específica (YYYY-MM-DD)
- `data_fim`: data específica (YYYY-MM-DD)

## Melhorias Propostas

### Novos Períodos Pré-definidos

| Parâmetro | Descrição |
|-----------|-----------|
| `ano_atual` | 1º de janeiro até hoje |
| `ano_anterior` | Todo o ano passado |
| `trimestre_atual` | Início do trimestre até hoje |
| `trimestre_anterior` | Trimestre anterior completo |
| `semana_atual` | Segunda-feira até hoje |
| `hoje` | Apenas o dia atual |
| `ontem` | Apenas o dia anterior |
| `personalizado` | Usar data_inicio e data_fim obrigatórios |

### Parâmetros Relativos (Novo)

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `ultimos_dias` | Número de dias para trás | `ultimos_dias=15` |
| `ultimos_meses` | Número de meses para trás | `ultimos_meses=3` |

### Exemplos de Uso

```
# Últimos 90 dias
/comercial-metrics?ultimos_dias=90

# Últimos 6 meses
/comercial-metrics?ultimos_meses=6

# Período específico
/comercial-metrics?data_inicio=2025-10-01&data_fim=2025-12-31

# Trimestre atual
/comercial-metrics?periodo=trimestre_atual

# Ano inteiro de 2025
/comercial-metrics?data_inicio=2025-01-01&data_fim=2025-12-31
```

---

## Alterações Técnicas

### Arquivo: `supabase/functions/comercial-metrics/index.ts`

#### Linhas 44-65: Expandir lógica de parsing de período

```typescript
// Parse query parameters
const url = new URL(req.url);
const periodo = url.searchParams.get("periodo") || "mes_atual";
let dataInicio = url.searchParams.get("data_inicio");
let dataFim = url.searchParams.get("data_fim");
const ultimosDias = url.searchParams.get("ultimos_dias");
const ultimosMeses = url.searchParams.get("ultimos_meses");

const now = new Date();
const today = now.toISOString().split("T")[0];

// Prioridade: datas específicas > ultimos_dias/meses > periodo pré-definido
if (dataInicio && dataFim) {
  // Usar datas fornecidas diretamente
  console.log(`[comercial-metrics] Usando período customizado: ${dataInicio} a ${dataFim}`);
} else if (ultimosDias) {
  const dias = parseInt(ultimosDias, 10);
  dataInicio = new Date(now.getTime() - dias * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  dataFim = today;
} else if (ultimosMeses) {
  const meses = parseInt(ultimosMeses, 10);
  const startDate = new Date(now.getFullYear(), now.getMonth() - meses, 1);
  dataInicio = startDate.toISOString().split("T")[0];
  dataFim = today;
} else {
  // Períodos pré-definidos
  switch (periodo) {
    case "mes_atual":
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      dataFim = today;
      break;
    case "mes_anterior":
      dataInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      dataFim = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      break;
    case "ultimos_30_dias":
      dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dataFim = today;
      break;
    case "ultimos_7_dias":
      dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dataFim = today;
      break;
    case "hoje":
      dataInicio = today;
      dataFim = today;
      break;
    case "ontem":
      const ontem = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dataInicio = ontem.toISOString().split("T")[0];
      dataFim = dataInicio;
      break;
    case "semana_atual":
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
      dataInicio = monday.toISOString().split("T")[0];
      dataFim = today;
      break;
    case "trimestre_atual":
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      dataInicio = new Date(now.getFullYear(), quarterMonth, 1).toISOString().split("T")[0];
      dataFim = today;
      break;
    case "trimestre_anterior":
      const prevQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const prevQuarterYear = prevQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = prevQuarterMonth < 0 ? prevQuarterMonth + 12 : prevQuarterMonth;
      dataInicio = new Date(prevQuarterYear, adjustedMonth, 1).toISOString().split("T")[0];
      dataFim = new Date(prevQuarterYear, adjustedMonth + 3, 0).toISOString().split("T")[0];
      break;
    case "ano_atual":
      dataInicio = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      dataFim = today;
      break;
    case "ano_anterior":
      dataInicio = new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0];
      dataFim = new Date(now.getFullYear() - 1, 11, 31).toISOString().split("T")[0];
      break;
    default:
      // Fallback para mês atual
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      dataFim = today;
  }
}
```

---

## Validação de Parâmetros

Adicionar validação para evitar erros:

```typescript
// Validar formato de datas
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (dataInicio && !dateRegex.test(dataInicio)) {
  return new Response(
    JSON.stringify({ error: "data_inicio deve estar no formato YYYY-MM-DD" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
if (dataFim && !dateRegex.test(dataFim)) {
  return new Response(
    JSON.stringify({ error: "data_fim deve estar no formato YYYY-MM-DD" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Validar que data_inicio <= data_fim
if (dataInicio && dataFim && dataInicio > dataFim) {
  return new Response(
    JSON.stringify({ error: "data_inicio não pode ser maior que data_fim" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Resposta Aprimorada

Incluir informações do período na resposta:

```typescript
periodo: {
  tipo: periodo,
  inicio: dataInicio,
  fim: dataFim,
  dias_totais: Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1,
},
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/comercial-metrics/index.ts` | Expandir parsing de período com novos tipos e parâmetros relativos |

---

## Resultado Esperado

A API aceitará qualquer combinação de período:

| URL | Período Resultante |
|-----|-------------------|
| `?periodo=trimestre_atual` | Q1 2026 (01/01 - hoje) |
| `?ultimos_dias=45` | Últimos 45 dias |
| `?ultimos_meses=3` | Últimos 3 meses |
| `?data_inicio=2025-06-01&data_fim=2025-12-31` | 01/06/2025 a 31/12/2025 |
| `?periodo=ano_anterior` | Todo o ano de 2025 |

O Clarity Dashboard poderá então enviar qualquer período desejado para análises históricas e comparativas.
