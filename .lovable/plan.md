
# Plano: Histórico de Movimentações do Pipeline + Correção dos 3 Leads

## Resumo

1. **Corrigir os 3 leads manualmente** via SQL (reativar e mover para "Fechou")
2. **Implementar log de arquivamento** - registrar no `lead_activity_log` quando leads são descadastrados
3. **Criar mini-histórico de movimentações** - nova seção no dashboard que permite filtrar por tipo de ação (descadastramento, inscrição, transferência)

## Parte 1: Correção Imediata dos 3 Leads

Executar SQL para:
1. Reativar as entries (status = 'Ativo')
2. Mover para etapa "Fechou"
3. Criar deals com valor R$ 750,00

```sql
-- 1. Reativar e mover para "Fechou"
UPDATE lead_pipeline_entries 
SET 
  status_inscricao = 'Ativo',
  etapa_atual_id = '25221344-0e76-486c-800f-eab07e0c8c08', -- Fechou
  data_entrada_etapa = NOW(),
  updated_at = NOW()
WHERE id IN (
  '402dc789-d7d6-45d0-9401-bdd4a1fa5a9f',  -- Anna Christina
  'a97ef3ab-4ce0-4184-8c33-59e62b479fe2',  -- Fabiane Neves
  '6a631a0e-9e5c-43df-9a31-efe7b878d875'   -- Giani Cristina
);

-- 2. Criar deals (ganho) para cada lead
INSERT INTO deals (lead_id, valor_proposto, status, data_fechamento)
VALUES 
  ('5e387202-7d0f-4405-979b-6c99992394f2', 750, 'ganho', NOW()),
  ('ca6a05f2-a3f6-4ed5-8712-3ceb7652f3db', 750, 'ganho', NOW()),
  ('fc09c00d-7a71-4aa3-aacf-1d0cf09ab88e', 750, 'ganho', NOW());
```

## Parte 2: Registrar Arquivamento no Activity Log

**Arquivo:** `src/hooks/useSupabaseLeadPipelineEntries.ts`

Modificar a função `archiveEntry` para registrar a atividade:

```typescript
const archiveEntry = async (entryId: string, motivo?: string) => {
  if (!user) return false;

  try {
    // Buscar dados do entry antes de arquivar
    const { data: entry } = await supabase
      .from('lead_pipeline_entries')
      .select('lead_id, pipeline_id, etapa_atual_id')
      .eq('id', entryId)
      .maybeSingle();

    // Atualizar status
    const { error } = await supabase
      .from('lead_pipeline_entries')
      .update({
        status_inscricao: 'Arquivado',
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (error) { /* ... */ }

    // NOVO: Registrar no activity log
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    await supabase.from('lead_activity_log').insert({
      lead_id: entry.lead_id,
      pipeline_entry_id: entryId,
      activity_type: 'archive',
      details: {
        motivo: motivo || 'Sem motivo informado',
        pipeline_id: entry.pipeline_id,
        etapa_id: entry.etapa_atual_id
      },
      performed_by: user.id,
      performed_by_name: profile?.nome || profile?.full_name || user.email
    });

    // ... resto
  }
};
```

## Parte 3: Mini-Histórico de Movimentações do Pipeline

Criar um novo componente `PipelineMovementHistory` que será acessível via Settings ou Reports.

**Arquivo novo:** `src/components/pipeline/PipelineMovementHistory.tsx`

### Interface

```text
┌────────────────────────────────────────────────────────────┐
│ Histórico de Movimentações                                 │
├────────────────────────────────────────────────────────────┤
│ Filtros: [Pipeline ▼] [Tipo ▼] [Período ▼] [Buscar...]    │
│          Tipo: Descadastramentos | Inscrições | Todos      │
├────────────────────────────────────────────────────────────┤
│ 06/02 14:32  Fabiane Neves descadastrada por Maria         │
│              Motivo: Erro de cadastro                      │
│              Pipeline: Comercial → Etapa: Agendado         │
├────────────────────────────────────────────────────────────┤
│ 05/02 10:15  João Silva inscrito por Carlos                │
│              Pipeline: Comercial → Etapa: Agendado         │
├────────────────────────────────────────────────────────────┤
│ 04/02 16:45  Ana Costa transferida por Maria               │
│              De: Aquisição → Para: Comercial               │
└────────────────────────────────────────────────────────────┘
```

### Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| Filtro por tipo | Descadastramentos, Inscrições, Transferências, Mudanças de etapa |
| Filtro por pipeline | Qual pipeline afetado |
| Filtro por período | Últimos 7 dias, 30 dias, customizado |
| Busca por nome | Buscar lead ou responsável |
| Identificação do ator | Quem realizou a ação |
| Detalhes da ação | Motivo, etapa anterior/nova, timestamps |

### Localização

Adicionar nova aba em `/settings` ou botão em `/pipelines`:

```typescript
// Em src/pages/Settings.tsx ou como dialog em Pipelines.tsx
<TabsTrigger value="movements">Movimentações</TabsTrigger>
<TabsContent value="movements">
  <PipelineMovementHistory />
</TabsContent>
```

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useSupabaseLeadPipelineEntries.ts` | Log de arquivamento no activity_log |
| `src/components/pipeline/PipelineMovementHistory.tsx` | **Novo** - Componente de histórico |
| `src/pages/Settings.tsx` | Adicionar aba de Movimentações |

## Fluxo de Dados

```text
Usuário descadastra lead
         │
         ▼
┌─────────────────────────┐
│ archiveEntry()          │
│ - Update status         │
│ - Insert activity_log   │──────────┐
└─────────────────────────┘          │
                                     ▼
                          ┌──────────────────────┐
                          │  lead_activity_log   │
                          │  activity_type:      │
                          │  - 'archive'         │
                          │  - 'inscription'     │
                          │  - 'transfer'        │
                          │  - 'stage_change'    │
                          │  performed_by_name   │
                          │  details (motivo)    │
                          └──────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │ PipelineMovement     │
                          │ History              │
                          │ - Filtros            │
                          │ - Lista de eventos   │
                          └──────────────────────┘
```

## Detalhes Técnicos

### Query para o Histórico

```typescript
const fetchMovements = async (filters) => {
  let query = supabase
    .from('lead_activity_log')
    .select(`
      *,
      leads!lead_activity_log_lead_id_fkey(nome, email)
    `)
    .in('activity_type', ['archive', 'inscription', 'transfer', 'stage_change'])
    .order('created_at', { ascending: false });

  if (filters.type) {
    query = query.eq('activity_type', filters.type);
  }

  if (filters.pipelineId) {
    query = query.eq('details->pipeline_id', filters.pipelineId);
  }

  // ...
};
```

### Tipos de Atividade

| Tipo | Descrição | Dados em `details` |
|------|-----------|-------------------|
| `archive` | Descadastramento | motivo, pipeline_id, etapa_id |
| `inscription` | Inscrição | pipeline_id, etapa_inicial_id |
| `transfer` | Transferência | de_pipeline, para_pipeline |
| `stage_change` | Mudança de etapa | de_etapa, para_etapa |

## Ordem de Implementação

1. Executar SQL para corrigir os 3 leads
2. Modificar `archiveEntry` para logar no activity_log
3. Criar componente `PipelineMovementHistory`
4. Adicionar aba em Settings
5. Testar fluxo completo de descadastramento
