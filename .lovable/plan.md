

## Plano: Sistema de Grupos de Etapas com Cores e Fold no Kanban

### Visão Geral
Implementar agrupamento visual de etapas no Kanban com compatibilidade total para pipelines existentes:
- Cores distintas por grupo na barra superior de cada coluna
- Funcionalidade de "fold" (colapsar/expandir) grupos inteiros lateralmente
- **Zero breaking changes**: pipelines sem configuração funcionam exatamente como hoje

---

### Garantias de Compatibilidade

| Campo | Valor NULL | Comportamento |
|-------|------------|---------------|
| `grupo` | `NULL` | Etapa renderizada individualmente (sem wrapper de grupo) |
| `cor_grupo` | `NULL` | Usa cor padrão emerald (#10b981) - visual atual mantido |

**Regra de ouro**: Todo código novo terá fallback para comportamento atual quando campos forem `NULL` ou `undefined`.

---

### Fase 1: Banco de Dados

#### Migration: Adicionar campos opcionais

```sql
-- Campos NULLABLE para compatibilidade total
ALTER TABLE pipeline_stages 
ADD COLUMN IF NOT EXISTS grupo TEXT,
ADD COLUMN IF NOT EXISTS cor_grupo TEXT;

-- Valores NULL por padrão = comportamento atual mantido
COMMENT ON COLUMN pipeline_stages.grupo IS 'Nome do grupo visual (opcional)';
COMMENT ON COLUMN pipeline_stages.cor_grupo IS 'Cor hex do grupo (opcional, padrão emerald)';
```

---

### Fase 2: Atualizar Tipos e Hooks

#### `src/types/crm.ts`
Adicionar campos opcionais ao tipo `PipelineStage`:

```typescript
export interface PipelineStage {
  // ... campos existentes ...
  grupo?: string | null;      // Opcional - NULL = sem grupo
  cor_grupo?: string | null;  // Opcional - NULL = cor padrão
}
```

#### `src/hooks/useSupabasePipelineStages.ts`
Incluir novos campos no select (já são nullable, nada quebra):

```typescript
.select(`
  // ... campos existentes ...
  grupo,
  cor_grupo
`)
```

---

### Fase 3: Cores Dinâmicas nas Colunas

#### `src/components/kanban/KanbanColumn.tsx`
Substituir barra verde fixa por cor dinâmica com fallback:

```typescript
// Linha 263 - Antes:
<div className="h-1 rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/60 mb-2" />

// Depois (com fallback para cor atual):
const stageColor = stage.cor_grupo || '#10b981'; // Emerald como fallback

<div 
  className="h-1 rounded-full mb-2" 
  style={{ 
    background: `linear-gradient(to right, ${stageColor}cc, ${stageColor}99)` 
  }} 
/>
```

**Resultado**: Pipelines sem `cor_grupo` continuam com visual emerald atual.

---

### Fase 4: Agrupamento e Fold

#### Novo Componente: `src/components/kanban/KanbanStageGroup.tsx`

Wrapper que agrupa colunas quando `grupo` é definido:

```text
Estado Expandido:
┌─────────────────────────────────────────────────┐
│ [▼] PRÉ-SESSÃO                         25 leads │
│ ════════════════════════════════════════════════│
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │Agendado│ │Confirm.│ │Remarcou│ │No-Show │    │
│ └────────┘ └────────┘ └────────┘ └────────┘    │
└─────────────────────────────────────────────────┘

Estado Colapsado:
┌──────────────────┐
│ [▶] PRÉ-SESSÃO   │
│     25 leads     │
│   (4 etapas)     │
└──────────────────┘
```

#### `src/components/kanban/KanbanBoard.tsx`

Lógica de agrupamento com fallback para renderização individual:

```typescript
const groupedStages = useMemo(() => {
  const groups = new Map<string | null, typeof stageEntries>();
  
  stageEntries.forEach(entry => {
    const groupName = entry.stage.grupo; // NULL = sem grupo
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(entry);
  });
  
  return Array.from(groups.entries());
}, [stageEntries]);

// Renderização:
{groupedStages.map(([groupName, stages]) => {
  // Etapas SEM grupo = renderização individual (comportamento atual)
  if (!groupName) {
    return stages.map(stageEntry => (
      <KanbanColumn key={stageEntry.stage.id} {...props} />
    ));
  }
  
  // Etapas COM grupo = wrapper com fold
  return (
    <KanbanStageGroup 
      key={groupName}
      groupName={groupName}
      groupColor={stages[0]?.stage.cor_grupo}
      // ...
    >
      {stages.map(stageEntry => (
        <KanbanColumn key={stageEntry.stage.id} {...props} />
      ))}
    </KanbanStageGroup>
  );
})}
```

---

### Fase 5: Formulário de Etapa

#### `src/components/forms/StageForm.tsx`

Adicionar campos opcionais para grupo e cor:

```typescript
// Schema atualizado
const stageSchema = z.object({
  // ... campos existentes ...
  grupo: z.string().optional().nullable(),
  cor_grupo: z.string().optional().nullable(),
});

// Novos campos no form (após o campo "ordem"):
<div className="grid grid-cols-2 gap-4">
  <FormField
    name="grupo"
    label="Grupo Visual"
    placeholder="Ex: Pré-Sessão, Recuperação..."
    description="Opcional - agrupa etapas visualmente no Kanban"
  />
  
  <FormField
    name="cor_grupo"
    label="Cor do Grupo"
    // Color picker ou select com cores pré-definidas
  />
</div>
```

Cores sugeridas (preset):
| Grupo | Cor | Hex |
|-------|-----|-----|
| Pré-Sessão | Azul | `#3B82F6` |
| Sessão | Violeta | `#8B5CF6` |
| Decisão | Púrpura | `#A855F7` |
| Recuperação | Laranja | `#F97316` |
| Desfecho | Verde | `#10B981` |

---

### Resumo de Compatibilidade

| Situação | Comportamento |
|----------|---------------|
| Pipeline existente sem config | Funciona 100% igual ao atual |
| Etapa com `grupo = NULL` | Renderiza individualmente |
| Etapa com `cor_grupo = NULL` | Usa cor emerald padrão |
| Pipeline novo com grupos | Mostra wrapper + fold |
| Mistura de etapas com/sem grupo | Ambos funcionam lado a lado |

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova migration com campos NULLABLE |
| `src/types/crm.ts` | Adicionar `grupo?` e `cor_grupo?` |
| `src/hooks/useSupabasePipelineStages.ts` | Incluir novos campos no select |
| `src/components/kanban/KanbanColumn.tsx` | Cor dinâmica com fallback |
| `src/components/kanban/KanbanBoard.tsx` | Lógica de agrupamento |
| `src/components/kanban/KanbanStageGroup.tsx` | **Novo** - wrapper de grupo |
| `src/components/forms/StageForm.tsx` | Campos opcionais grupo/cor |

---

### Seção Técnica

#### Persistência do Estado de Collapse
- localStorage key: `kanban-collapsed-groups-{pipelineId}`
- Valor: `["Recuperação", "Desfecho"]` (array de grupos colapsados)
- Carregado no mount, atualizado no toggle

#### Performance
- Agrupamento via `useMemo` - recalcula só quando `stageEntries` muda
- Estado de collapse não afeta re-renders das colunas internas
- Etapas sem grupo = zero overhead adicional

#### Drag-and-Drop
- Arrastar card entre grupos funciona normalmente
- Arrastar coluna para outro grupo pode atualizar o campo `grupo` automaticamente (opcional, pode ser só manual via form)

