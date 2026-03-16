

# Edição Inline na Tabela CRM

## Objetivo

Permitir editar campos diretamente na tabela clicando na célula, como numa planilha. Sem abrir dialogs -- clicou, editou, salvou.

## Campos editáveis e tipo de input

| Campo | Tipo de edição |
|-------|---------------|
| Status | Select dropdown (opções fixas do enum) |
| Origem | Input texto (click-to-edit) |
| Closer | Input texto (click-to-edit) |
| Score | Input numérico (click-to-edit) |

Campos como Nome, WhatsApp, Email continuam abrindo o LeadEditDialog ao clicar (são dados mais sensíveis). Pipelines, Vendas, Agendamentos são read-only (dados calculados de outras tabelas).

## Implementação

### 1. Componente `InlineEditCell`

Componente reutilizável que alterna entre modo visualização e modo edição:
- **Visualização**: mostra o valor atual (texto, badge, etc.)
- **Edição**: ao clicar, transforma em input/select inline
- **Salvar**: Enter ou blur salva; Escape cancela
- Indicador visual sutil (borda pontilhada ou ícone de lápis no hover) para indicar que é editável

### 2. Componente `InlineSelectCell`

Para o campo Status -- renderiza um select dropdown nativo com as opções do enum `status_geral`.

### 3. Lógica de save

Usar `useLeadSave().saveLead()` com `{ silent: true }` para updates parciais sem toast spam. Mostrar toast apenas em erro. Após salvar, chamar `onUpdate()` para refrescar os dados.

### 4. Modificação em `LeadsCRMTable.tsx`

- Substituir as células estáticas de Status, Origem, Closer e Score pelos componentes inline
- Adicionar `e.stopPropagation()` no click das células editáveis para não abrir o LeadEditDialog
- Manter o click na linha (nas demais colunas) abrindo o dialog normalmente

### Arquivos

- **Criar**: `src/components/leads/InlineEditCell.tsx` (componente genérico texto/número)
- **Editar**: `src/components/leads/LeadsCRMTable.tsx` (integrar edição inline)

