

# Auditoria Completa e Plano de Otimizacao Pre-Producao

## Problemas Identificados

### 1. CRITICO: Inconsistencia no `status_inscricao` (Case Sensitivity Bug)

O valor usado para `status_inscricao` varia entre `'Ativo'` e `'ativo'` em diferentes partes do codigo:

```text
'Ativo' (maiusculo) → useSupabaseLeadPipelineEntries, CRMContext, Pipelines.tsx, Leads.tsx
'ativo' (minusculo) → useLeadsCRMData.ts (linha 127), useDuplicateDetection.ts
'inativo' (minusculo) → useDuplicateDetection.ts (linha 405)
```

Isso significa que a **Tabela CRM recem-criada nao mostra os pipelines dos leads** porque consulta `'ativo'` enquanto o banco usa `'Ativo'`. A busca de duplicatas tambem tem inconsistencia usando `.or('status_inscricao.ilike.ativo,status_inscricao.ilike.Ativo')` como workaround.

**Correcao**: Padronizar para `'Ativo'` em todos os locais, que e o valor padrao usado na criacao (CRMContext e useSupabaseLeadPipelineEntries).

---

### 2. CRITICO: `useSupabaseLeads` carrega TODOS os leads na memoria

O hook `useSupabaseLeads` (src/hooks/useSupabaseLeads.ts) faz `SELECT` sem paginacao e carrega todos os leads. Conforme as memories do projeto, ele ja foi **depreciado** e substituido por `useOptimizedLeads`, `useLeadById`, etc. Porem:

- `LeadDetail.tsx` ainda importa e usa `useSupabaseLeads()`
- `LeadDetail.tsx` ja esta depreciado (rota redireciona para `/leads`), mas o arquivo com 735 linhas ainda existe

**Correcao**: Deletar `src/pages/LeadDetail.tsx` e `src/hooks/useSupabaseLeads.ts`.

---

### 3. MEDIO: `useSupabaseDeals` e `useSupabaseAppointments` carregam TODOS os registros globalmente

Dentro do `LeadEditDialog`, esses hooks carregam **todos** os deals e appointments do banco e depois filtram no client-side:

```typescript
const leadAppointments = appointments.filter(a => a.lead_id === lead.id);
const leadDeals = deals.filter(d => d.lead_id === lead.id);
```

Com milhares de deals/appointments, isso e ineficiente. Esses hooks deveriam aceitar um `leadId` e filtrar server-side.

**Correcao**: Nao incluir neste ciclo -- requer refatoracao significativa do LeadEditDialog. Documentar como divida tecnica.

---

### 4. MEDIO: `SecurityHeaders` com `Cross-Origin-Embedder-Policy: require-corp`

O header `require-corp` bloqueia recursos cross-origin (fontes do Google, imagens externas, Supabase). Em producao, isso pode quebrar a aplicacao. O CSP de producao usa `'strict-dynamic'` sem nonce real (nao ha SSR gerando nonces), o que tambem bloqueia scripts inline do Vite.

**Correcao**: Remover `Cross-Origin-Embedder-Policy` e `Cross-Origin-Resource-Policy` que sao incompativeis com um SPA que consome APIs externas. Manter o CSP apenas em desenvolvimento onde `unsafe-inline` esta permitido.

---

### 5. BAIXO: Codigo morto e redundancias

- `LeadDetail.tsx` (735 linhas) -- depreciado, rota redireciona
- `useSupabaseLeads.ts` -- depreciado conforme memory
- `src/hooks/useLeadData.ts` -- importado apenas em `LeadDetail.tsx` (depreciado)
- `src/hooks/useMultiPipeline.ts` -- importado apenas em `LeadDetail.tsx`
- `useFormAudit.ts` -- importado apenas em `LeadDetail.tsx`
- `src/pages/Intelligence.tsx` -- hidden, mas arquivo existe
- `filteredLeads = useMemo(() => leads, [leads])` em Leads.tsx -- memo inutil, retorna a mesma referencia

---

### 6. BAIXO: `useSupabaseLeadPipelineEntries` nao usa React Query

O hook principal do pipeline usa `useState/useEffect` manual com logica complexa de paginacao, deduplicacao e realtime. Diferente do restante da app que usa TanStack Query. Isso gera:
- Sem cache inteligente
- Sem stale-while-revalidate
- Logica manual de refetch complexa (700+ linhas)

**Nao refatorar agora** -- muito risco de regressao. Documentar como divida tecnica.

---

## Plano de Implementacao (Seguro, sem regressoes)

### Fase 1: Corrigir bug critico do `status_inscricao`

**Arquivo**: `src/hooks/useLeadsCRMData.ts`
- Linha 127: Trocar `.eq('status_inscricao', 'ativo')` para `.eq('status_inscricao', 'Ativo')`

**Arquivo**: `src/hooks/useDuplicateDetection.ts`
- Padronizar queries para usar `'Ativo'` em vez do workaround `.or()`

### Fase 2: Remover codigo morto

Deletar arquivos depreciados que nao sao mais referenciados por rotas ativas:
- `src/pages/LeadDetail.tsx`
- `src/hooks/useSupabaseLeads.ts`
- `src/hooks/useLeadData.ts` (se apenas usado por LeadDetail)
- `src/hooks/useMultiPipeline.ts` (se apenas usado por LeadDetail)

### Fase 3: Corrigir SecurityHeaders

- Remover `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy` que bloqueiam Supabase e Google Fonts em producao
- Remover `console.log` do efeito de producao (ja deveria ser stripped pelo terser, mas e desnecessario)
- Remover CSP meta tag em producao (CSP via meta tag nao suporta `'strict-dynamic'` sem nonce SSR real; melhor deixar o CDN/servidor configurar)

### Fase 4: Limpeza menor

- Remover `filteredLeads = useMemo(() => leads, [leads])` em Leads.tsx (memo inutil)
- Remover importacoes nao usadas (Check/CheckIcon duplicado no LeadEditDialog)

### O que NAO mudar neste ciclo

- **useSupabaseLeadPipelineEntries**: Funciona, e complexo, alto risco de regressao
- **useSupabaseDeals/Appointments global load**: Requer refatoracao do LeadEditDialog inteiro
- **Migrar para React Query universal**: Mudanca arquitetural grande demais
- **Nao mexer em RLS, edge functions ou banco** -- estao funcionando

### Estimativa

- 5 arquivos editados, 4 arquivos deletados
- Zero mudancas de banco
- Zero risco de regressao no pipeline (mudancas isoladas)

