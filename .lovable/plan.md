

# Plano: Corrigir Layout do AppointmentSelectorDialog

## Problemas Identificados

1. **Titulo truncado incorretamente**: O `truncate` no titulo esta cortando "Confirme o agendamento" sem necessidade
2. **Titulo do agendamento extrapolando**: O texto longo do titulo do appointment nao esta respeitando os limites do card
3. **Dialog estreito demais**: 425px nao comporta bem nomes longos de etapas e leads
4. **Layout do footer confuso**: A estrutura atual dos botoes esta desorganizada

## Solucao

### 1. Aumentar largura do dialog
- Mudar de `sm:max-w-[425px]` para `sm:max-w-md` (448px) ou `sm:max-w-lg` (512px)

### 2. Remover truncate do titulo
- O titulo "Confirme o agendamento" ou "Selecione o agendamento" e curto e nao precisa de truncate

### 3. Garantir overflow hidden no card
- Adicionar `overflow-hidden` no container do card de agendamento
- Garantir que o Label tenha `overflow-hidden` para conter o texto

### 4. Simplificar footer
- Usar layout horizontal simples com `justify-between`
- Agrupar botoes secundarios a esquerda e primario a direita

## Alteracoes no Arquivo

`src/components/kanban/AppointmentSelectorDialog.tsx`

### DialogContent (linha 87)
De:
```tsx
<DialogContent className="sm:max-w-[425px] max-w-[95vw]">
```
Para:
```tsx
<DialogContent className="sm:max-w-md w-full">
```

### DialogTitle (linhas 89-94)
De:
```tsx
<DialogTitle className="flex items-center gap-2">
  <Calendar className="w-5 h-5 text-primary shrink-0" />
  <span className="truncate">
    {appointments.length === 1 ? 'Confirme o agendamento' : 'Selecione o agendamento'}
  </span>
</DialogTitle>
```
Para:
```tsx
<DialogTitle className="flex items-center gap-2">
  <Calendar className="w-5 h-5 text-primary" />
  {appointments.length === 1 ? 'Confirme o agendamento' : 'Selecione o agendamento'}
</DialogTitle>
```

### Card do agendamento (linhas 116-149)
De:
```tsx
<div 
  key={apt.id}
  className={`flex items-start space-x-3 rounded-lg border p-3 transition-colors ${...}`}
>
  <RadioGroupItem value={apt.id} id={apt.id} className="mt-1 shrink-0" />
  <Label 
    htmlFor={apt.id} 
    className="flex-1 min-w-0 cursor-pointer"
  >
```
Para:
```tsx
<div 
  key={apt.id}
  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors overflow-hidden ${...}`}
>
  <RadioGroupItem value={apt.id} id={apt.id} className="mt-0.5 shrink-0" />
  <Label 
    htmlFor={apt.id} 
    className="flex-1 min-w-0 cursor-pointer overflow-hidden"
  >
```

### Titulo do agendamento (linhas 141-144)
De:
```tsx
{apt.titulo && (
  <p className="text-sm text-muted-foreground pl-6 break-words line-clamp-2">
    {apt.titulo}
  </p>
)}
```
Para:
```tsx
{apt.titulo && (
  <p className="text-sm text-muted-foreground pl-6 truncate" title={apt.titulo}>
    {apt.titulo}
  </p>
)}
```

### DialogFooter (linhas 154-176)
De:
```tsx
<DialogFooter className="flex-col sm:flex-row gap-2">
  <div className="flex gap-2 w-full sm:w-auto">
    <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1 sm:flex-none">
      Cancelar
    </Button>
    {onCreateNew && (
      <Button variant="ghost" onClick={handleCreateNew} disabled={isLoading} className="flex-1 sm:flex-none">
        <Plus className="w-4 h-4 mr-2" />
        Criar novo prazo
      </Button>
    )}
  </div>
  <Button onClick={handleConfirm} disabled={!selectedId || isLoading} className="w-full sm:w-auto">
    ...
  </Button>
</DialogFooter>
```
Para:
```tsx
<DialogFooter className="flex flex-row justify-between gap-2 pt-2">
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
      Cancelar
    </Button>
    {onCreateNew && (
      <Button variant="ghost" size="sm" onClick={handleCreateNew} disabled={isLoading}>
        <Plus className="w-4 h-4 mr-1" />
        Novo prazo
      </Button>
    )}
  </div>
  <Button size="sm" onClick={handleConfirm} disabled={!selectedId || isLoading}>
    ...
  </Button>
</DialogFooter>
```

## Layout Final Esperado

```text
+------------------------------------------+
| [x] Confirme o agendamento            X  |
|                                          |
| A etapa "Nome da Etapa" calcula o SLA    |
| baseado na data do agendamento.          |
| Confirme se este é o agendamento         |
| correto para Nome do Lead:               |
|                                          |
| +--------------------------------------+ |
| | O  27/01/2026 às 16:15    [Passado]  | |
| |    Sessão Estratégica-Gênios da O... | |
| +--------------------------------------+ |
|                                          |
| [Cancelar] [+ Novo prazo]   [Confirmar]  |
+------------------------------------------+
```

## Resultado

- Dialog com largura adequada para desktop
- Titulo sem truncamento desnecessario
- Texto do agendamento contido no card com truncate e tooltip
- Botoes organizados: secundarios a esquerda, primario a direita
- Botoes menores (size="sm") para caber melhor

