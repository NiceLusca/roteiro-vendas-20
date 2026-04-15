

# Modificações na Tabela CRM — 4 Melhorias

## 1. Permitir datas no passado ao agendar sessões

**Problema**: Os calendários em `EnhancedAppointmentDialog.tsx` e `LeadEditDialog.tsx` bloqueiam datas anteriores a hoje com `disabled={(date) => date < new Date()}`.

**Solução**: Remover essa restrição para permitir selecionar qualquer data. Isso é necessário para registrar sessões que já aconteceram (ex: retroativamente).

**Arquivos**: `src/components/pipeline/EnhancedAppointmentDialog.tsx`, `src/components/kanban/LeadEditDialog.tsx`

---

## 2. Filtro de data específica na página de Leads

**Problema**: O filtro "Data da sessão" só tem opções pré-definidas (Hoje, Amanhã, Esta semana, etc.). Não permite escolher uma data específica como 06/04.

**Solução**: Adicionar uma opção "Data específica" no select que, ao ser selecionada, abre um datepicker (Calendar popover). A data escolhida é passada ao `useOptimizedLeads` como um novo caso no `getSessionDateRange`, filtrando appointments daquele dia exato.

**Arquivos**: `src/pages/Leads.tsx`, `src/hooks/useOptimizedLeads.ts`

---

## 3. Closer como seletor em vez de campo de texto livre

**Problema**: A coluna Closer na tabela CRM usa `InlineEditCell` (campo de texto livre), o que causa inconsistências — closers com nomes diferentes, observações misturadas com nomes, etc.

**Solução**: Trocar o `InlineEditCell` por `InlineSelectCell` com uma lista fixa de closers reais (extraídos dos perfis do sistema via tabela `profiles`). Manter `allowFreeText` como fallback para nomes que não existam na lista.

Para definir a lista, vamos buscar os nomes distintos curtos (que parecem ser closers reais: "Gabriel", "Carol", "Casagrande", "Caagrande") da tabela `profiles` — assim os closers são os próprios usuários do sistema. Adicionar um array de `closerOptions` derivado dos profiles.

**Arquivo**: `src/components/leads/LeadsCRMTable.tsx`

---

## 4. Ordenação alfabética por nome (já existe, mas precisa destaque)

**Problema**: O usuário quer ordenar por nome para identificar duplicatas. A ordenação por nome já está implementada (coluna "Nome" é clicável), mas pode não estar claro.

**Solução**: Já funciona — basta clicar no cabeçalho "Nome" para ordenar A→Z. No entanto, vou garantir que a ordenação `localeCompare` com `sensitivity: 'base'` está correta para agrupar nomes semelhantes, e adicionar um botão explícito "A→Z" próximo aos filtros da tabela CRM para tornar essa funcionalidade mais visível/acessível.

**Arquivo**: `src/components/leads/LeadsCRMTable.tsx`, `src/components/leads/CRMTableFilters.tsx`

---

## Resumo técnico

| Mudança | Arquivo(s) | Tipo |
|---------|-----------|------|
| Remover bloqueio de datas passadas | EnhancedAppointmentDialog, LeadEditDialog | Remover `disabled` prop |
| Filtro data específica | Leads.tsx, useOptimizedLeads.ts | Novo caso `specific_date` + datepicker |
| Closer como select | LeadsCRMTable.tsx | Trocar InlineEditCell → InlineSelectCell com profiles |
| Botão ordenar A→Z visível | LeadsCRMTable.tsx ou CRMTableFilters.tsx | Botão atalho para sort por nome |

