

# Dashboard de Atividades do Pipeline — Versão Visual

## Problema atual
A tela de atividades é apenas uma lista cronológica. Falta visão macro: quem está mais ativo, que tipos de ação dominam, qual o volume por dia, etc.

## Proposta
Adicionar uma seção de **resumo visual** acima do feed existente, usando os mesmos dados já carregados (sem queries extras). Layout em duas linhas:

### Linha 1 — KPI Cards (4 cards)
- **Total de atividades** no período
- **Usuários ativos** (quantidade distinta)
- **Movimentações** (stage_change count)
- **Comentários** (note_added count)

### Linha 2 — Dois gráficos lado a lado
- **Atividades por dia** (bar chart — volume diário no período selecionado)
- **Atividades por tipo** (donut/pie chart — distribuição por activity_type)

### Feed existente
Permanece abaixo, sem alterações na lógica. Apenas reorganizado visualmente com um separador.

## Detalhes técnicos

**Arquivo**: `src/components/pipeline/PipelineActivityDashboard.tsx`

- Usar `useMemo` para derivar os dados dos gráficos a partir do array `activities` já carregado
- Usar `recharts` (já disponível no projeto via shadcn charts) para BarChart e PieChart
- KPI cards com o componente `Card` existente
- Tudo responsivo: cards em grid 2x2 no mobile, 4 colunas no desktop; gráficos empilham no mobile
- Adicionar toggle "Resumo / Feed" ou exibir ambos (resumo colapsável)

**Nenhum arquivo novo** — tudo dentro do componente existente.
**Nenhuma query nova** — dados derivados do array `activities` já carregado.

