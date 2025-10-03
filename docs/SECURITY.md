# Guia de Segurança

## Checklist de Segurança

### ✅ Implementado

#### Input Validation
- [x] Validação com Zod em todos os formulários
- [x] Sanitização de texto para prevenir XSS
- [x] Validação de números com limites
- [x] Validação de WhatsApp brasileiro
- [x] Validação de email

#### Logging Seguro
- [x] Removido console.logs em produção
- [x] Logger estruturado (logger.ts)
- [x] Logs sem dados sensíveis

#### Build Security
- [x] Console.logs removidos via Terser
- [x] Minificação ativa
- [x] Source maps apenas em dev

#### Database Security
- [x] Row Level Security (RLS) ativo
- [x] Policies por tabela
- [x] Autenticação JWT via Supabase

### ⚠️ Ação Requerida pelo Usuário

#### Supabase Configuration
- [ ] **CRÍTICO**: Atualizar versão do Postgres
  - Acesse: Supabase Dashboard > Project Settings > Database
  - Atualize para a última versão para receber patches de segurança

- [ ] **IMPORTANTE**: Ativar Leaked Password Protection
  - Acesse: Supabase Dashboard > Authentication > Settings
  - Habilite "Leaked Password Protection"
  - Previne uso de senhas vazadas em data breaches

## Práticas de Segurança

### 1. Input Validation

**SEMPRE valide inputs do usuário:**

```typescript
import { leadSchema } from '@/schemas/leadValidation';

// Validar antes de salvar
const result = leadSchema.safeParse(formData);
if (!result.success) {
  // Tratar erros
  return;
}
```

### 2. Sanitização

**Sanitize texto antes de renderizar:**

```typescript
import { sanitizeText } from '@/schemas/leadValidation';

const safeText = sanitizeText(userInput);
```

### 3. Secrets Management

**NUNCA comite secrets no código:**

```typescript
// ❌ ERRADO
const API_KEY = 'sk-1234567890abcdef';

// ✅ CORRETO
const API_KEY = import.meta.env.VITE_API_KEY;
```

**Adicione ao .gitignore:**
```
.env
.env.local
.env.production
```

### 4. HTTPS Only

**Sempre use HTTPS em produção:**

```typescript
// vite.config.ts
server: {
  https: true, // Em produção
}
```

### 5. Content Security Policy

**Configure CSP headers:**

```typescript
// Exemplo de CSP seguro
"Content-Security-Policy": 
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' data:; " +
  "connect-src 'self' https://*.supabase.co"
```

## Supabase Row Level Security

### Estrutura de Policies

**Leads Table:**
```sql
-- Users só veem seus próprios leads
CREATE POLICY "Users can view own leads"
ON leads FOR SELECT
USING (auth.uid() = user_id);

-- Users só criam leads para si mesmos
CREATE POLICY "Users can create own leads"
ON leads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users só atualizam seus próprios leads
CREATE POLICY "Users can update own leads"
ON leads FOR UPDATE
USING (auth.uid() = user_id);
```

### Verificação de Policies

**Rodar periodicamente:**

```sql
-- Verificar policies ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Verificar tabelas sem RLS
SELECT 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_policies
  );
```

## Auditoria

### Log de Ações Sensíveis

**Use o sistema de auditoria:**

```typescript
const { logAction } = useAudit();

logAction({
  action: 'lead_deleted',
  targetId: leadId,
  targetType: 'lead',
  details: { reason: 'User request' }
});
```

### Monitoramento

**Configurar alertas para:**
- Múltiplas tentativas de login falhas
- Alterações em dados sensíveis
- Exportação massiva de dados
- Mudanças em configurações críticas

## Compliance

### LGPD (Brasil)

- [x] Consentimento explícito para coleta de dados
- [x] Direito ao esquecimento (delete lead)
- [x] Portabilidade de dados (export)
- [x] Log de alterações (audit log)

### GDPR (Europa)

- [x] Direito de acesso aos dados
- [x] Direito de correção
- [x] Direito de exclusão
- [x] Minimização de dados

## Incident Response

### Em caso de breach:

1. **Contenção Imediata**
   - Isolar sistema afetado
   - Revogar tokens comprometidos
   - Mudar credenciais

2. **Investigação**
   - Analisar logs de auditoria
   - Identificar escopo do incidente
   - Documentar tudo

3. **Notificação**
   - Notificar usuários afetados
   - Reportar à autoridade (ANPD no Brasil)
   - Comunicar stakeholders

4. **Remediação**
   - Corrigir vulnerabilidade
   - Fortalecer segurança
   - Atualizar documentação

## Contatos

**Reportar vulnerabilidade:**
- Email: security@[seu-dominio].com
- Política: Responsible disclosure
- Prazo de resposta: 48h

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [LGPD](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
