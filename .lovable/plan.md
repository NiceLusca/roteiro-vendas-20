
# Plano: Corrigir Exibicao de Valor do Deal no Card de Jeane

## Problema Identificado

O valor do deal (R$ 1.497) de **Jeane Vieira Santana** nao aparece no card do Kanban, embora exista no banco de dados. O problema esta no hook `usePipelineDisplayData` que usa uma **cache key truncada** baseada apenas nos primeiros 10 IDs de leads.

### Causa Raiz

No arquivo `src/hooks/usePipelineDisplayData.ts` (linha 22):

```typescript
queryKey: ['pipeline-deals', pipelineId, leadIds.slice(0, 10).join(',')],
```

Este codigo:
1. Gera uma cache key usando apenas os **primeiros 10** lead IDs
2. Mas a query real (linha 29) busca **todos** os leadIds: `.in('lead_id', leadIds)`
3. Quando um novo deal e criado para um lead fora dos 10 primeiros, a cache key nao muda
4. O React Query retorna dados em cache **sem o novo deal**

### Evidencia

Os primeiros 10 leads (por `data_entrada_etapa DESC`) sao:
1. Valerio Cunha
2. renascertransfertur@gmail.com
3. Elaine Alencar
4. ... (outros)

**Jeane nao esta nesta lista**, mesmo sendo a 2a lead mais antiga. O deal de Kelly (criado hoje) aparece porque Kelly provavelmente esta entre os 10 mais recentes.

---

## Solucao

Modificar a **cache key** para ser mais abrangente e garantir invalidacao correta.

### Opcao A: Usar hash/contagem ao inves de IDs truncados (Recomendada)

Usar `leadIds.length` e um timestamp truncado como cache key, em vez de IDs especificos:

```typescript
// DE:
queryKey: ['pipeline-deals', pipelineId, leadIds.slice(0, 10).join(',')],

// PARA:
queryKey: ['pipeline-deals', pipelineId, leadIds.length],
```

**Vantagem**: Invalida cache quando a quantidade de leads muda
**Desvantagem**: Nao invalida quando apenas um deal e criado (quantidade permanece igual)

### Opcao B: Forcar refetch com staleTime menor + invalidacao manual

Reduzir `staleTime` para 5 segundos e adicionar invalidacao apos criar deal:

```typescript
staleTime: 5000, // 5 segundos em vez de 30
```

### Opcao C: Usar todos os IDs na cache key (Preferida - precisao maxima)

Gerar um hash dos IDs para evitar colisoes:

```typescript
queryKey: ['pipeline-deals', pipelineId, JSON.stringify(leadIds.sort())],
```

**Problema**: Strings muito longas para 97+ leads

### Opcao D: Invalidar cache apos edicao de lead (Abordagem hibrida)

Manter cache key atual mas invalidar queries de deals quando um lead e editado:

```typescript
queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
```

---

## Implementacao Recomendada (Opcao A + D)

### Arquivo: `src/hooks/usePipelineDisplayData.ts`

#### Mudanca 1: Cache key baseada na quantidade de leads

```typescript
// Linha 21-22: Alterar query key para usar contagem + hash simples
const { data: deals = [], isLoading: loadingDeals } = useQuery({
  queryKey: ['pipeline-deals', pipelineId, leadIds.length, leadIds[0], leadIds[leadIds.length - 1]],
  // ...resto mantido
});
```

Esta abordagem:
- Invalida quando a quantidade de leads muda
- Invalida quando o primeiro ou ultimo lead muda
- Mantém cache eficiente para navegacao rapida

#### Mudanca 2: Reduzir staleTime para maior responsividade

```typescript
staleTime: 10000, // 10 segundos (antes: 30 segundos)
```

### Arquivo: `src/components/kanban/LeadEditDialog.tsx`

#### Mudanca 3: Invalidar cache de deals apos salvar

Apos salvar um deal na aba Vendas, invalidar a cache:

```typescript
import { useQueryClient } from '@tanstack/react-query';

// Na funcao de salvar deal:
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/usePipelineDisplayData.ts` | Cache key mais abrangente + staleTime menor |
| `src/components/kanban/LeadEditDialog.tsx` | Invalidar cache apos salvar deal |

---

## Resultado Esperado

Apos implementar:
1. O card de Jeane exibira **R$ 1.497**
2. Novos deals criados aparecerao em ate 10 segundos
3. Deals salvos via edicao de lead aparecerao imediatamente
