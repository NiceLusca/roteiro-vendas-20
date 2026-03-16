

## Problema

A página de Leads atual exibe cards individuais — útil para ações rápidas, mas ineficiente para visualizar e comparar dados em massa como numa planilha. A planilha CSV tinha colunas como Data, Nome, Email, WhatsApp, Origem, Status, Closer, Valor da Venda, Recorrente, etc. O CRM precisa substituir essa visão.

## Solução

Criar uma nova aba **"Tabela CRM"** na página de Leads, com uma tabela densa e scrollável que mostra todas as informações relevantes do lead num formato de planilha. Os dados relacionados (vendas, agendamentos, pipelines) são carregados sob demanda quando a aba é selecionada.

## Mudanças

### 1. Novo componente `src/components/leads/LeadsCRMTable.tsx`

Tabela com as seguintes colunas (baseadas na planilha original + dados do CRM):

| Coluna | Fonte |
|--------|-------|
| Nome | `leads.nome` |
| WhatsApp | `leads.whatsapp` |
| E-mail | `leads.email` |
| Origem | `leads.origem` |
| Status | `leads.status_geral` |
| Closer | `leads.closer` (ou responsável primário) |
| Pipelines | `lead_pipeline_entries` (badges com nome do pipeline + etapa atual) |
| Próx. Sessão | `appointments` (próximo agendamento futuro) |
| Último Atendimento | `appointments` (último realizado) |
| Valor Venda | `deals.valor_proposto` (soma de todas as vendas ganhas) |
| Recorrente | `deals.recorrente` (badge sim/não) |
| Nº Vendas | Contagem de deals com status 'ganho' |
| Score | `leads.lead_score` |
| Tags | `lead_tag_assignments` |
| Criado em | `leads.created_at` |

Características:
- Tabela com `overflow-x-auto` para scroll horizontal
- Headers fixos com sticky positioning
- Linhas clicáveis que abrem o LeadEditDialog (reusa o que já existe no pipeline)
- Texto compacto (`text-xs`) para caber mais dados
- Colunas com largura fixa para manter alinhamento

### 2. Novo hook `src/hooks/useLeadsCRMData.ts`

Hook dedicado que carrega os dados enriquecidos para a tabela, fazendo queries otimizadas:
- Busca leads paginados (reusa a mesma query do `useOptimizedLeads`)
- Em paralelo, busca: deals, próximos agendamentos, pipeline entries (com nomes de pipeline e etapa) para os lead IDs da página atual
- Retorna maps por `lead_id` para cada tipo de dado
- Só carrega quando a aba "Tabela CRM" está ativa (`enabled` flag)

### 3. Modificação em `src/pages/Leads.tsx`

- Adicionar nova aba "Tabela CRM" nas Tabs existentes (ao lado de "Todos os Leads" e "Duplicatas")
- Renderizar `<LeadsCRMTable>` no `TabsContent` da nova aba
- Passar os mesmos filtros (search, status, score, tag) e paginação
- Lazy load: o hook só dispara queries quando `activeTab === 'table'`

### 4. Clique na linha

- Ao clicar numa linha, abre o `LeadEditDialog` existente (o mesmo usado no pipeline/kanban)
- Permite editar todas as informações sem sair da visão de tabela

## Performance

- Dados relacionados carregados apenas quando a aba está ativa
- Paginação mantida (50 leads por página)
- Queries paralelas com `Promise.all` para deals + appointments + entries
- `staleTime: 30s` para evitar re-fetches desnecessários
- Nenhum impacto na aba de cards existente

