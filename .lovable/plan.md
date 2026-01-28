

# Plano: Corrigir Aba de Vendas e Adicionar Seletor de Origem na Agenda

## Problemas Identificados

### 1. Legenda do checkbox "Venda Recorrente" invertida
A legenda atual mostra:
- Quando **desmarcado**: "Pagamento à vista (única vez)"
- Quando **marcado**: "Mensalidade / Assinatura"

O problema é que quando desmarcado aparece "à vista", mas semanticamente isso não faz sentido com "Venda Recorrente". A legenda deveria indicar claramente o estado atual.

### 2. Nenhum produto cadastrado
A lista de produtos está vazia porque a tabela `products` não tem registros. O ProductManager existe em Configuracoes > Produtos, mas o usuario precisa cadastrar produtos antes de poder selecioná-los nas vendas.

### 3. Sem seletor de origem na aba Agenda
A aba Agenda não possui campo para selecionar/editar a origem do lead. É necessario adicionar um dropdown com as origens existentes e a opcao de criar novas.

---

## Solucoes

### 1. Corrigir legenda do checkbox "Venda Recorrente"

**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

Alterar a logica da legenda (linhas 1225-1229):

```text
DE:
{vendaRecorrente 
  ? 'Mensalidade / Assinatura' 
  : 'Pagamento à vista (única vez)'}

PARA:
Marque se esta venda é recorrente (assinatura/mensalidade)
```

A nova legenda será fixa e descritiva, semelhante ao checkbox "Venda Confirmada".

### 2. Adicionar link para cadastrar produtos

Na secao de produtos do formulario de vendas, quando nao houver produtos, mostrar link para ir às Configuracoes > Produtos.

**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

```text
DE:
<p className="p-3 text-sm text-muted-foreground text-center">
  Nenhum produto cadastrado
</p>

PARA:
<div className="p-3 text-center">
  <p className="text-sm text-muted-foreground mb-2">Nenhum produto cadastrado</p>
  <Button variant="link" size="sm" onClick={() => window.open('/settings?tab=products', '_blank')}>
    Cadastrar produtos
  </Button>
</div>
```

### 3. Adicionar seletor de origem na aba Agenda

**Arquivo:** `src/components/kanban/LeadEditDialog.tsx`

Criar novo campo na aba Agenda com:
- Dropdown mostrando origens existentes (buscadas do banco)
- Input para adicionar nova origem
- Botao para criar nova origem

Dados necessarios:
- Buscar origens distintas: `SELECT DISTINCT origem FROM leads WHERE origem IS NOT NULL`
- As origens existentes sao: "Agenda Oceano", "Mentoria Society - GAB", "No plan b", "Outro", etc.

Layout proposto na aba Agenda:
```text
+--------------------------------------------------+
| Origem do Lead                                   |
|  [Dropdown: Agenda Oceano ▼]  [+ Nova]           |
+--------------------------------------------------+
| Novo Agendamento                                 |
| ...campos existentes...                          |
+--------------------------------------------------+
```

---

## Arquivos a Modificar

| # | Arquivo | Alteracao |
|---|---------|-----------|
| 1 | `src/components/kanban/LeadEditDialog.tsx` | - Corrigir legenda do checkbox recorrente |
|   |                                            | - Adicionar link para cadastrar produtos |
|   |                                            | - Adicionar seletor de origem na aba Agenda |

---

## Detalhes Tecnicos

### Estados adicionais necessarios no LeadEditDialog:
```typescript
const [origens, setOrigens] = useState<string[]>([]);
const [selectedOrigem, setSelectedOrigem] = useState<string>(lead.origem || '');
const [newOrigem, setNewOrigem] = useState('');
const [addingOrigem, setAddingOrigem] = useState(false);
```

### Query para buscar origens:
```typescript
const fetchOrigens = async () => {
  const { data } = await supabase
    .from('leads')
    .select('origem')
    .not('origem', 'is', null);
  
  const unique = [...new Set(data?.map(d => d.origem).filter(Boolean))];
  setOrigens(unique.sort());
};
```

### Handler para salvar origem:
```typescript
const handleSaveOrigem = async () => {
  const origemToSave = selectedOrigem || newOrigem;
  if (!origemToSave) return;
  
  await saveLead({
    id: lead.id,
    origem: origemToSave
  });
  
  toast.success('Origem atualizada');
  onUpdate?.();
};
```

### UI do seletor de origem:
```tsx
<div className="p-4 border rounded-lg bg-muted/30 space-y-4 mb-4">
  <h4 className="font-medium flex items-center gap-2">
    <MapPin className="h-4 w-4" />
    Origem do Lead
  </h4>
  
  <div className="flex gap-2">
    <Select value={selectedOrigem} onValueChange={(v) => {
      setSelectedOrigem(v);
      setAddingOrigem(false);
    }}>
      <SelectTrigger className="flex-1">
        <SelectValue placeholder="Selecione a origem" />
      </SelectTrigger>
      <SelectContent>
        {origens.map(o => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    
    <Button variant="outline" size="icon" onClick={() => setAddingOrigem(!addingOrigem)}>
      <Plus className="h-4 w-4" />
    </Button>
  </div>
  
  {addingOrigem && (
    <div className="flex gap-2">
      <Input 
        placeholder="Nova origem..." 
        value={newOrigem}
        onChange={(e) => setNewOrigem(e.target.value)}
      />
      <Button onClick={handleAddOrigem}>Adicionar</Button>
    </div>
  )}
  
  <Button onClick={handleSaveOrigem} className="w-full">
    Salvar Origem
  </Button>
</div>
```

---

## Resultado Esperado

1. **Checkbox Recorrente**: Legenda clara "Marque se esta venda é recorrente (assinatura/mensalidade)"

2. **Produtos**: Quando vazio, mostra link "Cadastrar produtos" que abre Configuracoes em nova aba

3. **Origem na Agenda**: 
   - Dropdown com origens existentes
   - Botao para adicionar nova origem
   - Salva automaticamente no lead

