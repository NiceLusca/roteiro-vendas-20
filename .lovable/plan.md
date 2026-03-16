

# Plano de Correção - Fase 2

## Problemas encontrados

### 1. CRITICO: Default do banco `status_inscricao` é `'ativo'` (minusculo), codigo usa `'Ativo'`

O schema do Supabase mostra: `status_inscricao | Default: 'ativo'::text`. Mas todo o codigo insere e filtra por `'Ativo'` (maiusculo). Se alguma insercao nao setar explicitamente o valor (ex: webhook, edge function, trigger), o default do banco sera `'ativo'` e esses registros ficam invisiveis no sistema.

**Correcao**: Migration SQL para alterar o default da coluna para `'Ativo'` e corrigir registros existentes com `'ativo'` minusculo.

```sql
ALTER TABLE lead_pipeline_entries 
  ALTER COLUMN status_inscricao SET DEFAULT 'Ativo';

UPDATE lead_pipeline_entries 
  SET status_inscricao = 'Ativo' 
  WHERE status_inscricao = 'ativo';
```

### 2. MEDIO: `useLeadData.ts` e `useMultiPipeline.ts` NAO sao codigo morto

No plano anterior, esses hooks foram marcados para deletar como "so usados por LeadDetail". Isso estava **errado**:

- `useLeadData` e importado por `src/pages/Deals.tsx` (usa `saveDeal`) e `src/pages/Orders.tsx` (usa `saveOrder`)
- `useMultiPipeline` e importado por `src/hooks/useBulkLeadImport.ts` (usa `inscribePipeline`)

Ambos estao ativos e em uso. Nenhuma acao necessaria (nao foram deletados na fase anterior).

### 3. BAIXO: Pagina `Intelligence.tsx` orfã

`src/pages/Intelligence.tsx` existe mas nao tem rota no `App.tsx` e nao e acessada de nenhum lugar. Nao causa erro, mas e codigo morto.

**Correcao**: Deletar `src/pages/Intelligence.tsx`. Os componentes que ele importa (`IntelligentDashboard`, `PredictiveAnalytics`, `SmartWorkflowAutomation`) tambem devem ser verificados — se so sao usados por `Intelligence.tsx`, deletar tambem.

### 4. BAIXO: Pagina `Analytics.tsx` orfã

`src/pages/Analytics.tsx` existe mas nao tem rota no `App.tsx`. Os componentes que usa (`BusinessIntelligenceDashboard`, `RevenueAnalytics`, `ConversionFunnelAnalytics`) sao tambem usados por `Reports.tsx`, entao os componentes ficam — so a pagina e deletada.

### 5. BAIXO: Comentarios orfãos no `App.tsx`

Linhas referenciando `LeadDetail` como comentarios — limpar para manter o codigo limpo.

---

## Resumo de mudancas

| Tipo | Arquivo | Acao |
|------|---------|------|
| Migration SQL | `lead_pipeline_entries` | Corrigir default e dados existentes |
| Deletar | `src/pages/Intelligence.tsx` | Orfã, sem rota |
| Deletar | `src/pages/Analytics.tsx` | Orfã, sem rota |
| Verificar e deletar | `src/components/intelligence/*` | Se so usado por Intelligence.tsx |
| Editar | `src/App.tsx` | Remover comentarios orfãos sobre LeadDetail |

**Zero risco de regressao**: a migration SQL so altera o default e normaliza dados existentes. Os arquivos deletados nao sao referenciados por nenhuma rota ativa.

