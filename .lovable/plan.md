
# Plano: Melhorar UX do Dialog de Configuração de Grupos

## Problemas Identificados

### 1. Dropdown com nomes cortados
O `SelectTrigger` tem largura fixa de `w-40` (160px), insuficiente para nomes longos como "Captação e Formalização do Contrato". O dropdown mostra texto truncado e confuso.

### 2. Falta filtro para etapas sem grupo
Com 30 etapas, o usuário precisa rolar toda a lista para encontrar quais ainda não têm grupo.

---

## Solução Proposta

### Mudança 1: Filtro de Visualização

Adicionar toggle/tabs no topo da lista de etapas:

```text
┌──────────────────────────────────────────────────────┐
│  Etapas do Pipeline                                  │
│  ┌─────────────┬────────────────┬──────────────────┐ │
│  │ ◉ Todas (30)│ ○ Sem grupo (8)│ ○ Com grupo (22) │ │
│  └─────────────┴────────────────┴──────────────────┘ │
│  ┌────────────────────────────────────────────────┐  │
│  │ 8  BOAS VINDAS...    [Sem grupo ▼]    [✕]     │  │
│  │ 9  AGUARDANDO...     [Sem grupo ▼]    [✕]     │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Mudança 2: Redesenhar Seletor de Grupo

Substituir o Select com dropdown problemático por uma interface com **botões de grupo** ou **Popover** mais amigável:

**Opção A: Chips de grupo clicáveis**
```text
│ 8  │ BOAS VINDAS...  │ ● Grupo A  ● Grupo B  ○ Grupo C  [✕] │
```

**Opção B: Popover com grade de grupos** (mais escalável)
```text
│ 8  │ BOAS VINDAS...  │ [🔵 Captação... ▼]                   │
                           ┌────────────────────────────┐
                           │ 🔵 Captação e Form...      │
                           │ 🟣 Definição da Prom...    │
                           │ 🟢 Ativação da Página...   │
                           │ ─────────────────────────  │
                           │ ⭕ Sem grupo               │
                           └────────────────────────────┘
```

**Escolha: Popover com largura maior e scroll interno**

### Mudança 3: Melhorar largura do dropdown

Se mantiver o Select, aumentar `w-40` para `w-56` ou `w-64` e adicionar `max-w-[240px] truncate` no conteúdo interno.

---

## Implementação Técnica

### Arquivo: `src/components/settings/StageGroupConfigDialog.tsx`

#### 1. Adicionar estado de filtro
```typescript
const [stageFilter, setStageFilter] = useState<'all' | 'ungrouped' | 'grouped'>('all');
```

#### 2. Calcular contagens
```typescript
const ungroupedCount = useMemo(() => 
  Object.values(stageAssignments).filter(g => g === null).length
, [stageAssignments]);

const groupedCount = useMemo(() => 
  Object.values(stageAssignments).filter(g => g !== null).length
, [stageAssignments]);
```

#### 3. Filtrar etapas exibidas
```typescript
const filteredStages = useMemo(() => {
  switch (stageFilter) {
    case 'ungrouped':
      return sortedStages.filter(s => !stageAssignments[s.id]);
    case 'grouped':
      return sortedStages.filter(s => !!stageAssignments[s.id]);
    default:
      return sortedStages;
  }
}, [sortedStages, stageAssignments, stageFilter]);
```

#### 4. Redesenhar UI do seletor de grupo

Substituir `Select` por `Popover` com lista scrollável:

```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-56 h-8 justify-start text-left">
      {currentGroup ? (
        <div className="flex items-center gap-2 truncate">
          <div 
            className="w-3 h-3 rounded-full shrink-0" 
            style={{ backgroundColor: getGroupColor(currentGroup) }}
          />
          <span className="truncate">{currentGroup}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">Sem grupo</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-64 p-2" align="start">
    <div className="space-y-1 max-h-48 overflow-y-auto">
      <button 
        onClick={() => assignStageToGroup(stage.id, null)}
        className="w-full text-left px-2 py-1.5 rounded hover:bg-muted"
      >
        <span className="text-muted-foreground">Sem grupo</span>
      </button>
      {groups.map(group => (
        <button 
          key={group.nome}
          onClick={() => assignStageToGroup(stage.id, group.nome)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted"
        >
          <div 
            className="w-3 h-3 rounded-full shrink-0" 
            style={{ backgroundColor: group.cor }}
          />
          <span className="truncate">{group.nome}</span>
        </button>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

#### 5. Adicionar tabs de filtro no header da lista

```typescript
<div className="flex items-center justify-between mb-2">
  <Label className="text-sm font-medium">
    Etapas do Pipeline ({sortedStages.length})
  </Label>
  <div className="flex gap-1">
    <Button 
      size="sm" 
      variant={stageFilter === 'all' ? 'default' : 'ghost'}
      onClick={() => setStageFilter('all')}
      className="h-7 text-xs"
    >
      Todas ({sortedStages.length})
    </Button>
    <Button 
      size="sm" 
      variant={stageFilter === 'ungrouped' ? 'default' : 'ghost'}
      onClick={() => setStageFilter('ungrouped')}
      className="h-7 text-xs"
    >
      Sem grupo ({ungroupedCount})
    </Button>
    <Button 
      size="sm" 
      variant={stageFilter === 'grouped' ? 'default' : 'ghost'}
      onClick={() => setStageFilter('grouped')}
      className="h-7 text-xs"
    >
      Com grupo ({groupedCount})
    </Button>
  </div>
</div>
```

---

## Resultado Final

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  🎨 Configurar Grupos - Pipeline Comercial                              [X] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ⚙️ Grupos (3)                    [Comercial] [Prospecção] [Onboarding]    │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ 🟢 Captação e Form... (5)  🟣 Definição... (8)  🟠 Ativação... (8)   │ │
│  │ [●cor] [Novo grupo...______] [+]                                     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Etapas                          [Todas (30)] [Sem grupo (9)] [Com (21)]   │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  8 │ BOAS VINDAS DA PAGINA...   │ [🟣 Definição da Prom... ▼]    [✕] │ │
│  │  9 │ AGUARDANDO ACESSO...       │ [🟣 Definição da Prom... ▼]    [✕] │ │
│  │ 10 │ IGOR AVALIA O PRODUTO      │ [🟣 Definição da Prom... ▼]    [✕] │ │
│  │ 11 │ Igor Aprovou Produto       │ [🟣 Definição da Prom... ▼]    [✕] │ │
│  │ 12 │ IGOR URGENTE               │ [Sem grupo ▼]                  [✕] │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Preview: [🟢 Captação (5)] [🟣 Definição (8)] [🟠 Ativação (8)] [9 s/g]  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                               [Cancelar]  [Salvar Grupos]  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Mudança | Descrição |
|---------|-----------|
| **Filtro de etapas** | Tabs "Todas / Sem grupo / Com grupo" para focar nas pendentes |
| **Popover para grupos** | Substituir Select por Popover com largura maior e scroll interno |
| **Largura do trigger** | Aumentar de `w-40` para `w-56` para acomodar nomes longos |
| **Truncate com tooltip** | Adicionar tooltip no hover para ver nome completo do grupo |

### Arquivo a modificar
- `src/components/settings/StageGroupConfigDialog.tsx`
