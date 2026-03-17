

# Filtros e Ordenação na Tabela CRM

## Situação Atual

A aba "Tabela CRM" recebe os dados já filtrados da aba "Todos os Leads" (mesmos filtros de status, score, tag e busca). Porém esses filtros ficam visíveis apenas na aba "Todos os Leads" -- ao trocar para "Tabela CRM", o usuário não vê nem controla os filtros. Além disso, não há ordenação por coluna.

## Plano

### 1. Filtros dedicados na Tabela CRM

Adicionar uma barra de filtros compacta no topo do `LeadsCRMTable` com:

| Filtro | Tipo | Motivo CRM |
|--------|------|------------|
| Busca (nome/email/whatsapp) | Input texto com debounce | Localizar lead rápido |
| Status | Select com as 10 opções existentes | Segmentar por fase comercial |
| Origem | Select com as 12 opções + "Todas" | Analisar canal de aquisição |
| Closer | Select dinâmico (valores únicos dos leads) | Filtrar por responsável comercial |
| Tag | Select com tags do sistema | Segmentar por categoria |
| Score range | Select (Alto/Médio/Baixo) ou min/max | Priorizar leads quentes |

A filtragem será **client-side** sobre os leads já carregados na página (50 por página), mantendo a paginação server-side existente. Para filtros que precisam afetar a query do servidor (status, score, tag, busca), propagar os valores para o `useOptimizedLeads` via novos props ou elevando o estado para `Leads.tsx`.

**Abordagem recomendada**: Mover os filtros existentes de status/score/tag/busca para fora das tabs (acima delas), assim ambas as abas compartilham os mesmos filtros. Adicionar filtros extras de Origem e Closer apenas na tabela CRM como filtros locais client-side.

### 2. Ordenação em todas as colunas

Adicionar sort clicável em cada cabeçalho da tabela:

- Click no header alterna: sem ordem → ascendente → descendente → sem ordem
- Indicador visual (seta ↑/↓) no header ativo
- Ordenação client-side sobre os leads da página atual (50 itens, performático)
- Colunas ordenáveis: Nome, WhatsApp, Email, Origem, Status, Closer, Pipelines (quantidade), Próx. Sessão, Último Atend., Valor Vendas, Nº Vendas, Score, Criado em

### Arquivos a modificar

1. **`src/pages/Leads.tsx`** -- Mover filtros (busca, status, score, tag) para acima das Tabs, visíveis em ambas as abas
2. **`src/components/leads/LeadsCRMTable.tsx`** -- Adicionar:
   - Filtros locais de Origem e Closer (client-side)
   - Componente de header ordenável com estado de sort
   - Lógica de ordenação com `useMemo`
3. **Criar `src/components/leads/SortableTableHead.tsx`** (opcional) -- Componente de header com ícone de seta e toggle de direção

### Detalhes técnicos

**Estado de ordenação:**
```
sortColumn: string | null
sortDirection: 'asc' | 'desc' | null
```

**Lógica de sort** via `useMemo` comparando valores com tratamento de nulls (nulls sempre por último). Para datas e números, comparação numérica; para strings, `localeCompare('pt-BR')`.

**Filtros locais** (Origem, Closer) aplicados via `useMemo` antes da ordenação, sobre os leads já paginados do servidor.

