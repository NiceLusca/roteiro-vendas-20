# Arquitetura do Sistema CRM

## Visão Geral

Sistema de CRM fullstack construído com React, TypeScript, Supabase e TanStack Query.

## Stack Tecnológica

### Frontend
- **React 18**: UI library com hooks modernos
- **TypeScript**: Type safety e melhor DX
- **Vite**: Build tool rápido com HMR
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Componentes acessíveis e customizáveis
- **TanStack Query**: Data fetching e caching inteligente
- **React Router**: Navegação SPA

### Backend
- **Supabase**: BaaS com PostgreSQL
- **Row Level Security**: Segurança nativa do banco
- **Realtime**: Subscriptions para dados ao vivo
- **Edge Functions**: Serverless functions

### Ferramentas
- **Zod**: Validação de schemas
- **date-fns**: Manipulação de datas
- **Lucide React**: Ícones
- **DnD Kit**: Drag and drop

## Estrutura de Pastas

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes de UI base (shadcn)
│   ├── forms/          # Formulários
│   ├── kanban/         # Kanban board
│   ├── leads/          # Gestão de leads
│   ├── pipeline/       # Pipeline management
│   └── ...
├── contexts/           # React contexts
│   ├── AuthContext     # Autenticação
│   ├── CRMContext      # Estado global CRM
│   └── AuditContext    # Auditoria
├── hooks/              # Custom hooks
│   ├── useOptimized*   # Hooks otimizados
│   ├── useSupabase*    # Hooks Supabase
│   └── ...
├── pages/              # Páginas/Rotas
├── schemas/            # Schemas Zod
├── types/              # TypeScript types
├── utils/              # Utilitários
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente Supabase
└── lib/                # Configurações
```

## Padrões e Convenções

### Nomenclatura
- **Componentes**: PascalCase (`LeadForm.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useOptimizedLeads.ts`)
- **Utilitários**: camelCase (`formatters.ts`)
- **Types**: PascalCase (`Lead`, `Pipeline`)

### Organização de Componentes
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export function Component({ }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => { };
  
  // 6. Effects
  useEffect(() => { }, []);
  
  // 7. Render
  return ( );
}
```

### Data Fetching
- Use `@tanstack/react-query` para todas as operações de dados
- Configure `staleTime` e `gcTime` apropriadamente
- Use hooks customizados (`useOptimizedLeads`)

### State Management
- Local state: `useState`, `useReducer`
- Shared state: React Context
- Server state: TanStack Query
- Form state: React Hook Form

### Error Handling
- Componentes: Error Boundaries
- Async: Try-catch com toast notifications
- Forms: Validação com Zod

### Performance
- Memoize componentes caros com `React.memo`
- Use `useMemo` e `useCallback` para otimizações
- Virtual scrolling para listas grandes
- Code splitting por rota

## Fluxo de Dados

```
User Action
    ↓
Component Handler
    ↓
Custom Hook (useOptimizedLeads)
    ↓
TanStack Query
    ↓
Supabase Client
    ↓
PostgreSQL (RLS)
    ↓
Response
    ↓
Cache Update
    ↓
UI Re-render
```

## Segurança

### Frontend
- Input validation (Zod)
- Sanitização de dados
- XSS prevention
- HTTPS only

### Backend (Supabase)
- Row Level Security (RLS)
- Policies por tabela
- Autenticação JWT
- Rate limiting

## Performance

### Build
- Code splitting automático
- Tree shaking
- Minification (Terser)
- Gzip/Brotli compression

### Runtime
- Lazy loading de rotas
- Virtual scrolling
- Memoização estratégica
- React Query caching

### Network
- Request deduplication
- Parallel requests
- Optimistic updates
- Stale-while-revalidate

## Testes

### Estratégia
- Unit tests: Vitest
- Integration tests: React Testing Library
- E2E tests: Playwright (recomendado)

### Coverage
- Mínimo: 70%
- Crítico: 90%+ (hooks de dados, validação)

## Deploy

### Produção
- Build otimizado
- Environment variables
- CDN para assets
- Monitoring ativo

### Staging
- Preview deployments
- Testing environment
- Performance testing

## Monitoramento

### Métricas
- Web Vitals (LCP, FID, CLS)
- Bundle size
- API response times
- Error rates

### Ferramentas
- Console estruturado (logger.ts)
- Error tracking (Sentry recomendado)
- Analytics (Google Analytics/Plausible)

## Próximos Passos

1. Implementar testes automatizados
2. Adicionar error tracking (Sentry)
3. Configurar CI/CD
4. Documentar APIs
5. Adicionar feature flags
