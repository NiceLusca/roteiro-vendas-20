
# Plano: Configuração de Grupos de Etapas Ultra User-Friendly

## Contexto Atual

Atualmente, para configurar grupos nas etapas de um pipeline, o usuário precisa:
1. Ir em Configurações → Pipelines
2. Expandir o pipeline desejado
3. Clicar em "Editar" em cada etapa individualmente
4. Preencher os campos "Grupo Visual" e "Cor do Grupo" manualmente
5. Repetir para CADA etapa do pipeline

**Problema**: Para um pipeline com 8-13 etapas, isso significa 8-13 operações manuais, repetindo o mesmo nome de grupo e cor várias vezes. Muito trabalhoso e propenso a erros de digitação.

---

## Solução Proposta: "Configurador de Grupos em Lote"

Criar um novo dialog acessível via botão "Configurar Grupos" no cabeçalho de cada pipeline expandido, permitindo:
- Visualizar TODAS as etapas de uma só vez
- Atribuir grupos e cores via drag-and-drop ou seleção múltipla
- Preview em tempo real do visual do Kanban
- Aplicar em lote com um clique

---

## Design da Interface

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configurar Grupos - Pipeline Comercial                              [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📋 ETAPAS SEM GRUPO                    🎨 GRUPOS DEFINIDOS                │
│  ┌──────────────────────┐               ┌─────────────────────────────────┐│
│  │ □ Entrada            │               │ + Novo Grupo                   ││
│  │ □ Contato 1          │     ───►      ├─────────────────────────────────┤│
│  │ □ Contato 2          │               │ 🔵 PRÉ-SESSÃO                  ││
│  │ □ Contato 3          │               │   ├─ Agendado                   ││
│  │ □ Contato 4          │               │   ├─ Confirmado                 ││
│  │ □ Fechou             │               │   ├─ Remarcou                   ││
│  │ □ Declinou           │               │   └─ No-Show                    ││
│  │ □ Perdido            │               │                                 ││
│  └──────────────────────┘               │ 🟣 DECISÃO                      ││
│                                          │   ├─ Fechou                     ││
│  [Selecionar Todas]                      │   ├─ Não Fechou (quente)        ││
│                                          │   └─ Não Fechou (frio)          ││
│  ───────────────────────────────────────│                                  ││
│                                          │ 🟢 DESFECHO                     ││
│  ⚡ AÇÃO RÁPIDA                          │   ├─ Cliente                    ││
│  ┌────────────────────────────────────┐ │   └─ Perdido                    ││
│  │ Grupo: [___________] Cor: [🔵▼]   │ └─────────────────────────────────┘│
│  │ [Aplicar às 3 etapas selecionadas] │                                    │
│  └────────────────────────────────────┘                                    │
│                                                                             │
│  ──────────────────── PREVIEW KANBAN ───────────────────────               │
│  ┌──────────────────────────────────────────────────────────┐              │
│  │ 🔵 PRÉ-SESSÃO (4) │ 🟣 DECISÃO (3) │ 🟢 DESFECHO (2)    │              │
│  │    colapsável     │   colapsável    │   colapsável       │              │
│  └──────────────────────────────────────────────────────────┘              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                              [Cancelar]  [Salvar Grupos]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Uso (Super Simples)

### Cenário 1: Pipeline Novo (sem grupos)
1. Usuário acessa Configurações → Pipelines
2. Expande o pipeline desejado
3. Clica no botão **"🎨 Configurar Grupos"**
4. Vê todas as etapas listadas à esquerda
5. Clica em **"+ Novo Grupo"**, digita "Prospecção", escolhe cor azul
6. Seleciona etapas "Entrada", "Contato 1", "Contato 2" (checkbox)
7. Clica **"Mover para Prospecção"** ou arrasta
8. Repete para outros grupos
9. Clica **"Salvar Grupos"** - pronto!

### Cenário 2: Pipeline Existente (ajustar grupos)
1. Abre o Configurador de Grupos
2. Vê grupos já definidos à direita com suas etapas
3. Arrasta etapas entre grupos para reorganizar
4. Clica no nome do grupo para renomear ou mudar cor
5. Salva

---

## Funcionalidades Principais

| Feature | Descrição |
|---------|-----------|
| **Seleção Múltipla** | Checkbox para selecionar várias etapas de uma vez |
| **Drag & Drop** | Arrastar etapas para dentro de grupos |
| **Criar Grupo** | Botão "+ Novo Grupo" com nome e cor |
| **Editar Grupo** | Clique no nome para renomear, clique na cor para trocar |
| **Excluir Grupo** | Remove grupo mas mantém etapas (voltam para "Sem Grupo") |
| **Preview** | Mostra como ficará o Kanban com os grupos |
| **Salvar em Lote** | Uma única operação salva todas as etapas modificadas |

---

## Componentes a Criar

### 1. `StageGroupConfigDialog.tsx`
Novo componente que encapsula toda a lógica:

```typescript
interface StageGroupConfigDialogProps {
  pipelineId: string;
  pipelineName: string;
  stages: PipelineStage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: StageGroupUpdate[]) => Promise<boolean>;
}

interface StageGroupUpdate {
  stageId: string;
  grupo: string | null;
  cor_grupo: string | null;
}
```

### 2. `GroupCard.tsx`
Card visual para cada grupo definido, com:
- Header colorido com nome do grupo
- Lista de etapas pertencentes ao grupo
- Botão de editar/excluir grupo
- Drop zone para receber etapas arrastadas

### 3. `UnassignedStagesList.tsx`
Lista de etapas que ainda não têm grupo:
- Checkboxes para seleção múltipla
- Botão "Selecionar Todas"
- Indicador visual de drag source

---

## Alterações em Arquivos Existentes

### `src/components/settings/PipelineManager.tsx`
Adicionar:
- Estado para controlar o dialog de grupos
- Botão "🎨 Configurar Grupos" no header do pipeline expandido
- Import e renderização do `StageGroupConfigDialog`

```typescript
// Novo botão ao lado de "Nova Etapa"
<Button 
  size="sm" 
  variant="outline"
  onClick={(e) => {
    e.stopPropagation();
    setSelectedPipelineForGroups(pipeline);
    setIsGroupConfigDialogOpen(true);
  }}
>
  <Palette className="w-3 h-3 mr-1" />
  Configurar Grupos
</Button>
```

### `src/hooks/useSupabasePipelineStages.ts`
Adicionar função para salvar grupos em lote:

```typescript
const batchUpdateStageGroups = async (updates: StageGroupUpdate[]) => {
  // Atualiza todos os stages em uma única transação
  for (const update of updates) {
    await supabase
      .from('pipeline_stages')
      .update({ grupo: update.grupo, cor_grupo: update.cor_grupo })
      .eq('id', update.stageId);
  }
  await fetchStages();
  return true;
};
```

---

## Templates de Grupos Pré-Definidos

Para facilitar ainda mais, oferecer templates prontos:

| Template | Grupos |
|----------|--------|
| **Comercial/Vendas** | Pré-Sessão (azul), Sessão (violeta), Decisão (roxo), Recuperação (laranja), Desfecho (verde) |
| **Prospecção Simples** | Entrada (cinza), Contato (azul), Qualificação (amarelo), Fechamento (verde) |
| **Onboarding** | Boas-Vindas (azul), Configuração (amarelo), Ativação (verde), Acompanhamento (laranja) |
| **Suporte** | Triagem (azul), Análise (amarelo), Resolução (verde), Encerrado (cinza) |

Botão **"Aplicar Template"** que preenche os grupos automaticamente baseado nos nomes das etapas.

---

## Preview Visual Interativo

O preview na parte inferior mostra:
- Grupos como "chips" horizontais
- Cor de cada grupo
- Contagem de etapas em cada grupo
- Indicador de grupos colapsáveis

---

## Ordem de Implementação

### Fase 1: Componente Principal
1. Criar `StageGroupConfigDialog.tsx` com estrutura básica
2. Adicionar função `batchUpdateStageGroups` no hook
3. Integrar botão no `PipelineManager.tsx`
4. Implementar lista de etapas sem grupo
5. Implementar criação de novos grupos

### Fase 2: Funcionalidades Avançadas
1. Drag-and-drop de etapas para grupos
2. Edição de nome/cor de grupos existentes
3. Preview do Kanban em tempo real
4. Validação e feedback visual

### Fase 3: Polimento
1. Templates pré-definidos
2. Animações de transição
3. Undo/Redo de operações
4. Responsividade mobile

---

## Seção Técnica

### Arquivos a Criar
| Arquivo | Descrição |
|---------|-----------|
| `src/components/settings/StageGroupConfigDialog.tsx` | Dialog principal de configuração |
| `src/components/settings/GroupCard.tsx` | Card visual de cada grupo |
| `src/components/settings/UnassignedStagesList.tsx` | Lista de etapas sem grupo |

### Arquivos a Modificar
| Arquivo | Alteração |
|---------|-----------|
| `src/components/settings/PipelineManager.tsx` | Adicionar botão e dialog |
| `src/hooks/useSupabasePipelineStages.ts` | Adicionar `batchUpdateStageGroups` |

### Dependências
- Nenhuma nova dependência necessária
- Usa React DnD se quiser drag-and-drop sofisticado (opcional)
- Pode usar HTML5 Drag API nativa (já usada no projeto)

### Considerações de Performance
- Batch update em uma única transação
- Estado local durante edição, salva apenas no final
- Preview calculado via `useMemo`
